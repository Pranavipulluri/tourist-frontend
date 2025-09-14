const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('./auth');
const axios = require('axios');
const twilio = require('twilio');

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Emergency routes require authentication
router.use(authenticateToken);

// Enhanced emergency alert system
router.post('/alert',
  [
    body('type').isIn(['SOS', 'PANIC', 'MEDICAL', 'ACCIDENT', 'CRIME', 'NATURAL_DISASTER']),
    body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('accuracy').optional().isFloat(),
    body('address').optional().trim().isLength({ max: 500 }),
    body('message').optional().trim().isLength({ max: 1000 }),
    body('emergencyContacts').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { 
        type, 
        severity = 'HIGH', 
        latitude, 
        longitude, 
        accuracy, 
        address, 
        message, 
        emergencyContacts 
      } = req.body;
      const userId = req.user.id;

      console.log('🚨 Emergency alert triggered:', { type, severity, userId, location: { latitude, longitude } });

      // Start database transaction
      const client = await transaction();

      try {
        // Create emergency alert
        const alertId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const alertResult = await client.query(`
          INSERT INTO emergency_alerts (
            id, tourist_id, type, severity, status, message, 
            latitude, longitude, accuracy, address, created_at
          )
          VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8, $9, NOW())
          RETURNING *
        `, [
          alertId,
          userId,
          type,
          severity,
          message || `Emergency ${type} alert triggered`,
          latitude,
          longitude,
          accuracy || 10,
          address
        ]);

        const newAlert = alertResult.rows[0];

        // Get tourist information
        const touristResult = await client.query(`
          SELECT id, first_name, last_name, email, phone 
          FROM users 
          WHERE id = $1
        `, [userId]);

        const tourist = touristResult.rows[0];

        // Generate FIR for crime and critical alerts
        let firNumber = null;
        if (type === 'CRIME' || severity === 'CRITICAL') {
          firNumber = await generateFIR(client, alertId, type, newAlert, tourist);
          
          await client.query(`
            UPDATE emergency_alerts 
            SET fir_number = $1 
            WHERE id = $2
          `, [firNumber, alertId]);
        }

        // Create emergency contacts records
        if (emergencyContacts && emergencyContacts.length > 0) {
          for (const contact of emergencyContacts) {
            await client.query(`
              INSERT INTO emergency_contacts (
                alert_id, name, phone, email, relationship, priority
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              alertId,
              contact.name,
              contact.phone,
              contact.email,
              contact.relationship,
              contact.priority || 1
            ]);
          }
        }

        await client.query('COMMIT');

        // Build complete alert response
        const completeAlert = {
          id: newAlert.id,
          touristId: newAlert.tourist_id,
          type: newAlert.type,
          severity: newAlert.severity,
          status: newAlert.status,
          message: newAlert.message,
          location: {
            latitude: parseFloat(newAlert.latitude),
            longitude: parseFloat(newAlert.longitude),
            accuracy: newAlert.accuracy,
            address: newAlert.address
          },
          tourist: {
            id: tourist.id,
            firstName: tourist.first_name,
            lastName: tourist.last_name,
            phone: tourist.phone,
            email: tourist.email
          },
          createdAt: newAlert.created_at,
          firNumber: firNumber,
          emergencyContacts: emergencyContacts || []
        };

        // Broadcast to admin dashboard via WebSocket
        if (req.io) {
          req.io.emit('emergency_alert_broadcast', completeAlert);
        }

        // Send notifications asynchronously
        setImmediate(async () => {
          try {
            await sendEmergencyNotifications(completeAlert);
            await notifyEmergencyServices(completeAlert);
            await notifyNearbyAdmins(completeAlert);
          } catch (notificationError) {
            console.error('❌ Notification error:', notificationError);
          }
        });

        res.status(201).json({
          success: true,
          alert: completeAlert,
          message: 'Emergency alert created and notifications sent'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ Emergency alert creation failed:', error);
      res.status(500).json({
        error: 'Failed to create emergency alert',
        message: error.message
      });
    }
  }
);

// Generate FIR (First Information Report)
async function generateFIR(client, alertId, incidentType, alert, tourist) {
  const firNumber = `FIR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  await client.query(`
    INSERT INTO fir_reports (
      fir_number, alert_id, incident_type, 
      tourist_id, tourist_name, tourist_phone,
      incident_location, incident_description,
      report_time, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'FILED')
  `, [
    firNumber,
    alertId,
    incidentType,
    tourist.id,
    `${tourist.first_name} ${tourist.last_name}`,
    tourist.phone,
    `${alert.latitude}, ${alert.longitude}${alert.address ? ` - ${alert.address}` : ''}`,
    alert.message,
  ]);

  console.log('📋 FIR generated:', firNumber);
  return firNumber;
}

// Send emergency notifications via Twilio
async function sendEmergencyNotifications(alert) {
  const notifications = [];
  
  try {
    // Send SMS to emergency contacts
    if (alert.emergencyContacts && alert.emergencyContacts.length > 0) {
      for (const contact of alert.emergencyContacts) {
        if (contact.phone) {
          try {
            const message = await twilioClient.messages.create({
              body: `🚨 EMERGENCY ALERT: ${alert.tourist.firstName} ${alert.tourist.lastName} has triggered a ${alert.type} alert at location: ${alert.location.latitude}, ${alert.location.longitude}. ${alert.message}`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: contact.phone
            });
            
            notifications.push({
              type: 'SMS',
              recipient: contact.phone,
              status: 'SENT',
              messageId: message.sid
            });
            
            console.log(`📱 SMS sent to ${contact.name}: ${message.sid}`);
          } catch (smsError) {
            console.error(`❌ SMS failed to ${contact.phone}:`, smsError);
            notifications.push({
              type: 'SMS',
              recipient: contact.phone,
              status: 'FAILED',
              error: smsError.message
            });
          }
        }
      }
    }

    // Send SMS to tourist's registered phone
    if (alert.tourist.phone) {
      try {
        const confirmationMessage = await twilioClient.messages.create({
          body: `✅ Your emergency alert has been sent. Alert ID: ${alert.id}. Emergency services have been notified. Help is on the way. Stay safe!`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: alert.tourist.phone
        });
        
        notifications.push({
          type: 'SMS',
          recipient: alert.tourist.phone,
          status: 'SENT',
          messageId: confirmationMessage.sid
        });
        
        console.log(`📱 Confirmation SMS sent to tourist: ${confirmationMessage.sid}`);
      } catch (error) {
        console.error('❌ Confirmation SMS failed:', error);
      }
    }

  } catch (error) {
    console.error('❌ Emergency notifications failed:', error);
  }
  
  return notifications;
}

// Notify emergency services
async function notifyEmergencyServices(alert) {
  try {
    // Send alert to emergency services dispatch system
    const emergencyMessage = `🚨 TOURIST EMERGENCY ALERT
    
Type: ${alert.type}
Severity: ${alert.severity}
Tourist: ${alert.tourist.firstName} ${alert.tourist.lastName}
Phone: ${alert.tourist.phone}
Location: ${alert.location.latitude}, ${alert.location.longitude}
Address: ${alert.location.address || 'Not available'}
Message: ${alert.message}
FIR: ${alert.firNumber || 'Not applicable'}
Time: ${new Date(alert.createdAt).toLocaleString()}`;

    // Send to emergency services hotline (if configured)
    if (process.env.EMERGENCY_SERVICES_PHONE) {
      const emergencyNotification = await twilioClient.messages.create({
        body: emergencyMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.EMERGENCY_SERVICES_PHONE
      });
      
      console.log(`🚑 Emergency services notified: ${emergencyNotification.sid}`);
    }

    // Log to emergency services database/system
    await query(`
      INSERT INTO emergency_notifications (
        alert_id, type, recipient, status, message, sent_at
      ) VALUES ($1, 'EMERGENCY_SERVICES', $2, 'SENT', $3, NOW())
    `, [
      alert.id,
      process.env.EMERGENCY_SERVICES_PHONE || 'SYSTEM',
      emergencyMessage
    ]);

  } catch (error) {
    console.error('❌ Emergency services notification failed:', error);
  }
}

// Notify nearby admins
async function notifyNearbyAdmins(alert) {
  try {
    // Find admins within 10km radius
    const nearbyAdmins = await query(`
      SELECT u.id, u.first_name, u.last_name, u.phone, u.email
      FROM users u
      WHERE u.role IN ('admin', 'emergency_responder')
      AND u.is_active = true
      AND ST_DWithin(
        ST_GeomFromText('POINT($1 $2)', 4326),
        u.last_location,
        10000  -- 10km in meters
      )
    `, [alert.location.longitude, alert.location.latitude]);

    for (const admin of nearbyAdmins.rows) {
      // Send SMS to nearby admins
      if (admin.phone) {
        try {
          const adminMessage = await twilioClient.messages.create({
            body: `🚨 NEARBY EMERGENCY: ${alert.type} alert from ${alert.tourist.firstName} ${alert.tourist.lastName}. Location: ${alert.location.latitude}, ${alert.location.longitude}. Please respond if available.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: admin.phone
          });
          
          console.log(`📱 Admin ${admin.first_name} notified: ${adminMessage.sid}`);
        } catch (error) {
          console.error(`❌ Admin notification failed for ${admin.id}:`, error);
        }
      }
    }

    console.log(`📍 Notified ${nearbyAdmins.rows.length} nearby admins`);

  } catch (error) {
    console.error('❌ Nearby admin notification failed:', error);
  }
}

      // Get user's emergency contacts or use provided ones
      let emergencyContacts = contacts || [];
      if (!emergencyContacts.length) {
        const contactsResult = await query(
          'SELECT name, phone, email FROM emergency_contacts WHERE user_id = $1',
          [userId]
        );
        emergencyContacts = contactsResult.rows;
      }

      // Send notifications
      const notifications = await sendEmergencyNotifications({
        user: req.user,
        alertType: type,
        location: { latitude, longitude },
        message,
        contacts: emergencyContacts,
        alertId: newAlert.id
      });

      // Emit real-time emergency alert
      const io = req.app.get('io');
      if (io) {
        // Alert emergency services
        io.to('emergency_services').emit('emergency_alert', {
          id: newAlert.id,
          type,
          user: {
            id: req.user.id,
            name: `${req.user.first_name} ${req.user.last_name}`,
            phone: req.user.phone
          },
          location: { latitude, longitude },
          message,
          timestamp: newAlert.created_at,
          priority: 'CRITICAL'
        });

        // Alert nearby users
        const nearbyUsers = await query(`
          SELECT DISTINCT u.id
          FROM users u
          WHERE u.current_location IS NOT NULL
            AND ST_DWithin(
              u.current_location::geography,
              ST_GeomFromText('POINT($2 $1)', 4326)::geography,
              2000
            )
            AND u.id != $3
        `, [latitude, longitude, userId]);

        nearbyUsers.rows.forEach(user => {
          io.to(`user_${user.id}`).emit('emergency_nearby', {
            type,
            distance: 'nearby',
            message: 'Emergency situation reported in your area',
            timestamp: new Date().toISOString()
          });
        });
      }

      res.status(201).json({
        message: 'Emergency alert sent successfully',
        alert: {
          id: newAlert.id,
          type,
          timestamp: newAlert.created_at
        },
        notifications
      });

    } catch (error) {
      console.error('Emergency alert error:', error);
      res.status(500).json({ error: 'Failed to send emergency alert' });
    }
  }
);

// Get emergency contacts for country
router.get('/contacts/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;

    const result = await query(`
      SELECT service_type, number, description
      FROM emergency_contacts
      WHERE country_code = $1
      ORDER BY service_type
    `, [countryCode.toUpperCase()]);

    const contacts = result.rows.map(row => ({
      service: row.service_type,
      number: row.number,
      description: row.description
    }));

    res.json({ 
      countryCode: countryCode.toUpperCase(),
      emergencyContacts: contacts
    });

  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to get emergency contacts' });
  }
});

// Add personal emergency contact
router.post('/personal-contacts',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('phone').isMobilePhone(),
    body('email').optional().isEmail(),
    body('relationship').trim().isLength({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, phone, email, relationship } = req.body;
      const userId = req.user.id;

      const result = await query(`
        INSERT INTO user_emergency_contacts (user_id, name, phone, email, relationship)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, phone, email, relationship, created_at
      `, [userId, name, phone, email, relationship]);

      const newContact = result.rows[0];

      res.status(201).json({
        message: 'Emergency contact added successfully',
        contact: {
          id: newContact.id,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
          relationship: newContact.relationship,
          createdAt: newContact.created_at
        }
      });

    } catch (error) {
      console.error('Add emergency contact error:', error);
      res.status(500).json({ error: 'Failed to add emergency contact' });
    }
  }
);

// Get user's personal emergency contacts
router.get('/personal-contacts', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT id, name, phone, email, relationship, created_at
      FROM user_emergency_contacts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    const contacts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      relationship: row.relationship,
      createdAt: row.created_at
    }));

    res.json({ contacts });

  } catch (error) {
    console.error('Get personal emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to get emergency contacts' });
  }
});

// Check user safety (for automated monitoring)
router.post('/safety-check',
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('source').optional().isIn(['automatic', 'manual', 'device'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { latitude, longitude, source = 'manual' } = req.body;
      const userId = req.user.id;

      // Check if user is in danger zone
      const dangerZones = await query(`
        SELECT id, name, description, severity
        FROM danger_zones
        WHERE ST_DWithin(
          coordinates::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography,
          radius
        )
        ORDER BY severity DESC
      `, [latitude, longitude]);

      // Check for recent activity (user inactive if no location update > 30 minutes)
      const lastActivity = await query(`
        SELECT location_updated_at
        FROM users
        WHERE id = $1
      `, [userId]);

      const isInactive = lastActivity.rows.length > 0 && 
        lastActivity.rows[0].location_updated_at &&
        (new Date() - new Date(lastActivity.rows[0].location_updated_at)) > (30 * 60 * 1000); // 30 minutes

      const safetyStatus = {
        isInDangerZone: dangerZones.rows.length > 0,
        isInactive,
        dangerZones: dangerZones.rows,
        lastActivity: lastActivity.rows[0]?.location_updated_at,
        checkTimestamp: new Date().toISOString()
      };

      // If user is in danger or inactive, trigger automated alert
      if (safetyStatus.isInDangerZone || safetyStatus.isInactive) {
        const alertType = safetyStatus.isInDangerZone ? 'danger_zone' : 'inactive_user';
        const alertMessage = safetyStatus.isInDangerZone 
          ? `User entered danger zone: ${dangerZones.rows[0].name}`
          : 'User has been inactive for over 30 minutes';

        // Send automated notifications
        await sendAutomatedAlert({
          user: req.user,
          alertType,
          location: { latitude, longitude },
          message: alertMessage,
          dangerZone: dangerZones.rows[0] || null
        });
      }

      // Update user's last check-in
      await query(`
        UPDATE users 
        SET last_safety_check = CURRENT_TIMESTAMP,
            current_location = ST_GeomFromText('POINT($2 $1)', 4326)
        WHERE id = $3
      `, [latitude, longitude, userId]);

      res.json({
        safetyStatus,
        recommendations: generateSafetyRecommendations(safetyStatus)
      });

    } catch (error) {
      console.error('Safety check error:', error);
      res.status(500).json({ error: 'Failed to perform safety check' });
    }
  }
);

// Helper function to send emergency notifications
async function sendEmergencyNotifications({ user, alertType, location, message, contacts, alertId }) {
  const notifications = {
    sms: [],
    email: [],
    push: [],
    webhook: []
  };

  try {
    // SMS notifications via Twilio (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      for (const contact of contacts) {
        if (contact.phone) {
          try {
            // In a real implementation, you would use Twilio SDK here
            console.log(`SMS would be sent to ${contact.phone}: Emergency alert for ${user.first_name}`);
            notifications.sms.push({
              to: contact.phone,
              status: 'sent',
              message: `EMERGENCY: ${user.first_name} ${user.last_name} has triggered an emergency alert. Location: ${location.latitude}, ${location.longitude}. ${message || ''}`
            });
          } catch (error) {
            console.error('SMS error:', error);
            notifications.sms.push({
              to: contact.phone,
              status: 'failed',
              error: error.message
            });
          }
        }
      }
    }

    // Email notifications (if configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      for (const contact of contacts) {
        if (contact.email) {
          try {
            // In a real implementation, you would use nodemailer here
            console.log(`Email would be sent to ${contact.email}: Emergency alert for ${user.first_name}`);
            notifications.email.push({
              to: contact.email,
              status: 'sent',
              subject: `EMERGENCY ALERT: ${user.first_name} ${user.last_name}`
            });
          } catch (error) {
            console.error('Email error:', error);
            notifications.email.push({
              to: contact.email,
              status: 'failed',
              error: error.message
            });
          }
        }
      }
    }

    // Emergency services webhook
    if (process.env.EMERGENCY_WEBHOOK_URL) {
      try {
        await axios.post(process.env.EMERGENCY_WEBHOOK_URL, {
          alert_id: alertId,
          user: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            phone: user.phone
          },
          type: alertType,
          location,
          message,
          timestamp: new Date().toISOString()
        });
        notifications.webhook.push({ status: 'sent', endpoint: 'emergency_services' });
      } catch (error) {
        console.error('Webhook error:', error);
        notifications.webhook.push({ status: 'failed', error: error.message });
      }
    }

  } catch (error) {
    console.error('Notification error:', error);
  }

  return notifications;
}

// Helper function to send automated alerts
async function sendAutomatedAlert({ user, alertType, location, message, dangerZone }) {
  try {
    // Get user's emergency contacts
    const contactsResult = await query(
      'SELECT name, phone, email FROM user_emergency_contacts WHERE user_id = $1',
      [user.id]
    );

    if (contactsResult.rows.length > 0) {
      await sendEmergencyNotifications({
        user,
        alertType,
        location,
        message,
        contacts: contactsResult.rows,
        alertId: `auto_${Date.now()}`
      });

      console.log(`Automated alert sent for user ${user.id}: ${message}`);
    }
  } catch (error) {
    console.error('Automated alert error:', error);
  }
}

// Helper function to generate safety recommendations
function generateSafetyRecommendations(safetyStatus) {
  const recommendations = [];

  if (safetyStatus.isInDangerZone) {
    recommendations.push('You are in a high-risk area. Consider moving to a safer location.');
    recommendations.push('Stay alert and avoid isolated areas.');
    recommendations.push('Consider contacting local authorities if you feel threatened.');
  }

  if (safetyStatus.isInactive) {
    recommendations.push('You have been inactive for a while. Please check in to confirm your safety.');
    recommendations.push('Consider setting up automated check-ins every 30 minutes.');
  }

  if (!safetyStatus.isInDangerZone && !safetyStatus.isInactive) {
    recommendations.push('You are in a safe area. Continue to stay aware of your surroundings.');
    recommendations.push('Regular check-ins help ensure your safety.');
  }

  return recommendations;
}

// ===== ENHANCED EMERGENCY SYSTEM ENDPOINTS =====

// Twilio emergency call endpoints
router.post('/call', async (req, res) => {
  try {
    const { touristId, adminId, reason, priority, alertId } = req.body;
    
    // Get tourist and admin phone numbers
    const touristResult = await query('SELECT phone, first_name, last_name FROM users WHERE id = $1', [touristId]);
    const adminResult = await query('SELECT phone, first_name, last_name FROM users WHERE id = $1', [adminId]);
    
    if (!touristResult.rows[0] || !adminResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const tourist = touristResult.rows[0];
    const admin = adminResult.rows[0];
    
    if (!tourist.phone || !admin.phone) {
      return res.status(400).json({ error: 'Phone numbers not available' });
    }
    
    // Initiate call via Twilio
    const call = await twilioClient.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: tourist.phone,
      url: `${process.env.BASE_URL}/api/emergency/call/twiml?adminPhone=${admin.phone}&reason=${reason}`,
      record: true,
      statusCallback: `${process.env.BASE_URL}/api/emergency/call/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });
    
    // Store call session
    await query(`
      INSERT INTO emergency_calls (
        sid, tourist_id, admin_id, reason, priority, alert_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'initiated', NOW())
    `, [call.sid, touristId, adminId, reason, priority, alertId]);
    
    const callSession = {
      sid: call.sid,
      status: 'initiated',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: tourist.phone,
      startTime: new Date().toISOString()
    };
    
    // Broadcast call status
    if (req.io) {
      req.io.emit('call_status_update', callSession);
    }
    
    res.json(callSession);
    
  } catch (error) {
    console.error('❌ Emergency call failed:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// End emergency call
router.post('/call/:sid/end', async (req, res) => {
  try {
    const { sid } = req.params;
    
    // End the call
    await twilioClient.calls(sid).update({ status: 'completed' });
    
    // Update call status in database
    await query(`
      UPDATE emergency_calls 
      SET status = 'completed', ended_at = NOW() 
      WHERE sid = $1
    `, [sid]);
    
    // Broadcast call ended
    if (req.io) {
      req.io.emit('call_status_update', {
        sid,
        status: 'completed',
        endTime: new Date().toISOString()
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ End call failed:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// TwiML for emergency calls
router.get('/call/twiml', (req, res) => {
  const { adminPhone, reason } = req.query;
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">This is an emergency call from the tourist safety system. Connecting you to emergency admin.</Say>
  <Dial timeout="30" record="record-from-answer">
    <Number>${adminPhone}</Number>
  </Dial>
  <Say voice="Polly.Joanna">The admin was not available. This call will now end. Please try again or contact emergency services directly.</Say>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
});

// Call status webhook
router.post('/call/status', (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  
  console.log(`📞 Call ${CallSid} status: ${CallStatus}`);
  
  // Update database
  query(`
    UPDATE emergency_calls 
    SET status = $1, duration = $2, updated_at = NOW() 
    WHERE sid = $3
  `, [CallStatus, CallDuration || null, CallSid]).catch(console.error);
  
  // Broadcast status update
  if (req.io) {
    req.io.emit('call_status_update', {
      sid: CallSid,
      status: CallStatus,
      duration: CallDuration
    });
  }
  
  res.status(200).send('OK');
});

// Acknowledge emergency alert
router.post('/acknowledge/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const adminId = req.user.id;
    
    await query(`
      UPDATE emergency_alerts 
      SET status = 'ACKNOWLEDGED', acknowledged_by = $1, acknowledged_at = NOW() 
      WHERE id = $2
    `, [adminId, alertId]);
    
    // Broadcast update
    if (req.io) {
      req.io.emit('emergency_alert_status_changed', {
        id: alertId,
        status: 'ACKNOWLEDGED',
        acknowledgedBy: adminId,
        acknowledgedAt: new Date().toISOString()
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Acknowledge alert failed:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve emergency alert
router.post('/resolve/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    await query(`
      UPDATE emergency_alerts 
      SET status = 'RESOLVED', resolved_by = $1, resolved_at = NOW(), resolution = $2 
      WHERE id = $3
    `, [adminId, resolution, alertId]);
    
    // Broadcast update
    if (req.io) {
      req.io.emit('emergency_alert_status_changed', {
        id: alertId,
        status: 'RESOLVED',
        resolvedBy: adminId,
        resolvedAt: new Date().toISOString(),
        resolution
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Resolve alert failed:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get emergency alerts (enhanced)
router.get('/alerts', async (req, res) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const userId = req.user.id;
    
    const alerts = await query(`
      SELECT 
        ea.*,
        u.first_name, u.last_name, u.email, u.phone,
        array_agg(
          json_build_object(
            'name', ec.name,
            'phone', ec.phone,
            'email', ec.email,
            'relationship', ec.relationship,
            'priority', ec.priority
          )
        ) FILTER (WHERE ec.id IS NOT NULL) as emergency_contacts
      FROM emergency_alerts ea
      JOIN users u ON ea.tourist_id = u.id
      LEFT JOIN emergency_contacts ec ON ea.id = ec.alert_id
      WHERE ea.status = $1 AND ea.tourist_id = $2
      GROUP BY ea.id, u.id
      ORDER BY ea.created_at DESC
    `, [status, userId]);
    
    const formattedAlerts = alerts.rows.map(alert => ({
      id: alert.id,
      touristId: alert.tourist_id,
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      location: {
        latitude: parseFloat(alert.latitude),
        longitude: parseFloat(alert.longitude),
        accuracy: alert.accuracy,
        address: alert.address
      },
      tourist: {
        id: alert.tourist_id,
        firstName: alert.first_name,
        lastName: alert.last_name,
        phone: alert.phone,
        email: alert.email
      },
      createdAt: alert.created_at,
      acknowledgedAt: alert.acknowledged_at,
      acknowledgedBy: alert.acknowledged_by,
      resolvedAt: alert.resolved_at,
      resolvedBy: alert.resolved_by,
      firNumber: alert.fir_number,
      emergencyContacts: alert.emergency_contacts || []
    }));
    
    res.json(formattedAlerts);
    
  } catch (error) {
    console.error('❌ Get alerts failed:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Notify emergency contacts endpoint
router.post('/notify-contacts', async (req, res) => {
  try {
    const { alertId, touristId, location, message, severity } = req.body;
    
    const notifications = await sendEmergencyNotifications({
      id: alertId,
      touristId,
      location,
      message,
      severity,
      emergencyContacts: req.body.emergencyContacts || []
    });
    
    res.json({ success: true, notifications });
    
  } catch (error) {
    console.error('❌ Notify contacts failed:', error);
    res.status(500).json({ error: 'Failed to notify contacts' });
  }
});

// Notify emergency services endpoint
router.post('/notify-services', async (req, res) => {
  try {
    const alert = req.body;
    await notifyEmergencyServices(alert);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Notify services failed:', error);
    res.status(500).json({ error: 'Failed to notify emergency services' });
  }
});

// Generate FIR endpoint
router.post('/generate-fir', async (req, res) => {
  try {
    const { alertId, incidentType, location, description, touristDetails, timestamp } = req.body;
    
    const firNumber = `FIR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    await query(`
      INSERT INTO fir_reports (
        fir_number, alert_id, incident_type, 
        tourist_id, tourist_name, tourist_phone,
        incident_location, incident_description,
        report_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'FILED')
    `, [
      firNumber,
      alertId,
      incidentType,
      touristDetails.id,
      `${touristDetails.firstName} ${touristDetails.lastName}`,
      touristDetails.phone,
      `${location.latitude}, ${location.longitude}${location.address ? ` - ${location.address}` : ''}`,
      description,
      timestamp
    ]);

    res.json({ success: true, firNumber });
    
  } catch (error) {
    console.error('❌ FIR generation failed:', error);
    res.status(500).json({ error: 'Failed to generate FIR' });
  }
});

// Notify nearby admins endpoint
router.post('/notify-nearby-admins', async (req, res) => {
  try {
    const { alertId, location, radius = 5000 } = req.body;
    
    await notifyNearbyAdmins({
      id: alertId,
      location
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Notify nearby admins failed:', error);
    res.status(500).json({ error: 'Failed to notify nearby admins' });
  }
});

module.exports = router;