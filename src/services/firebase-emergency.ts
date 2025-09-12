import {
    addDoc,
    collection,
    doc,
    GeoPoint,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Alert } from '../types';

export class FirebaseEmergencyService {
  private alertsCollection = collection(db, 'emergencyAlerts');
  private emergencyContactsCollection = collection(db, 'emergencyContacts');

  // Emergency alert methods
  async triggerSOS(location?: { latitude: number; longitude: number }): Promise<Alert> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      console.log('🚨 Firebase SOS Alert:', location);

      const alertData = {
        userId: user.uid,
        type: 'sos',
        severity: 'CRITICAL',
        message: 'SOS alert triggered by user - immediate assistance required',
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        geopoint: location ? new GeoPoint(location.latitude, location.longitude) : null,
        status: 'ACTIVE',
        source: 'manual',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(this.alertsCollection, alertData);

      return {
        id: docRef.id,
        touristId: user.uid,
        ...alertData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Alert;
    } catch (error: any) {
      console.error('Firebase SOS error:', error);
      throw new Error(error.message || 'SOS alert failed');
    }
  }

  async triggerPanic(message?: string): Promise<Alert> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      console.log('😰 Firebase Panic Alert:', message);

      const alertData = {
        userId: user.uid,
        type: 'panic',
        severity: 'HIGH',
        message: message || 'Panic alert triggered by user - assistance needed',
        latitude: 0,
        longitude: 0,
        geopoint: null,
        status: 'ACTIVE',
        source: 'manual',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(this.alertsCollection, alertData);

      return {
        id: docRef.id,
        touristId: user.uid,
        ...alertData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Alert;
    } catch (error: any) {
      console.error('Firebase panic error:', error);
      throw new Error(error.message || 'Panic alert failed');
    }
  }

  async getMyAlerts(status = 'ACTIVE', limitCount = 20): Promise<{
    alerts: Alert[];
    total: number;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      let q = query(
        this.alertsCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status !== 'ALL') {
        q = query(
          this.alertsCollection,
          where('userId', '==', user.uid),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      
      const alerts: Alert[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          touristId: data.userId,
          type: data.type,
          severity: data.severity,
          message: data.message,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
          metadata: { source: data.source || 'unknown' },
        });
      });

