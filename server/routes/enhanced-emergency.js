const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tourist_safety'
});

// Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Real-time emergency detection endpoint
router.post('/detect', async (req, res) => {
  try {
    const { 
      userId, 
      sensors, 
      location, 
      deviceData, 
      manualTrigger = false,
      emergencyType = null 
    } = req.body;
    
    console.log(`🚨 Emergency detection analysis for user ${userId}`);
    
    // Analyze sensor data for emergency patterns
    const emergencyAnalysis = await analyzeEmergencyPatterns(sensors, deviceData, location);
    
    // Check location-based risks
    const locationRisks = await assessLocationRisks(location.latitude, location.longitude);
    
    // Combine analysis results
    const overallRisk = calculateOverallRisk(emergencyAnalysis, locationRisks, manualTrigger);
    
    // Store detection data
    await storeDetectionData(userId, sensors, location, emergencyAnalysis, overallRisk);
    
    let alert = null;
    
    // Trigger emergency response if risk threshold exceeded
    if (overallRisk.level === 'CRITICAL' || manualTrigger) {
      alert = await triggerEmergencyResponse(userId, location, overallRisk, emergencyType);
    } else if (overallRisk.level === 'HIGH') {
      alert = await triggerHighRiskAlert(userId, location, overallRisk);
    } else if (overallRisk.level === 'MODERATE') {
      await logModerateRisk(userId, location, overallRisk);
    }
    
    res.json({
      userId,
      analysis: emergencyAnalysis,
      locationRisks,
      overallRisk,
      alert,
      timestamp: new Date().toISOString(),
      recommendations: generateSafetyRecommendations(overallRisk, locationRisks)
    });
    
  } catch (error) {
    console.error('Emergency detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual emergency trigger endpoint
router.post('/trigger', async (req, res) => {
  try {
    const { userId, emergencyType, location, message } = req.body;
    
    console.log(`🚨 Manual emergency triggered by user ${userId}: ${emergencyType}`);
    
    // Create immediate high-priority alert
    const alert = await createEmergencyAlert(userId, {
      type: emergencyType,
      severity: 'CRITICAL',
      message: message || `Manual ${emergencyType} emergency triggered`,
      latitude: location.latitude,
      longitude: location.longitude,
      isManual: true
    });
    
    // Trigger all emergency protocols
    await triggerAllEmergencyProtocols(userId, alert, location);
    
    res.json({
      alertId: alert.id,
      status: 'emergency_triggered',
      message: 'Emergency services have been notified',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Manual emergency trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Emergency status check endpoint
router.get('/status/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const statusQuery = `
      SELECT 
        ea.*,
        u.name as user_name,
        u.phone as user_phone,
        COUNT(en.id) as notification_count,
        MAX(er.response_time) as last_response_time,
        er.status as response_status
      FROM emergency_alerts ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN emergency_notifications en ON ea.id = en.alert_id
      LEFT JOIN emergency_responses er ON ea.id = er.alert_id
      WHERE ea.id = $1
      GROUP BY ea.id, u.name, u.phone, er.status, er.response_time
    `;
    
    const result = await pool.query(statusQuery, [alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const alert = result.rows[0];
    
    res.json({
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        message: alert.message,
        location: {
          latitude: alert.latitude,
          longitude: alert.longitude
        },
        createdAt: alert.created_at,
        resolvedAt: alert.resolved_at,
        user: {
          name: alert.user_name,
          phone: alert.user_phone
        }
      },
      response: {
        status: alert.response_status,
        notificationsSent: alert.notification_count,
        lastResponseTime: alert.last_response_time
      },
      timeline: await getAlertTimeline(alertId)
    });
    
  } catch (error) {
    console.error('Emergency status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve emergency endpoint
router.post('/resolve/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, resolution, notes } = req.body;
    
    console.log(`✅ Resolving emergency alert ${alertId}`);
    
    // Update alert status
    const resolveQuery = `
      UPDATE emergency_alerts 
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, resolution_notes = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(resolveQuery, [resolvedBy, notes, alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const alert = result.rows[0];
    
    // Notify emergency contacts about resolution
    await notifyEmergencyResolution(alert);
    
    res.json({
      alertId: alert.id,
      status: 'resolved',
      resolvedAt: alert.resolved_at,
      resolvedBy: alert.resolved_by,
      resolution: alert.resolution_notes
    });
    
  } catch (error) {
    console.error('Emergency resolution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Emergency contacts management
router.post('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contacts } = req.body;
    
    console.log(`👥 Updating emergency contacts for user ${userId}`);
    
    // Clear existing contacts
    await pool.query('DELETE FROM emergency_contacts WHERE user_id = $1', [userId]);
    
    // Add new contacts
    for (const contact of contacts) {
      await pool.query(
        'INSERT INTO emergency_contacts (user_id, name, phone, email, relationship, priority) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, contact.name, contact.phone, contact.email, contact.relationship, contact.priority]
      );
    }
    
    res.json({ status: 'contacts_updated', count: contacts.length });
    
  } catch (error) {
    console.error('Emergency contacts update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==== EMERGENCY ANALYSIS FUNCTIONS ====

async function analyzeEmergencyPatterns(sensors, deviceData, location) {
  const analysis = {
    patterns: [],
    riskFactors: [],
    confidence: 0,
    emergencyProbability: 0
  };
  
  // Analyze accelerometer data for fall detection
  if (sensors.accelerometer) {
    const fallDetection = analyzeFallPattern(sensors.accelerometer);
    if (fallDetection.detected) {
      analysis.patterns.push('fall_detected');
      analysis.riskFactors.push('Sudden impact/fall detected');
      analysis.confidence += 0.3;
    }
  }
  
  // Analyze heart rate for distress
  if (sensors.heartRate) {
    const heartRateAnalysis = analyzeHeartRate(sensors.heartRate);
    if (heartRateAnalysis.abnormal) {
      analysis.patterns.push('heart_rate_abnormal');
      analysis.riskFactors.push('Abnormal heart rate detected');
      analysis.confidence += 0.2;
    }
  }
  
  // Analyze movement patterns
  if (sensors.movement) {
    const movementAnalysis = analyzeMovementPattern(sensors.movement);
    if (movementAnalysis.concerning) {
      analysis.patterns.push('movement_concerning');
      analysis.riskFactors.push('Unusual movement pattern');
      analysis.confidence += 0.15;
    }
  }
  
  // Analyze device interactions
  if (deviceData) {
    const interactionAnalysis = analyzeDeviceInteraction(deviceData);
    if (interactionAnalysis.emergency) {
      analysis.patterns.push('emergency_interaction');
      analysis.riskFactors.push('Emergency interaction pattern');
      analysis.confidence += 0.25;
    }
  }
  
  // Analyze sound patterns (if available)
  if (sensors.audio) {
    const audioAnalysis = analyzeAudioPattern(sensors.audio);
    if (audioAnalysis.distress) {
      analysis.patterns.push('audio_distress');
      analysis.riskFactors.push('Distress audio detected');
      analysis.confidence += 0.2;
    }
  }
  
  analysis.emergencyProbability = Math.min(1, analysis.confidence);
  
  return analysis;
}

async function assessLocationRisks(latitude, longitude) {
  try {
    // Check crime data
    const crimeRisk = await assessCrimeRisk(latitude, longitude);
    
    // Check weather conditions
    const weatherRisk = await assessWeatherRisk(latitude, longitude);
    
    // Check isolation level
    const isolationRisk = await assessIsolationRisk(latitude, longitude);
    
    // Check emergency services proximity
    const emergencyServicesRisk = await assessEmergencyServicesProximity(latitude, longitude);
    
    return {
      crime: crimeRisk,
      weather: weatherRisk,
      isolation: isolationRisk,
      emergencyServices: emergencyServicesRisk,
      overallLocationRisk: calculateLocationRisk(crimeRisk, weatherRisk, isolationRisk, emergencyServicesRisk)
    };
    
  } catch (error) {
    console.error('Location risk assessment error:', error);
    return {
      crime: { level: 'UNKNOWN', score: 0 },
      weather: { level: 'UNKNOWN', score: 0 },
      isolation: { level: 'UNKNOWN', score: 0 },
      emergencyServices: { level: 'UNKNOWN', score: 0 },
      overallLocationRisk: 0
    };
  }
}

function calculateOverallRisk(emergencyAnalysis, locationRisks, manualTrigger) {
  if (manualTrigger) {
    return {
      level: 'CRITICAL',
      score: 1.0,
      factors: ['Manual emergency trigger'],
      confidence: 1.0
    };
  }
  
  let riskScore = 0;
  const factors = [];
  
  // Emergency pattern analysis weight: 60%
  riskScore += emergencyAnalysis.emergencyProbability * 0.6;
  factors.push(...emergencyAnalysis.riskFactors);
  
  // Location risk weight: 40%
  riskScore += (locationRisks.overallLocationRisk / 100) * 0.4;
  
  const level = riskScore > 0.8 ? 'CRITICAL' :
               riskScore > 0.6 ? 'HIGH' :
               riskScore > 0.4 ? 'MODERATE' :
               riskScore > 0.2 ? 'LOW' : 'MINIMAL';
  
  return {
    level,
    score: riskScore,
    factors,
    confidence: emergencyAnalysis.confidence
  };
}

// ==== EMERGENCY RESPONSE FUNCTIONS ====

async function triggerEmergencyResponse(userId, location, risk, emergencyType) {
  console.log(`🚨 CRITICAL: Triggering emergency response for user ${userId}`);
  
  // Create emergency alert
  const alert = await createEmergencyAlert(userId, {
    type: emergencyType || 'automatic_detection',
    severity: 'CRITICAL',
    message: `Critical emergency detected: ${risk.factors.join(', ')}`,
    latitude: location.latitude,
    longitude: location.longitude,
    riskScore: risk.score,
    confidence: risk.confidence
  });
  
  // Trigger all emergency protocols
  await triggerAllEmergencyProtocols(userId, alert, location);
  
  return alert;
}

async function triggerAllEmergencyProtocols(userId, alert, location) {
  try {
    // 1. Notify emergency contacts
    await notifyEmergencyContacts(userId, alert, location);
    
    // 2. Send location to emergency services (if enabled)
    await notifyEmergencyServices(alert, location);
    
    // 3. Send SMS alerts
    await sendEmergencySMS(userId, alert, location);
    
    // 4. Send email alerts
    await sendEmergencyEmail(userId, alert, location);
    
    // 5. Create location tracking beacon
    await createLocationBeacon(userId, location, alert.id);
    
    // 6. Log all actions
    await logEmergencyActions(alert.id, ['contacts', 'services', 'sms', 'email', 'beacon']);
    
  } catch (error) {
    console.error('Emergency protocols error:', error);
  }
}

async function createEmergencyAlert(userId, alertData) {
  const query = `
    INSERT INTO emergency_alerts (
      user_id, type, severity, message, latitude, longitude, 
      risk_score, confidence, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    userId, alertData.type, alertData.severity, alertData.message,
    alertData.latitude, alertData.longitude, alertData.riskScore || 0,
    alertData.confidence || 0
  ]);
  
  return result.rows[0];
}

async function notifyEmergencyContacts(userId, alert, location) {
  try {
    // Get emergency contacts
    const contactsQuery = `
      SELECT * FROM emergency_contacts 
      WHERE user_id = $1 
      ORDER BY priority ASC
    `;
    
    const contacts = await pool.query(contactsQuery, [userId]);
    
    for (const contact of contacts.rows) {
      // Send SMS if phone available
      if (contact.phone && twilioClient) {
        await twilioClient.messages.create({
          body: `EMERGENCY ALERT: ${alert.message}. Location: https://maps.google.com/maps?q=${location.latitude},${location.longitude}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });
      }
      
      // Send email if email available
      if (contact.email) {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contact.email,
          subject: 'EMERGENCY ALERT - Immediate Action Required',
          html: generateEmergencyEmailHTML(alert, location, contact)
        });
      }
      
      // Log notification
      await pool.query(
        'INSERT INTO emergency_notifications (alert_id, contact_id, type, status, sent_at) VALUES ($1, $2, $3, $4, NOW())',
        [alert.id, contact.id, 'emergency_contact', 'sent']
      );
    }
    
  } catch (error) {
    console.error('Emergency contacts notification error:', error);
  }
}

// ==== SENSOR ANALYSIS FUNCTIONS ====

function analyzeFallPattern(accelerometerData) {
  // Simple fall detection algorithm
  const { x, y, z } = accelerometerData;
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  
  // Look for sudden deceleration followed by impact
  const threshold = 15; // Adjust based on calibration
  const fallDetected = magnitude > threshold;
  
  return {
    detected: fallDetected,
    magnitude,
    confidence: fallDetected ? Math.min(1, magnitude / 20) : 0
  };
}

function analyzeHeartRate(heartRateData) {
  const { current, average, variability } = heartRateData;
  
  // Check for abnormal heart rate patterns
  const tachycardia = current > 120; // High heart rate
  const bradycardia = current < 50;  // Low heart rate
  const highVariability = variability > 50; // Stress indicator
  
  return {
    abnormal: tachycardia || bradycardia || highVariability,
    patterns: {
      tachycardia,
      bradycardia,
      highVariability
    },
    severity: tachycardia && highVariability ? 'HIGH' : 'MODERATE'
  };
}

function analyzeMovementPattern(movementData) {
  const { speed, direction, consistency } = movementData;
  
  // Look for concerning movement patterns
  const erraticMovement = consistency < 0.3;
  const suddenStop = speed === 0 && movementData.previousSpeed > 5;
  const rapidDirection = Math.abs(direction - movementData.previousDirection) > 90;
  
  return {
    concerning: erraticMovement || suddenStop || rapidDirection,
    patterns: {
      erraticMovement,
      suddenStop,
      rapidDirection
    }
  };
}

function analyzeDeviceInteraction(deviceData) {
  const { lastInteraction, batteryLevel, screenTime } = deviceData;
  
  // Check for emergency interaction patterns
  const noInteraction = Date.now() - new Date(lastInteraction).getTime() > 3600000; // 1 hour
  const lowBattery = batteryLevel < 10;
  const unusualScreenTime = screenTime > 300 || screenTime < 5; // seconds
  
  return {
    emergency: noInteraction || (lowBattery && noInteraction),
    patterns: {
      noInteraction,
      lowBattery,
      unusualScreenTime
    }
  };
}

function analyzeAudioPattern(audioData) {
  // Simplified audio distress detection
  const { volume, frequency, pattern } = audioData;
  
  const highVolume = volume > 80;
  const distressFrequency = frequency > 500 && frequency < 2000; // Typical scream range
  const repeatPattern = pattern === 'repetitive_high';
  
  return {
    distress: highVolume && distressFrequency && repeatPattern,
    confidence: (highVolume && distressFrequency) ? 0.7 : 0.3
  };
}

// ==== HELPER FUNCTIONS ====

function generateEmergencyEmailHTML(alert, location, contact) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
        <h1>🚨 EMERGENCY ALERT</h1>
      </div>
      <div style="padding: 20px;">
        <h2>Emergency Details</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${alert.created_at}</p>
        
        <h2>Location</h2>
        <p><strong>Coordinates:</strong> ${location.latitude}, ${location.longitude}</p>
        <p><a href="https://maps.google.com/maps?q=${location.latitude},${location.longitude}" 
              style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           View on Google Maps
        </a></p>
        
        <h2>Next Steps</h2>
        <ol>
          <li>Contact the person immediately</li>
          <li>If unable to reach them, contact local emergency services</li>
          <li>Use the location link to provide exact coordinates</li>
        </ol>
        
        <div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px; border-left: 4px solid #dc3545;">
          <p><strong>This is an automated emergency alert from the Tourist Safety System.</strong></p>
          <p>You are receiving this because you are listed as an emergency contact for this user.</p>
        </div>
      </div>
    </div>
  `;
}

async function storeDetectionData(userId, sensors, location, analysis, risk) {
  const query = `
    INSERT INTO emergency_detections (
      user_id, sensor_data, location_data, analysis_data, risk_data, detected_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
  `;
  
  await pool.query(query, [
    userId,
    JSON.stringify(sensors),
    JSON.stringify(location),
    JSON.stringify(analysis),
    JSON.stringify(risk)
  ]);
}

module.exports = router;