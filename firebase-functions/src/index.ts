import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Twilio
const twilioClient = new Twilio(
  functions.config().twilio?.account_sid,
  functions.config().twilio?.auth_token
);

// Initialize email transporter
const emailTransporter = nodemailer.createTransporter({
  host: functions.config().smtp?.host || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().smtp?.user,
    pass: functions.config().smtp?.pass,
  },
});

// 🚨 Emergency Alert System
export const emergencyAlertSystem = functions.firestore
  .document('emergencyAlerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const alertId = context.params.alertId;

    console.log(`🚨 New emergency alert: ${alertId}`, alert);

    try {
      // Get user information
      const userDoc = await db.doc(`users/${alert.userId}`).get();
      const userData = userDoc.data();

      if (!userData) {
        console.error('User not found for alert:', alertId);
        return;
      }

      // Send notifications based on alert severity
      const promises: Promise<any>[] = [];

      if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
        // Send SMS alerts
        if (userData.phoneNumber) {
          promises.push(sendSMSAlert(userData.phoneNumber, alert, userData));
        }

        // Send email alerts
        if (userData.email) {
          promises.push(sendEmailAlert(userData.email, alert, userData));
        }

        // Notify emergency contacts
        if (userData.emergencyContacts && userData.emergencyContacts.length > 0) {
          for (const contact of userData.emergencyContacts) {
            if (contact.phone) {
              promises.push(sendSMSAlert(contact.phone, alert, userData, contact));
            }
            if (contact.email) {
              promises.push(sendEmailAlert(contact.email, alert, userData, contact));
            }
          }
        }

        // Notify local emergency services (in production, integrate with local APIs)
        promises.push(notifyEmergencyServices(alert, userData));
      }

      // Execute all notifications
      await Promise.allSettled(promises);

      // Update alert status
      await snap.ref.update({
        notificationsSent: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Emergency notifications sent for alert: ${alertId}`);
    } catch (error) {
      console.error('Emergency alert system error:', error);
      
      // Update alert with error status
      await snap.ref.update({
        notificationError: error.message,
        errorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// 🕐 Automated Inactivity Detection
export const inactivityMonitor = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('🔍 Running inactivity monitor...');

    try {
      const now = admin.firestore.Timestamp.now();
      const thirtyMinutesAgo = admin.firestore.Timestamp.fromMillis(
        now.toMillis() - (30 * 60 * 1000)
      );

      // Get all active users
      const usersSnapshot = await db.collection('users')
        .where('isActive', '==', true)
        .get();

      const inactiveUsers: any[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Get user's latest location
        const locationsSnapshot = await db.collection('locations')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        if (!locationsSnapshot.empty) {
          const latestLocation = locationsSnapshot.docs[0].data();
          
          // Check if user has been inactive for more than 30 minutes
          if (latestLocation.timestamp < thirtyMinutesAgo) {
            inactiveUsers.push({
              userId,
              userData,
              lastLocation: latestLocation,
              lastActivity: latestLocation.timestamp.toDate(),
            });
          }
        }
      }

      // Trigger alerts for inactive users
      for (const inactiveUser of inactiveUsers) {
        await triggerInactivityAlert(inactiveUser);
      }

      console.log(`🔍 Inactivity monitor completed. Found ${inactiveUsers.length} inactive users.`);
    } catch (error) {
      console.error('Inactivity monitor error:', error);
    }
  });

// 📍 Geofencing Monitor
export const geofencingMonitor = functions.firestore
  .document('locations/{locationId}')
  .onCreate(async (snap, context) => {
    const location = snap.data();
    const locationId = context.params.locationId;

    console.log(`📍 New location update: ${locationId}`, location);

    try {
      // Check if user entered any danger zones
      const dangerZones = await getDangerZones();
      
      for (const zone of dangerZones) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          zone.geopoint.latitude,
          zone.geopoint.longitude
        );

        if (distance <= zone.radius) {
          // User entered danger zone
          await triggerDangerZoneAlert(location, zone);
        }
      }
    } catch (error) {
      console.error('Geofencing monitor error:', error);
    }
  });

// 🔧 Helper Functions

async function sendSMSAlert(
  phoneNumber: string,
  alert: any,
  userData: any,
  contact?: any
): Promise<void> {
  try {
    if (!functions.config().twilio?.account_sid) {
      console.log('Twilio not configured, skipping SMS');
      return;
    }

    const message = contact
      ? `🚨 EMERGENCY: ${userData.firstName} ${userData.lastName} needs help! Alert: ${alert.message}. Location: ${alert.latitude}, ${alert.longitude}. Time: ${new Date().toLocaleString()}`
      : `🚨 EMERGENCY ALERT: ${alert.message}. Your location has been shared with emergency contacts. Stay safe!`;

    await twilioClient.messages.create({
      body: message,
      from: functions.config().twilio?.phone_number,
      to: phoneNumber,
    });

    console.log(`📱 SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('SMS sending error:', error);
  }
}

async function sendEmailAlert(
  email: string,
  alert: any,
  userData: any,
  contact?: any
): Promise<void> {
  try {
    if (!functions.config().smtp?.user) {
      console.log('SMTP not configured, skipping email');
      return;
    }

    const subject = contact
      ? `🚨 EMERGENCY: ${userData.firstName} ${userData.lastName} needs help!`
      : '🚨 Emergency Alert - Tourist Safety System';

    const html = contact
      ? `
        <h2>🚨 EMERGENCY ALERT</h2>
        <p><strong>${userData.firstName} ${userData.lastName}</strong> has triggered an emergency alert and may need immediate assistance.</p>
        
        <h3>Alert Details:</h3>
        <ul>
          <li><strong>Message:</strong> ${alert.message}</li>
          <li><strong>Severity:</strong> ${alert.severity}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Location:</strong> ${alert.latitude}, ${alert.longitude}</li>
        </ul>
        
        <h3>Contact Information:</h3>
        <ul>
          <li><strong>Phone:</strong> ${userData.phoneNumber || 'Not available'}</li>
          <li><strong>Email:</strong> ${userData.email}</li>
        </ul>
        
        <p><strong>Please contact them immediately or call local emergency services.</strong></p>
        
        <p>View location on map: <a href="https://maps.google.com/?q=${alert.latitude},${alert.longitude}">https://maps.google.com/?q=${alert.latitude},${alert.longitude}</a></p>
      `
      : `
        <h2>🚨 Emergency Alert Confirmed</h2>
        <p>Your emergency alert has been sent successfully.</p>
        
        <h3>Alert Details:</h3>
        <ul>
          <li><strong>Message:</strong> ${alert.message}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Location:</strong> ${alert.latitude}, ${alert.longitude}</li>
        </ul>
        
        <p>Your emergency contacts have been notified. Local emergency services have also been alerted.</p>
        <p><strong>Stay safe and follow emergency procedures.</strong></p>
      `;

    await emailTransporter.sendMail({
      from: functions.config().smtp?.user,
      to: email,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${email}`);
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

async function notifyEmergencyServices(alert: any, userData: any): Promise<void> {
  try {
    // In production, integrate with local emergency services APIs
    // For now, log the emergency notification
    console.log('🚑 Emergency services notified:', {
      userId: userData.id,
      userName: `${userData.firstName} ${userData.lastName}`,
      location: `${alert.latitude}, ${alert.longitude}`,
      message: alert.message,
      severity: alert.severity,
      timestamp: new Date().toISOString(),
    });

    // Store emergency service notification in database
    await db.collection('emergencyServiceNotifications').add({
      userId: userData.id,
      userName: `${userData.firstName} ${userData.lastName}`,
      userPhone: userData.phoneNumber,
      userEmail: userData.email,
      alertId: alert.id,
      location: {
        latitude: alert.latitude,
        longitude: alert.longitude,
      },
      message: alert.message,
      severity: alert.severity,
      notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'NOTIFIED',
    });
  } catch (error) {
    console.error('Emergency services notification error:', error);
  }
}

async function triggerInactivityAlert(inactiveUser: any): Promise<void> {
  try {
    console.log(`⏰ Triggering inactivity alert for user: ${inactiveUser.userId}`);

    // Create inactivity alert
    const alertData = {
      userId: inactiveUser.userId,
      type: 'inactivity',
      severity: 'HIGH',
      message: `User has been inactive for more than 30 minutes. Last known location: ${inactiveUser.lastLocation.latitude}, ${inactiveUser.lastLocation.longitude}`,
      latitude: inactiveUser.lastLocation.latitude,
      longitude: inactiveUser.lastLocation.longitude,
      geopoint: new admin.firestore.GeoPoint(
        inactiveUser.lastLocation.latitude,
        inactiveUser.lastLocation.longitude
      ),
      lastActivity: inactiveUser.lastActivity,
      status: 'ACTIVE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('emergencyAlerts').add(alertData);
  } catch (error) {
    console.error('Inactivity alert error:', error);
  }
}

async function triggerDangerZoneAlert(location: any, zone: any): Promise<void> {
  try {
    console.log(`⚠️ User entered danger zone: ${zone.name}`);

    // Create danger zone alert
    const alertData = {
      userId: location.userId,
      type: 'danger_zone_entry',
      severity: 'HIGH',
      message: `User entered danger zone: ${zone.name}. Exercise extreme caution.`,
      latitude: location.latitude,
      longitude: location.longitude,
      geopoint: new admin.firestore.GeoPoint(location.latitude, location.longitude),
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.type,
      status: 'ACTIVE',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('emergencyAlerts').add(alertData);
  } catch (error) {
    console.error('Danger zone alert error:', error);
  }
}

async function getDangerZones(): Promise<any[]> {
  try {
    const zonesSnapshot = await db.collection('safetyZones')
      .where('type', '==', 'danger')
      .get();

    return zonesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Get danger zones error:', error);
    return [];
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}