      return {
        alerts,
        total: alerts.length,
      };
    } catch (error) {
      console.error('Get my alerts error:', error);
      return {
        alerts: [],
        total: 0,
      };
    }
  }

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const alertRef = doc(this.alertsCollection, alertId);
      
      await updateDoc(alertRef, {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: Timestamp.now(),
        acknowledgedBy: user.uid,
        updatedAt: Timestamp.now(),
      });

      const alertDoc = await getDoc(alertRef);
      const data = alertDoc.data();

      return {
        id: alertDoc.id,
        touristId: data?.userId,
        type: data?.type,
        severity: data?.severity,
        message: data?.message,
        latitude: data?.latitude,
        longitude: data?.longitude,
        status: data?.status,
        timestamp: data?.createdAt.toDate().toISOString(),
        createdAt: data?.createdAt.toDate().toISOString(),
        updatedAt: data?.updatedAt.toDate().toISOString(),
        source: data?.source || 'unknown',
      } as Alert;
    } catch (error: any) {
      console.error('Acknowledge alert error:', error);
      throw new Error(error.message || 'Failed to acknowledge alert');
    }
  }

  // Emergency contacts
  async getEmergencyContacts(countryCode = 'IN'): Promise<any[]> {
    // Return standard emergency contacts for countries
    const emergencyContacts: { [key: string]: any[] } = {
      'IN': [
        { name: 'Police', number: '100', type: 'police' },
        { name: 'Fire', number: '101', type: 'fire' },
        { name: 'Ambulance', number: '102', type: 'medical' },
        { name: 'Tourist Helpline', number: '1363', type: 'tourist' },
      ],
      'US': [
        { name: 'Emergency Services', number: '911', type: 'emergency' },
        { name: 'Tourist Information', number: '211', type: 'tourist' },
      ],
      'UK': [
        { name: 'Emergency Services', number: '999', type: 'emergency' },
        { name: 'Non-Emergency Police', number: '101', type: 'police' },
      ],
      'DE': [
        { name: 'Emergency Services', number: '112', type: 'emergency' },
        { name: 'Police', number: '110', type: 'police' },
      ],
    };

    return emergencyContacts[countryCode] || emergencyContacts['IN'];
  }

  async addPersonalEmergencyContact(contact: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const contactData = {
        userId: user.uid,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        relationship: contact.relationship,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(this.emergencyContactsCollection, contactData);

      return {
        id: docRef.id,
        ...contactData,
        createdAt: contactData.createdAt.toDate().toISOString(),
        updatedAt: contactData.updatedAt.toDate().toISOString(),
      };
    } catch (error: any) {
      console.error('Add emergency contact error:', error);
      throw new Error(error.message || 'Failed to add emergency contact');
    }
  }

  async getPersonalEmergencyContacts(): Promise<any[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        this.emergencyContactsCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      const contacts: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contacts.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          relationship: data.relationship,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        });
      });

      return contacts;
    } catch (error) {
      console.error('Get personal emergency contacts error:', error);
      return [];
    }
  }

  // Safety check for automated monitoring
  async performSafetyCheck(latitude: number, longitude: number): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get user's recent activity
      const now = Timestamp.now();
      const thirtyMinutesAgo = Timestamp.fromMillis(now.toMillis() - (30 * 60 * 1000));

      // Check for recent location updates
      const recentLocations = await getDocs(query(
        collection(db, 'locations'),
        where('userId', '==', user.uid),
        where('timestamp', '>', thirtyMinutesAgo),
        orderBy('timestamp', 'desc'),
        limit(1)
      ));

      const isInactive = recentLocations.empty;

      // Check if in danger zone (simplified check)
      const isInDangerZone = false; // Would implement proper geofencing check

      const safetyStatus = {
        isInDangerZone,
        isInactive,
        lastActivity: recentLocations.empty ? null : recentLocations.docs[0].data().timestamp.toDate().toISOString(),
        currentLocation: { latitude, longitude },
        checkTime: new Date().toISOString(),
      };

      // If user is inactive or in danger zone, trigger alert
      if (isInactive || isInDangerZone) {
        const alertType = isInactive ? 'inactivity' : 'danger_zone';
        const message = isInactive 
          ? 'User has been inactive for more than 30 minutes' 
          : 'User is in a danger zone';

        await this.triggerAutomaticAlert(alertType, message, latitude, longitude);
      }

      return { safetyStatus };
    } catch (error) {
      console.error('Safety check error:', error);
      return {
        safetyStatus: {
          isInDangerZone: false,
          isInactive: false,
          error: 'Safety check failed',
        },
      };
    }
  }

  private async triggerAutomaticAlert(
    type: string,
    message: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const alertData = {
        userId: user.uid,
        type,
        severity: 'HIGH',
        message,
        latitude,
        longitude,
        geopoint: new GeoPoint(latitude, longitude),
        status: 'ACTIVE',
        source: 'automatic',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(this.alertsCollection, alertData);
      console.log(`🤖 Automatic alert triggered: ${type}`);
    } catch (error) {
      console.error('Trigger automatic alert error:', error);
    }
  }

  // Get nearby alerts for situational awareness
  async getNearbyAlerts(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    try {
      // Get recent alerts (last 24 hours)
      const oneDayAgo = Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000));
      
      const q = query(
        this.alertsCollection,
        where('status', '==', 'ACTIVE'),
        where('createdAt', '>', oneDayAgo),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      
      const nearbyAlerts: any[] = [];
      querySnapshot.forEach((doc) => {
        const alert = doc.data();
        if (alert.geopoint) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            alert.geopoint.latitude,
            alert.geopoint.longitude
          );

          if (distance <= radius) {
            nearbyAlerts.push({
              id: doc.id,
              ...alert,
              distance,
              createdAt: alert.createdAt.toDate().toISOString(),
            });
          }
        }
      });

      return nearbyAlerts;
    } catch (error) {
      console.error('Get nearby alerts error:', error);
      return [];
    }
  }

  // Real-time alert subscription
  subscribeToAlerts(callback: (alerts: Alert[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      this.alertsCollection,
      where('userId', '==', user.uid),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const alerts: Alert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          touristId: data.userId,
          type: data.type,
          severity: data.severity,
          message: data.message,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
          metadata: { source: data.source || 'unknown' },
        });
      });
      callback(alerts);
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

export const firebaseEmergencyService = new FirebaseEmergencyService();