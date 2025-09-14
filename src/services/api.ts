import axios, { AxiosInstance } from 'axios';

// API base URL for the backend (Backend runs on port 3001)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('🔍 DEBUG: API Configuration:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Google Maps API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

// Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Tourist {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emergencyContact: string;
  nationality: string;
  passportNumber: string;
  digitalId?: string;
  digitalBlockchainId?: string;
  role?: 'TOURIST' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  touristId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  touristId: string;
  type: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  latitude: number;
  longitude: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  address?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  tourist?: Tourist;
}

export interface IoTDevice {
  id: string;
  touristId: string;
  deviceId: string;
  deviceType: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER';
  batteryLevel: number;
  lastSeen: string;
  isActive: boolean;
  configuration: Record<string, any>;
}

export interface DashboardStats {
  totalTourists: number;
  activeTourists: number;
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number;
}

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private googleMapsApiKey = 'AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      maxRedirects: 5,
      maxContentLength: 2000000,
      maxBodyLength: 2000000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();
    this.setupInterceptors();
  }
  
  // HTTP methods
  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }
  
  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }
  
  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }
  
  async patch(url: string, data?: any, config?: any) {
    return this.api.patch(url, data, config);
  }
  
  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    if (this.accessToken) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    }
  }

  private saveTokens(tokens: { token: string }) {
    this.accessToken = tokens.token;
    
    localStorage.setItem('accessToken', tokens.token);
    
    this.api.defaults.headers.common['Authorization'] = `Bearer ${tokens.token}`;
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    delete this.api.defaults.headers.common['Authorization'];
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          this.clearTokens();
          // Don't redirect automatically, let components handle it
          console.log('Authentication required');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication API (using real backend auth endpoints)
  async register(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber?: string;
    emergencyContact?: string;
    nationality?: string;
    passportNumber?: string;
    role?: 'TOURIST' | 'ADMIN';
  }): Promise<{ user: Tourist; token: string }> {
    console.log('🚀 REGISTER DEBUG:');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    // Use different endpoint based on role
    const endpoint = userData.role === 'ADMIN' ? '/auth/register/admin' : '/auth/register';
    console.log('Calling endpoint:', endpoint);
    console.log('Registration data:', userData);
    
    const response = await this.api.post(endpoint, {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      emergencyContact: userData.emergencyContact,
      nationality: userData.nationality,
      passportNumber: userData.passportNumber,
      role: userData.role || 'TOURIST'
    });
    
    const result = response.data;
    if (result.token) {
      this.saveTokens({ token: result.token });
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async login(email: string, password: string): Promise<{ user: Tourist; token: string }> {
    console.log('🔐 LOGIN DEBUG:');
    console.log('Calling endpoint: /auth/login');
    
    const response = await this.api.post('/auth/login', { email, password });
    const result = response.data;
    
    if (result.token) {
      this.saveTokens({ token: result.token });
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Clear tokens without making API call (for invalid tokens)
  clearAuthTokens(): void {
    this.clearTokens();
  }

  getCurrentUser(): Tourist | null {
    // Return the current user from localStorage or state
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Location Tracking API (using real backend endpoints)
  async updateLocation(location: {
    touristId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }): Promise<Location> {
    console.log('📍 LOCATION UPDATE DEBUG:');
    console.log('Calling endpoint: /location/update');
    console.log('Location data:', location);
    
    const response = await this.api.post('/location/update', location);
    console.log('📍 LOCATION UPDATE RESPONSE:', response.data);
    return response.data; // Backend returns location data directly
  }

  async getCurrentLocation(): Promise<Location> {
    try {
      console.log('🔍 GET CURRENT LOCATION DEBUG:');
      
      // We need the user to be authenticated to get their location
      if (!this.accessToken) {
        throw new Error('User not authenticated');
      }
      
      // For now, since we don't have a way to get user ID from token,
      // let's try to get it from stored user data
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user?.id) {
        throw new Error('User ID not found');
      }
      
      console.log('Calling endpoint: /location/current/' + user.id);
      
      const response = await this.api.get(`/location/current/${user.id}`);
      console.log('🔍 GET CURRENT LOCATION RESPONSE:', response.data);
      return response.data.currentLocation || response.data;
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }

  async getLocationHistory(limit = 50, offset = 0): Promise<{
    locations: Location[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.api.get('/location/history', {
      params: { limit, offset },
    });
    
    return {
      locations: response.data.locations,
      total: response.data.pagination?.total || response.data.locations.length,
      hasMore: response.data.locations.length === limit
    };
  }

  // Emergency Alerts API (using real backend endpoints)
  async triggerSOS(location?: { latitude: number; longitude: number }): Promise<Alert> {
    const user = this.getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await this.api.post('/alerts/sos', {
      touristId: user.id,
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      message: 'Emergency SOS Alert - Immediate assistance required!'
    });
    return response.data;
  }

  // Enhanced emergency alert system
  async triggerEnhancedEmergency(alertData: {
    type: 'SOS' | 'PANIC' | 'MEDICAL' | 'ACCIDENT' | 'CRIME' | 'NATURAL_DISASTER';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    message: string;
  }): Promise<any> {
    const user = this.getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await this.api.post('/emergency/alert', {
      ...alertData,
      touristId: user.id
    });
    return response.data.alert;
  }

  async triggerPanic(message?: string, location?: { latitude: number; longitude: number }): Promise<Alert> {
    const user = this.getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await this.api.post('/alerts/panic', {
      touristId: user.id,
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      message: message || 'Panic Button Pressed - Help needed!'
    });
    return response.data;
  }

  async getMyAlerts(status?: string, limit = 20): Promise<{
    alerts: Alert[];
    total: number;
  }> {
    try {
      const user = this.getCurrentUser();
      if (!user?.id) {
        return { alerts: [], total: 0 };
      }

      console.log('🔔 GET ALERTS DEBUG:');
      console.log('Calling endpoint: /alerts');
      
      const params: any = { touristId: user.id, limit };
      if (status) params.status = status;
      
      const response = await this.api.get('/alerts', { params });
      
      return {
        alerts: response.data,
        total: response.data.length
      };
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return { alerts: [], total: 0 };
    }
  }

  // Admin endpoints for alerts
  async getSOSAlertsAdmin(): Promise<Alert[]> {
    try {
      const response = await this.api.get('/alerts', {
        params: { type: 'SOS' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch SOS alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    const response = await this.api.patch(`/alerts/${alertId}/acknowledge`, {
      acknowledgedBy
    });
    return response.data;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<Alert> {
    const response = await this.api.put(`/alerts/${alertId}/resolve`, { resolvedBy });
    return response.data;
  }

  // Enhanced emergency system methods
  async acknowledgeEmergencyAlert(alertId: string, adminId: string): Promise<void> {
    await this.api.post(`/emergency/acknowledge/${alertId}`, { adminId });
  }

  async resolveEmergencyAlert(alertId: string, resolution: string, adminId: string): Promise<void> {
    await this.api.post(`/emergency/resolve/${alertId}`, { resolution, adminId });
  }

  async getEmergencyAlerts(status?: string): Promise<any[]> {
    try {
      const response = await this.api.get('/emergency/alerts', { 
        params: status ? { status } : {} 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch emergency alerts:', error);
      return [];
    }
  }

  async getHeatmapData(filters?: any): Promise<any> {
    try {
      const response = await this.api.get('/alerts/heatmap', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
      return {
        heatmapData: [],
        totalAlerts: 0,
        hotspots: [],
        alertsByType: {},
        alertsBySeverity: {}
      };
    }
  }

  async getAlertStatistics(): Promise<any> {
    try {
      const response = await this.api.get('/alerts/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert statistics:', error);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        averageResponseTime: null
      };
    }
  }

  // IoT Device Management API (using real backend endpoints)
  async getMyDevice(): Promise<IoTDevice | null> {
    try {
      const response = await this.api.get('/devices');
      const devices = response.data.devices;
      return devices.length > 0 ? devices[0] : null;
    } catch (error) {
      console.error('Failed to get device:', error);
      return null;
    }
  }

  async pairDevice(deviceData: {
    deviceId: string;
    deviceType: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER';
    deviceName: string;
  }): Promise<IoTDevice> {
    const response = await this.api.post('/devices/register', {
      deviceId: deviceData.deviceId,
      deviceType: deviceData.deviceType.toLowerCase(),
      deviceName: deviceData.deviceName
    });
    return response.data.device;
  }

  // Safety and Geofencing
  async getSafeZones(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    try {
      const response = await this.api.get('/location/safe-zones', {
        params: { latitude, longitude, radius }
      });
      return response.data.safeZones;
    } catch (error) {
      console.error('Failed to get safe zones:', error);
      return [];
    }
  }

  async getSafetyScore(latitude: number, longitude: number): Promise<any> {
    try {
      const response = await this.api.get('/location/safety-score', {
        params: { latitude, longitude }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get safety score:', error);
      return { safetyScore: 5.0, factors: {}, recommendations: [] };
    }
  }

  async getNearbyAlerts(latitude: number, longitude: number, radius = 5000): Promise<any[]> {
    try {
      const response = await this.api.get('/alerts/nearby', {
        params: { latitude, longitude, radius }
      });
      return response.data.alerts;
    } catch (error) {
      console.error('Failed to get nearby alerts:', error);
      return [];
    }
  }

  // Emergency contacts
  async getEmergencyContacts(countryCode = 'IN'): Promise<any[]> {
    try {
      const response = await this.api.get(`/emergency/contacts/${countryCode}`);
      return response.data.emergencyContacts;
    } catch (error) {
      console.error('Failed to get emergency contacts:', error);
      return [];
    }
  }

  async addPersonalEmergencyContact(contact: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  }): Promise<any> {
    const response = await this.api.post('/emergency/personal-contacts', contact);
    return response.data.contact;
  }

  async getPersonalEmergencyContacts(): Promise<any[]> {
    try {
      const response = await this.api.get('/emergency/personal-contacts');
      return response.data.contacts;
    } catch (error) {
      console.error('Failed to get personal emergency contacts:', error);
      return [];
    }
  }

  // Safety check for automated monitoring
  async performSafetyCheck(latitude: number, longitude: number): Promise<any> {
    try {
      const response = await this.api.post('/emergency/safety-check', {
        latitude,
        longitude,
        source: 'automatic'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to perform safety check:', error);
      return { safetyStatus: { isInDangerZone: false, isInactive: false } };
    }
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

  // Remove duplicate - already defined above

  async updateProfile(updates: Partial<Tourist>): Promise<Tourist> {
    const response = await this.api.put('/auth/profile', updates);
    return response.data.user;
  }

  async getProfile(): Promise<Tourist | null> {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data.user;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  async createDigitalId(): Promise<{ digitalId: string; qrCode: string }> {
    const response = await this.api.post('/digital-id/create');
    return response.data;
  }

  async getDigitalId(): Promise<{ digitalId: string; qrCode: string; issuedAt: string }> {
    const response = await this.api.get('/digital-id');
    return response.data;
  }

  async unpairDevice(): Promise<void> {
    await this.api.delete('/devices/unpair');
  }

  // Dashboard API (Admin)
  async getDashboardOverview(): Promise<DashboardStats> {
    const response = await this.api.get('/admin/dashboard/overview');
    return response.data;
  }

  // Admin - Tourist Management
  async getAllTourists(): Promise<Tourist[]> {
    const response = await this.api.get('/admin/tourists');
    return response.data.tourists || [];
  }

  async getTouristById(touristId: string): Promise<Tourist> {
    const response = await this.api.get(`/admin/tourists/${touristId}`);
    return response.data;
  }

  async getTouristLocationHistory(touristId: string): Promise<Location[]> {
    const response = await this.api.get(`/admin/tourists/${touristId}/locations`);
    return response.data.locations || [];
  }

  async updateTouristStatus(touristId: string, status: 'active' | 'inactive'): Promise<void> {
    await this.api.patch(`/admin/tourists/${touristId}/status`, { status });
  }

  // Admin - Real-time Alerts Management
  async getAllAlertsAdmin(): Promise<Alert[]> {
    const response = await this.api.get('/admin/alerts');
    return response.data.alerts || [];
  }

  // Remove duplicate - already defined above

  async markAlertAsHandled(alertId: string, handledBy: string): Promise<void> {
    await this.api.patch(`/admin/alerts/${alertId}/handle`, { handledBy });
  }

  async broadcastAlert(alertData: {
    type: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    targetLocation?: { latitude: number; longitude: number; radius: number };
  }): Promise<Alert> {
    const response = await this.api.post('/admin/alerts/broadcast', alertData);
    return response.data;
  }

  async getDashboardStatistics(timeRange = '24h'): Promise<{
    stats: DashboardStats;
    trends: Array<{ timestamp: string; [key: string]: any }>;
  }> {
    const response = await this.api.get('/admin/dashboard/statistics', {
      params: { timeRange },
    });
    return response.data;
  }

  async getAlertHeatmap(bounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  }): Promise<Array<{
    latitude: number;
    longitude: number;
    intensity: number;
    alertCount: number;
  }>> {
    const response = await this.api.get('/dashboard/heatmap', {
      params: {
        neLat: bounds.northEast.lat,
        neLng: bounds.northEast.lng,
        swLat: bounds.southWest.lat,
        swLng: bounds.southWest.lng,
      },
    });
    return response.data;
  }

  async getLiveFeed(limit = 50): Promise<Array<{
    id: string;
    type: 'ALERT' | 'LOCATION_UPDATE' | 'DEVICE_STATUS' | 'SYSTEM_EVENT';
    message: string;
    data: any;
    timestamp: string;
  }>> {
    const response = await this.api.get('/dashboard/live-feed', {
      params: { limit },
    });
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAuthToken(): string | null {
    return this.accessToken;
  }

  // Geofencing/Zone Management API
  async getZones(): Promise<any[]> {
    const response = await this.api.get('/admin/zones');
    return response.data;
  }

  async createZone(zoneData: any): Promise<any> {
    const response = await this.api.post('/admin/zones', zoneData);
    return response.data;
  }

  async updateZone(zoneId: string, zoneData: any): Promise<any> {
    const response = await this.api.put(`/admin/zones/${zoneId}`, zoneData);
    return response.data;
  }

  async deleteZone(zoneId: string): Promise<void> {
    await this.api.delete(`/admin/zones/${zoneId}`);
  }

  async getZoneViolations(touristId: string): Promise<any[]> {
    const response = await this.api.get(`/geofencing/violations/${touristId}`);
    return response.data;
  }

  // Emergency Management API
  async getEmergencyAlertsAdmin(touristId?: string): Promise<any[]> {
    const url = touristId ? `/emergency/alerts/${touristId}` : '/emergency/alerts';
    const response = await this.api.get(url);
    return response.data;
  }

  async createFIR(firData: any): Promise<any> {
    const response = await this.api.post('/emergency/fir', firData);
    return response.data;
  }

  async getFIRs(touristId?: string): Promise<any[]> {
    const response = await this.api.get('/admin/fir', {
      params: touristId ? { touristId } : {}
    });
    return response.data;
  }

  async sendSMSAlert(data: any): Promise<any> {
    const response = await this.api.post('/admin/sms-alert', data);
    return response.data;
  }

  // SMS Logs API
  async getSMSLogs(): Promise<any[]> {
    const response = await this.api.get('/admin/sms-logs');
    return response.data;
  }

  // Tourism and Sentiment API
  async getTouristFeedback(): Promise<any[]> {
    const response = await this.api.get('/tourist/feedback');
    return response.data;
  }

  async submitFeedback(feedbackData: any): Promise<any> {
    const response = await this.api.post('/tourist/feedback', feedbackData);
    return response.data;
  }

  // Predictive Analytics API
  async getRiskPredictions(): Promise<any> {
    const response = await this.api.get('/admin/analytics/risk-predictions');
    return response.data;
  }

  async getPatrolRecommendations(): Promise<any[]> {
    const response = await this.api.get('/admin/analytics/patrol-recommendations');
    return response.data;
  }

  // Sentiment Analysis API
  async getSentimentAnalysis(): Promise<any> {
    const response = await this.api.get('/admin/feedback/sentiment');
    return response.data;
  }

  // Compliance API
  async getComplianceLogs(): Promise<any[]> {
    const response = await this.api.get('/admin/compliance/logs');
    return response.data;
  }

  // Resource Management API
  async getResourceUnits(): Promise<any[]> {
    const response = await this.api.get('/admin/resources/units');
    return response.data;
  }

  async deployResources(deploymentData: any): Promise<any> {
    const response = await this.api.post('/admin/resources/deploy', deploymentData);
    return response.data;
  }

  // Digital Tourist ID API
  async issueDigitalId(digitalIdData: any): Promise<any> {
    const response = await this.api.post('/digital-tourist-id/issue', digitalIdData);
    return response.data;
  }

  async accessDigitalId(accessData: { blockchainId: string; accessReason: string; emergencyAccess?: boolean }): Promise<any> {
    const response = await this.api.post('/digital-tourist-id/access', accessData);
    return response.data;
  }

  async updateDigitalIdConsent(blockchainId: string, consentSettings: any): Promise<any> {
    const response = await this.api.put(`/digital-tourist-id/consent/${blockchainId}`, { consentSettings });
    return response.data;
  }

  async reportLostDigitalId(lostIdData: { blockchainId: string; reason: string; kioskLocation?: string }): Promise<any> {
    const response = await this.api.post('/digital-tourist-id/report-lost', lostIdData);
    return response.data;
  }

  async triggerEmergencyAccess(emergencyData: { blockchainId: string; reason: string; emergencyResponderAddress: string }): Promise<any> {
    const response = await this.api.post('/digital-tourist-id/emergency-access', emergencyData);
    return response.data;
  }

  async getDigitalIdDetails(blockchainId: string): Promise<any> {
    const response = await this.api.get(`/digital-tourist-id/${blockchainId}`);
    return response.data;
  }

  async getDigitalIdAccessLogs(blockchainId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const response = await this.api.get(`/digital-tourist-id/${blockchainId}/access-logs?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  async runAutoExpireDigitalIds(): Promise<any> {
    const response = await this.api.post('/digital-tourist-id/auto-expire');
    return response.data;
  }

  async getDigitalIdAnalytics(): Promise<any> {
    const response = await this.api.get('/digital-tourist-id/analytics/summary');
    return response.data;
  }

  async getBlockchainStatus(): Promise<any> {
    const response = await this.api.get('/digital-tourist-id/blockchain/status');
    return response.data;
  }

  // Geofencing Management API
  async getGeofences(): Promise<any> {
    const response = await this.api.get('/geofencing');
    return response.data;
  }

  async createGeofence(geofenceData: {
    name: string;
    description?: string;
    type: string;
    coordinates: { latitude: number; longitude: number }[];
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    alertMessage?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await this.api.post('/geofencing', geofenceData);
    return response.data;
  }

  async updateGeofence(geofenceId: string, updates: {
    name?: string;
    description?: string;
    type?: string;
    coordinates?: { latitude: number; longitude: number }[];
    centerLatitude?: number;
    centerLongitude?: number;
    radius?: number;
    alertMessage?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await this.api.put(`/geofencing/${geofenceId}`, updates);
    return response.data;
  }

  async deleteGeofence(geofenceId: string): Promise<any> {
    const response = await this.api.delete(`/geofencing/${geofenceId}`);
    return response.data;
  }

  async checkGeofenceViolation(touristId: string, latitude: number, longitude: number): Promise<any> {
    const response = await this.api.post('/geofencing/check-violation', {
      touristId,
      latitude,
      longitude
    });
    return response.data;
  }

  async bulkCheckGeofenceViolations(tourists: { touristId: string; latitude: number; longitude: number }[]): Promise<any> {
    const response = await this.api.post('/geofencing/bulk-check', { tourists });
    return response.data;
  }

  async getGeofenceViolations(touristId: string): Promise<any> {
    const response = await this.api.get(`/geofencing/violations/${touristId}`);
    return response.data;
  }

  async getGeofenceStats(days: number = 7): Promise<any> {
    const response = await this.api.get('/geofencing/stats/violations', {
      params: { days }
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;