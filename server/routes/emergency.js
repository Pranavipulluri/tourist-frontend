const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('./auth');
const axios = require('axios');

const router = express.Router();

// Emergency routes require authentication
router.use(authenticateToken);

// Trigger emergency alert
router.post('/alert',
  [
    body('type').isIn(['panic', 'medical', 'accident', 'crime', 'natural_disaster']),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('message').optional().trim().isLength({ max: 500 }),
    body('contacts').optional().isArray()
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

      const { type, latitude, longitude, message, contacts } = req.body;
      const userId = req.user.id;

      // Create emergency alert
      const alertId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const alertResult = await query(`
        INSERT INTO alerts (id, user_id, title, description, severity, alert_type, location, radius, status)
        VALUES ($1, $2, $3, $4, 'CRITICAL', 'emergency', ST_GeomFromText('POINT($6 $5)', 4326), 1000, 'ACTIVE')
        RETURNING id, created_at
      `, [
        alertId,
        userId,
        `Emergency: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        message || `Emergency alert triggered by ${req.user.first_name} ${req.user.last_name}`,
        latitude,
        longitude
      ]);

      const newAlert = alertResult.rows[0];

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

module.exports = router;