import { Alert, IoTDevice, Location, Tourist } from '../types';
import { firebaseAuthService } from './firebase-auth';
import { firebaseEmergencyService } from './firebase-emergency';
import { firebaseLocationService } from './firebase-location';

export class FirebaseAPIService {
  private googleMapsApiKey = 'AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A';

  // Authentication API
  async register(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber?: string;
    emergencyContact?: string;
    nationality?: string;
    passportNumber?: string;
  }): Promise<{ user: Tourist; token: string }> {
    return firebaseAuthService.register(userData);
  }

  async login(email: string, password: string): Promise<{ user: Tourist; token: string }> {
    return firebaseAuthService.login(email, password);
  }

  async logout(): Promise<void> {
    return firebaseAuthService.logout();
  }

  async resetPassword(email: string): Promise<void> {
    return firebaseAuthService.resetPassword(email);
  }

  // User Profile API
  async getProfile(): Promise<Tourist | null> {
    return firebaseAuthService.getCurrentUser();
  }

  async updateProfile(updates: Partial<Tourist>): Promise<Tourist> {
    return firebaseAuthService.updateProfile(updates);
  }

  // Location Tracking API
  async updateLocation(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }): Promise<Location> {
    console.log('📍 FIREBASE LOCATION UPDATE:', location);
    return firebaseLocationService.updateLocation(location);
  }

  async getCurrentLocation(): Promise<Location | null> {
    console.log('🔍 FIREBASE GET CURRENT LOCATION');
    return firebaseLocationService.getCurrentLocation();
  }

  async getLocationHistory(limit = 50, offset = 0): Promise<{
    locations: Location[];
    total: number;
    hasMore: boolean;
  }> {
    const result = await firebaseLocationService.getLocationHistory(limit);
    return {
      locations: result.locations,
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  // Emergency API
  async triggerSOS(location?: { latitude: number; longitude: number }): Promise<Alert> {
    return firebaseEmergencyService.triggerSOS(location);
  }

  async triggerPanic(message?: string): Promise<Alert> {
    return firebaseEmergencyService.triggerPanic(message);
  }

  async getMyAlerts(status = 'ACTIVE', limit = 20): Promise<{
    alerts: Alert[];
    total: number;
  }> {
    try {
      console.log('🔔 FIREBASE GET ALERTS');
      return firebaseEmergencyService.getMyAlerts(status, limit);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return { alerts: [], total: 0 };
    }
  }

  // Safety and Geofencing
  async getSafeZones(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    return firebaseLocationService.getNearbyZones(latitude, longitude, radius);
  }

  async getSafetyScore(latitude: number, longitude: number): Promise<any> {
    return firebaseLocationService.getSafetyScore(latitude, longitude);
  }

  async getNearbyAlerts(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    return firebaseEmergencyService.getNearbyAlerts(latitude, longitude, radius);
  }

  // Emergency contacts
  async getEmergencyContacts(countryCode = 'IN'): Promise<any[]> {
    return firebaseEmergencyService.getEmergencyContacts(countryCode);
  }

  async addPersonalEmergencyContact(contact: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }): Promise<any> {
    return firebaseEmergencyService.addPersonalEmergencyContact(contact);
  }

  async getPersonalEmergencyContacts(): Promise<any[]> {
    return firebaseEmergencyService.getPersonalEmergencyContacts();
  }

  // IoT Device Management (placeholder - can be implemented with Firebase)
  async getMyDevice(): Promise<IoTDevice | null> {
    // Placeholder for IoT device functionality
    return null;
  }

  async pairDevice(deviceData: {
    deviceId: string;
    deviceType: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER';
    deviceName: string;
  }): Promise<IoTDevice> {
    // Placeholder for device pairing
    throw new Error('Device pairing not implemented yet');
  }

  // Safety check for automated monitoring
  async performSafetyCheck(latitude: number, longitude: number): Promise<any> {
    return firebaseEmergencyService.performSafetyCheck(latitude, longitude);
  }

  // Google Maps integration
  getGoogleMapsApiKey(): string {
    return this.googleMapsApiKey;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleMapsApiKey}`
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

  // Weather data (placeholder)
  async getWeatherData(latitude: number, longitude: number): Promise<any> {
    try {
      // This would normally use OpenWeather API
      return {
        temperature: 25,
        condition: 'Clear',
        humidity: 60,
        windSpeed: 10,
        visibility: 'Good'
      };
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return null;
    }
  }

  // Real-time subscriptions
  subscribeToLocationUpdates(callback: (locations: Location[]) => void): () => void {
    const user = firebaseAuthService.getCurrentFirebaseUser();
    if (!user) {
      return () => {};
    }
    
    return firebaseLocationService.subscribeToLocationUpdates(user.uid, callback);
  }

  subscribeToAlerts(callback: (alerts: Alert[]) => void): () => void {
    return firebaseEmergencyService.subscribeToAlerts(callback);
  }
}

// Export singleton instance
export const firebaseAPI = new FirebaseAPIService();