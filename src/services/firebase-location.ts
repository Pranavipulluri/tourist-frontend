import {
    addDoc,
    collection,
    doc,
    GeoPoint,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    startAfter,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Location } from '../types';

export class FirebaseLocationService {
  private locationsCollection = collection(db, 'locations');
  private alertsCollection = collection(db, 'emergencyAlerts');
  private devicesCollection = collection(db, 'devices');
  private safetyZonesCollection = collection(db, 'safetyZones');

  // Location tracking methods
  async updateLocation(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }): Promise<Location> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      console.log('📍 Firebase Location Update:', location);

      const locationData = {
        userId: user.uid,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude || null,
        speed: location.speed || null,
        heading: location.heading || null,
        geopoint: new GeoPoint(location.latitude, location.longitude),
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      // Add location to Firestore
      const docRef = await addDoc(this.locationsCollection, locationData);

      // Update user's last location
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });

      // Check for geofencing alerts
      await this.checkGeofencing(location.latitude, location.longitude);

      return {
        id: docRef.id,
        touristId: user.uid,
        ...locationData,
        timestamp: new Date().toISOString(),
        address: await this.reverseGeocode(location.latitude, location.longitude),
      } as Location;
    } catch (error: any) {
      console.error('Firebase location update error:', error);
      throw new Error(error.message || 'Location update failed');
    }
  }

  async getCurrentLocation(): Promise<Location | null> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        this.locationsCollection,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        touristId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp.toDate().toISOString(),
        address: await this.reverseGeocode(data.latitude, data.longitude),
      } as Location;
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  async getLocationHistory(limitCount = 50, lastDoc?: any): Promise<{
    locations: Location[];
    total: number;
    hasMore: boolean;
    lastDoc?: any;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      let q = query(
        this.locationsCollection,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      
      const locations: Location[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          id: doc.id,
          touristId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp.toDate().toISOString(),
          address: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
        });
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        locations,
        total: locations.length,
        hasMore: querySnapshot.docs.length === limitCount,
        lastDoc: lastVisible,
      };
    } catch (error) {
      console.error('Get location history error:', error);
      return {
        locations: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // Real-time location updates
  subscribeToLocationUpdates(
    userId: string,
    callback: (locations: Location[]) => void
  ): () => void {
    const q = query(
      this.locationsCollection,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const locations: Location[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          id: doc.id,
          touristId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp.toDate().toISOString(),
          address: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
        });
      });
      callback(locations);
    });
  }

  // Geofencing methods
  async checkGeofencing(latitude: number, longitude: number): Promise<void> {
    try {
      // Get nearby safety zones
      const safetyZones = await this.getNearbyZones(latitude, longitude);
      
      for (const zone of safetyZones) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          zone.latitude,
          zone.longitude
        );

        if (distance <= zone.radius) {
          if (zone.type === 'danger') {
            // User entered danger zone - trigger alert
            await this.triggerGeofenceAlert(latitude, longitude, zone, 'danger_zone_entry');
          }
        }
      }
    } catch (error) {
      console.error('Geofencing check error:', error);
    }
  }

  async getNearbyZones(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    try {
      // For simplicity, get all safety zones and filter by distance
      // In production, use GeoFirestore for efficient geo queries
      const querySnapshot = await getDocs(this.safetyZonesCollection);
      
      const nearbyZones: any[] = [];
      querySnapshot.forEach((doc) => {
        const zone = doc.data();
        const distance = this.calculateDistance(
          latitude,
          longitude,
          zone.geopoint.latitude,
          zone.geopoint.longitude
        );

        if (distance <= radius) {
          nearbyZones.push({
            id: doc.id,
            ...zone,
            distance,
            latitude: zone.geopoint.latitude,
            longitude: zone.geopoint.longitude,
          });
        }
      });

      return nearbyZones;
    } catch (error) {
      console.error('Get nearby zones error:', error);
      return [];
    }
  }

  private async triggerGeofenceAlert(
    latitude: number,
    longitude: number,
    zone: any,
    alertType: string
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const alertData = {
        userId: user.uid,
        type: alertType,
        severity: zone.type === 'danger' ? 'HIGH' : 'MEDIUM',
        message: `User entered ${zone.type} zone: ${zone.name}`,
        latitude,
        longitude,
        geopoint: new GeoPoint(latitude, longitude),
        zoneId: zone.id,
        zoneName: zone.name,
        status: 'ACTIVE',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(this.alertsCollection, alertData);
      
      console.log(`🚨 Geofence alert triggered: ${alertType} in zone ${zone.name}`);
    } catch (error) {
      console.error('Trigger geofence alert error:', error);
    }
  }

  // Utility methods
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

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // Safety score calculation
  async getSafetyScore(latitude: number, longitude: number): Promise<{
    safetyScore: number;
    factors: any;
    recommendations: string[];
  }> {
    try {
      const nearbyZones = await this.getNearbyZones(latitude, longitude);
      const nearbyAlerts = await this.getNearbyAlerts(latitude, longitude);
      
      let safetyScore = 10; // Start with perfect score
      const factors: any = {};
      const recommendations: string[] = [];

      // Reduce score based on danger zones
      const dangerZones = nearbyZones.filter(zone => zone.type === 'danger');
      if (dangerZones.length > 0) {
        safetyScore -= dangerZones.length * 2;
        factors.dangerZones = dangerZones.length;
        recommendations.push('Avoid nearby danger zones');
      }

      // Reduce score based on recent alerts
      const recentAlerts = nearbyAlerts.filter(alert => 
        new Date(alert.createdAt.toDate()).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      if (recentAlerts.length > 0) {
        safetyScore -= recentAlerts.length * 1;
        factors.recentAlerts = recentAlerts.length;
        recommendations.push('High alert activity in this area');
      }

      // Increase score for safe zones
      const safeZones = nearbyZones.filter(zone => zone.type === 'safe');
      if (safeZones.length > 0) {
        safetyScore += safeZones.length * 0.5;
        factors.safeZones = safeZones.length;
      }

      return {
        safetyScore: Math.max(0, Math.min(10, safetyScore)),
        factors,
        recommendations,
      };
    } catch (error) {
      console.error('Safety score calculation error:', error);
      return {
        safetyScore: 5.0,
        factors: {},
        recommendations: ['Unable to calculate safety score'],
      };
    }
  }

  private async getNearbyAlerts(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    try {
      // Get recent alerts and filter by distance
      const q = query(
        this.alertsCollection,
        where('status', '==', 'ACTIVE'),
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
}

export const firebaseLocationService = new FirebaseLocationService();