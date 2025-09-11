import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tourist-safety-five.vercel.app';

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
  type: 'SOS' | 'PANIC' | 'GEOFENCE' | 'SAFETY_CHECK';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
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

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      maxRedirects: 5,
      maxContentLength: 2000000,
      maxBodyLength: 2000000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();
    this.setupInterceptors();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    if (this.accessToken) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    }
  }

  private saveTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    this.api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
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
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

    // Authentication API (using new auth endpoints)
  async register(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    emergencyContact?: string;
    nationality?: string;
    passportNumber?: string;
  }): Promise<Tourist> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async login(email: string, password: string): Promise<Tourist> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async refreshAccessToken(): Promise<boolean> {
    // TODO: Implement proper token refresh in backend
    return false;
  }

  async logout(): Promise<void> {
    // TODO: Implement proper logout in backend
    this.clearTokens();
  }

  // Tourist API
  async getTourists(): Promise<Tourist[]> {
    const response = await this.api.get('/tourist');
    return response.data;
  }

  // Tourist Profile API
  async getProfile(): Promise<Tourist> {
    const response = await this.api.get('/tourists/profile');
    return response.data;
  }

  async updateProfile(updates: Partial<Tourist>): Promise<Tourist> {
    const response = await this.api.put('/tourists/profile', updates);
    return response.data;
  }

  async createDigitalId(): Promise<{ digitalId: string; qrCode: string }> {
    const response = await this.api.post('/tourists/digital-id');
    return response.data;
  }

  async getDigitalId(): Promise<{ digitalId: string; qrCode: string; issuedAt: string }> {
    const response = await this.api.get('/tourists/digital-id');
    return response.data;
  }

  // Location Tracking API
  async updateLocation(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp?: string;
  }): Promise<Location> {
    const response = await this.api.post('/locations/update', {
      ...location,
      timestamp: location.timestamp || new Date().toISOString(),
    });
    return response.data;
  }

  async getCurrentLocation(): Promise<Location> {
    const response = await this.api.get('/locations/current');
    return response.data;
  }

  async getLocationHistory(limit = 50, offset = 0): Promise<{
    locations: Location[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.api.get('/locations/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  async batchUpdateLocations(locations: Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  }>): Promise<{ processed: number; errors: any[] }> {
    const response = await this.api.post('/locations/batch-update', { locations });
    return response.data;
  }

  // Emergency Alerts API
  async triggerSOS(location?: { latitude: number; longitude: number }): Promise<Alert> {
    const response = await this.api.post('/alerts/sos', { location });
    return response.data;
  }

  async triggerPanic(message?: string): Promise<Alert> {
    const response = await this.api.post('/alerts/panic', { message });
    return response.data;
  }

  async getMyAlerts(status?: string, limit = 20): Promise<{
    alerts: Alert[];
    total: number;
  }> {
    const response = await this.api.get('/alerts/my-alerts', {
      params: { status, limit },
    });
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    const response = await this.api.put(`/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  // IoT Device Management API
  async pairDevice(deviceData: {
    deviceId: string;
    deviceType: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER';
    pairingCode: string;
  }): Promise<IoTDevice> {
    const response = await this.api.post('/iot/pair', deviceData);
    return response.data;
  }

  async getMyDevice(): Promise<IoTDevice | null> {
    try {
      const response = await this.api.get('/iot/my-device');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async unpairDevice(): Promise<void> {
    await this.api.post('/iot/my-device/unpair');
  }

  async updateDeviceConfig(config: Record<string, any>): Promise<IoTDevice> {
    const response = await this.api.put('/iot/my-device/config', { config });
    return response.data;
  }

  // Dashboard API (Admin)
  async getDashboardOverview(): Promise<DashboardStats> {
    const response = await this.api.get('/dashboard/overview');
    return response.data;
  }

  async getDashboardStatistics(timeRange = '24h'): Promise<{
    stats: DashboardStats;
    trends: Array<{ timestamp: string; [key: string]: any }>;
  }> {
    const response = await this.api.get('/dashboard/statistics', {
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
}

export const apiService = new ApiService();
export default apiService;