import { apiService } from './api';
import { Database, supabase } from './supabase';

type Tourist = Database['public']['Tables']['tourists']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'] & {
  tourist?: Tourist;
};
type Location = Database['public']['Tables']['locations']['Row'];

// Transform functions to convert between snake_case and camelCase
const transformTouristToFrontend = (tourist: Tourist): any => ({
  id: tourist.id,
  email: tourist.email,
  firstName: tourist.first_name,
  lastName: tourist.last_name,
  phoneNumber: tourist.phone_number,
  emergencyContact: tourist.emergency_contact,
  nationality: tourist.nationality,
  passportNumber: tourist.passport_number,
  digitalId: tourist.digital_id,
  role: tourist.role,
  createdAt: tourist.created_at,
  updatedAt: tourist.updated_at
});

const transformAlertToFrontend = (alert: Alert): any => ({
  id: alert.id,
  touristId: alert.tourist_id,
  type: alert.type,
  severity: alert.severity,
  status: alert.status,
  message: alert.message,
  latitude: alert.latitude,
  longitude: alert.longitude,
  address: alert.address,
  acknowledgedBy: alert.acknowledged_by,
  resolvedBy: alert.resolved_by,
  acknowledgedAt: alert.acknowledged_at,
  resolvedAt: alert.resolved_at,
  createdAt: alert.created_at,
  updatedAt: alert.updated_at,
  metadata: alert.metadata,
  tourist: alert.tourist ? transformTouristToFrontend(alert.tourist) : undefined
});

const transformLocationToFrontend = (location: Location): any => ({
  id: location.id,
  touristId: location.tourist_id,
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy,
  altitude: location.altitude,
  speed: location.speed,
  heading: location.heading,
  address: location.address,
  timestamp: location.timestamp,
  createdAt: location.created_at
});

// Hybrid service that prioritizes SIH-25 backend over Supabase
class HybridApiService {
  private useBackendFirst = true; // Switch to backend-first approach

  // Use existing API service for authentication
  async register(userData: any) {
    return apiService.register(userData);
  }

  async login(email: string, password: string) {
    return apiService.login(email, password);
  }

  async logout() {
    return apiService.logout();
  }

  getCurrentUser() {
    return apiService.getCurrentUser();
  }

  isAuthenticated() {
    return apiService.isAuthenticated();
  }

  // Prioritize SIH-25 backend over Supabase
  async getAllTourists(): Promise<any[]> {
    if (this.useBackendFirst) {
      try {
        console.log('🔍 Fetching tourists from SIH-25 backend...');
        const result = await apiService.getAllTourists();
        console.log('✅ Successfully fetched from SIH-25 backend:', result?.length || 0, 'tourists');
        return result || [];
      } catch (backendError) {
        console.warn('🔄 SIH-25 backend failed, trying Supabase fallback:', backendError);
        try {
          const { data, error } = await supabase
            .from('tourists')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return (data || []).map(transformTouristToFrontend);
        } catch (supabaseError) {
          console.error('❌ Both backend and Supabase failed:', supabaseError);
          return [];
        }
      }
    }
    
    // Original Supabase-first logic for fallback
    try {
      console.log('🔍 Attempting to fetch tourists from Supabase...');
      const { data, error } = await supabase
        .from('tourists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error, falling back to SIH-25 backend:', error);
        throw error;
      }
      console.log('✅ Successfully fetched from Supabase:', data?.length || 0, 'tourists');
      return (data || []).map(transformTouristToFrontend);
    } catch (error) {
      console.warn('🔄 Supabase failed, using SIH-25 backend fallback:', error);
      try {
        const result = await apiService.getAllTourists();
        console.log('✅ Successfully fetched from SIH-25 backend:', result?.length || 0, 'tourists');
        return result || [];
      } catch (backendError) {
        console.error('❌ Both Supabase and backend failed:', backendError);
        return [];
      }
    }
  }

  async getTouristById(id: string): Promise<any | null> {
    if (this.useBackendFirst) {
      try {
        console.log('🔍 Fetching tourist by ID from SIH-25 backend:', id);
        const result = await apiService.getTouristById(id);
        return result;
      } catch (backendError) {
        console.warn('🔄 SIH-25 backend failed, trying Supabase fallback for tourist:', id);
        try {
          const { data, error } = await supabase
            .from('tourists')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          return data ? transformTouristToFrontend(data) : null;
        } catch (supabaseError) {
          console.error('❌ Both sources failed for tourist:', id, supabaseError);
          return null;
        }
      }
    }

    try {
      console.log('🔍 Fetching tourist by ID from Supabase:', id);
      const { data, error } = await supabase
        .from('tourists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.warn('Supabase error, falling back to SIH-25 backend:', error);
        throw error;
      }
      return data ? transformTouristToFrontend(data) : null;
    } catch (error) {
      console.warn('🔄 Using SIH-25 backend fallback for tourist:', id);
      try {
        const result = await apiService.getTouristById(id);
        return result;
      } catch (backendError) {
        console.error('❌ Both sources failed for tourist:', id, backendError);
        return null;
      }
    }
  }

  async getAllAlertsAdmin(): Promise<any[]> {
    if (this.useBackendFirst) {
      try {
        console.log('🔍 Fetching alerts from SIH-25 backend...');
        const result = await apiService.getAllAlertsAdmin();
        console.log('✅ Successfully fetched from SIH-25 backend:', result?.length || 0, 'alerts');
        return result || [];
      } catch (backendError) {
        console.warn('🔄 SIH-25 backend failed, trying Supabase fallback for alerts');
        try {
          const { data, error } = await supabase
            .from('alerts')
            .select(`
              *,
              tourist:tourists(*)
            `)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return (data || []).map(transformAlertToFrontend);
        } catch (supabaseError) {
          console.error('❌ Both sources failed for alerts:', supabaseError);
          return [];
        }
      }
    }

    try {
      console.log('🔍 Fetching alerts from Supabase...');
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          tourist:tourists(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error, falling back to SIH-25 backend:', error);
        throw error;
      }
      console.log('✅ Successfully fetched alerts from Supabase:', data?.length || 0);
      return (data || []).map(transformAlertToFrontend);
    } catch (error) {
      console.warn('🔄 Using SIH-25 backend fallback for alerts');
      try {
        const result = await apiService.getAllAlertsAdmin();
        console.log('✅ Successfully fetched from SIH-25 backend:', result?.length || 0, 'alerts');
        return result || [];
      } catch (backendError) {
        console.error('❌ Both sources failed for alerts:', backendError);
        return [];
      }
    }
  }

  async getSOSAlertsAdmin(): Promise<any[]> {
    try {
      console.log('🔍 Fetching SOS alerts from Supabase...');
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          tourist:tourists(*)
        `)
        .eq('type', 'SOS')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error, falling back to SIH-25 backend:', error);
        throw error;
      }
      return (data || []).map(transformAlertToFrontend);
    } catch (error) {
      console.warn('🔄 Using SIH-25 backend fallback for SOS alerts');
      try {
        const result = await apiService.getSOSAlertsAdmin();
        return result || [];
      } catch (backendError) {
        console.error('❌ Both sources failed for SOS alerts:', backendError);
        return [];
      }
    }
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'ACKNOWLEDGED',
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select(`
          *,
          tourist:tourists(*)
        `)
        .single();
      
      if (error) throw error;
      return data ? transformAlertToFrontend(data) : null;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return null;
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED',
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select(`
          *,
          tourist:tourists(*)
        `)
        .single();
      
      if (error) throw error;
      return data ? transformAlertToFrontend(data) : null;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return null;
    }
  }

  async getDashboardOverview() {
    if (this.useBackendFirst) {
      try {
        console.log('🔍 Fetching dashboard overview from SIH-25 backend...');
        const result = await apiService.getDashboardOverview();
        console.log('✅ Dashboard overview from SIH-25 backend:', result);
        return result;
      } catch (backendError) {
        console.warn('🔄 SIH-25 backend failed, trying Supabase fallback for dashboard');
        return this.getSupabaseDashboard();
      }
    }
    
    try {
      console.log('🔍 Fetching dashboard overview from Supabase...');
      return this.getSupabaseDashboard();
    } catch (error) {
      console.warn('🔄 Supabase failed, using SIH-25 backend fallback for dashboard');
      try {
        const result = await apiService.getDashboardOverview();
        console.log('✅ Dashboard overview from backend:', result);
        return result;
      } catch (backendError) {
        console.error('❌ Both sources failed for dashboard:', backendError);
        return {
          totalTourists: 0,
          activeTourists: 0,
          totalAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0,
          averageResponseTime: 0
        };
      }
    }
  }

  private async getSupabaseDashboard() {
    try {
      // Get tourists count with error handling
      let totalTourists = 0;
      try {
        const { count } = await supabase
          .from('tourists')
          .select('*', { count: 'exact', head: true });
        totalTourists = count || 0;
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error fetching tourists count:', error);
        }
      }

      // Get active tourists (last location within 1 hour)
      let activeTourists = 0;
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: activeTouristIds } = await supabase
          .from('locations')
          .select('tourist_id')
          .gte('timestamp', oneHourAgo);

        activeTourists = new Set(activeTouristIds?.map((l: any) => l.tourist_id)).size;
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error fetching active tourists:', error);
        }
      }

      // Get alerts count with error handling
      let totalAlerts = 0;
      let activeAlerts = 0;
      let resolvedAlerts = 0;
      
      try {
        const { count } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true });
        totalAlerts = count || 0;
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error fetching total alerts:', error);
        }
      }

      try {
        const { count } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');
        activeAlerts = count || 0;
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error fetching active alerts:', error);
        }
      }

      try {
        const { count } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'RESOLVED');
        resolvedAlerts = count || 0;
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error fetching resolved alerts:', error);
        }
      }

      // Calculate average response time
      let averageResponseTime = 0;
      try {
        const { data: resolvedAlertsData } = await supabase
          .from('alerts')
          .select('created_at, resolved_at')
          .eq('status', 'RESOLVED')
          .not('resolved_at', 'is', null);

        if (resolvedAlertsData && resolvedAlertsData.length > 0) {
          const totalResponseTime = resolvedAlertsData.reduce((sum: number, alert: any) => {
            const created = new Date(alert.created_at);
            const resolved = new Date(alert.resolved_at!);
            return sum + (resolved.getTime() - created.getTime());
          }, 0);
          averageResponseTime = totalResponseTime / resolvedAlertsData.length / 1000 / 60; // in minutes
        }
      } catch (error: any) {
        if (!error.message?.includes("Could not find the table")) {
          console.error('Error calculating response time:', error);
        }
      }

      const result = {
        totalTourists,
        activeTourists,
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        averageResponseTime
      };
      
      console.log('✅ Dashboard overview from Supabase:', result);
      return result;
    } catch (error) {
      console.error('Error in getSupabaseDashboard:', error);
      return {
        totalTourists: 0,
        activeTourists: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTime: 0
      };
    }
  }

  async getLocationHistory(touristId?: string, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (touristId) {
        query = query.eq('tourist_id', touristId);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        locations: (data || []).map(transformLocationToFrontend),
        total: count || 0,
        hasMore: (data?.length || 0) === limit
      };
    } catch (error) {
      console.error('Failed to fetch location history:', error);
      return {
        locations: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async getHeatmapData(filters?: any) {
    try {
      let query = supabase
        .from('alerts')
        .select('latitude, longitude, severity, type, created_at');

      // Apply filters if provided
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      
      // If table doesn't exist, return empty data instead of throwing
      if (error && error.message?.includes("Could not find the table")) {
        console.warn('Alerts table not found in Supabase, returning empty heatmap data');
        return {
          heatmapData: [],
          totalAlerts: 0,
          hotspots: [],
          alertsByType: {},
          alertsBySeverity: {}
        };
      }
      
      if (error) throw error;

      // Process data for heatmap
      const heatmapData = data?.map((alert: any) => ({
        lat: alert.latitude,
        lng: alert.longitude,
        weight: alert.severity === 'CRITICAL' ? 4 : 
                alert.severity === 'HIGH' ? 3 : 
                alert.severity === 'MEDIUM' ? 2 : 1
      })) || [];

      // Calculate statistics
      const totalAlerts = data?.length || 0;
      
      const alertsByType = data?.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const alertsBySeverity = data?.reduce((acc: Record<string, number>, alert: any) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Find hotspots (areas with multiple alerts)
      const hotspots = this.calculateHotspots(data || []);

      return {
        heatmapData,
        totalAlerts,
        hotspots,
        alertsByType,
        alertsBySeverity
      };
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

  private calculateHotspots(alerts: any[]) {
    // Simple clustering algorithm to find hotspots
    const hotspots: any[] = [];
    const processedAlerts = new Set<number>();
    const threshold = 0.01; // ~1km radius

    alerts.forEach((alert, index) => {
      if (processedAlerts.has(index)) return;

      const cluster = [alert];
      processedAlerts.add(index);

      alerts.forEach((otherAlert, otherIndex) => {
        if (processedAlerts.has(otherIndex) || index === otherIndex) return;

        const distance = this.calculateDistance(
          alert.latitude, alert.longitude,
          otherAlert.latitude, otherAlert.longitude
        );

        if (distance <= threshold) {
          cluster.push(otherAlert);
          processedAlerts.add(otherIndex);
        }
      });

      if (cluster.length >= 3) { // Hotspot if 3 or more alerts
        const centerLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
        const centerLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
        
        hotspots.push({
          latitude: centerLat,
          longitude: centerLng,
          alertCount: cluster.length,
          severity: Math.max(...cluster.map(a => 
            a.severity === 'CRITICAL' ? 4 : 
            a.severity === 'HIGH' ? 3 : 
            a.severity === 'MEDIUM' ? 2 : 1
          ))
        });
      }
    });

    return hotspots;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c / 1000; // Convert to kilometers
  }

  async getAlertStatistics() {
    try {
      const { count: total } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true });

      const { count: active } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      const { count: resolved } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'RESOLVED');

      // Calculate average response time
      const { data: resolvedAlerts } = await supabase
        .from('alerts')
        .select('created_at, resolved_at')
        .eq('status', 'RESOLVED')
        .not('resolved_at', 'is', null);

      let averageResponseTime = null;
      if (resolvedAlerts && resolvedAlerts.length > 0) {
        const totalResponseTime = resolvedAlerts.reduce((sum: number, alert: any) => {
          const created = new Date(alert.created_at);
          const resolved = new Date(alert.resolved_at!);
          return sum + (resolved.getTime() - created.getTime());
        }, 0);
        averageResponseTime = totalResponseTime / resolvedAlerts.length / 1000 / 60; // in minutes
      }

      return {
        total: total || 0,
        active: active || 0,
        resolved: resolved || 0,
        averageResponseTime
      };
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

  async updateTouristStatus(touristId: string, status: 'active' | 'inactive'): Promise<void> {
    // Use existing API service for this operation
    return apiService.updateTouristStatus(touristId, status);
  }

  // Real-time subscriptions using Supabase
  subscribeToAlerts(callback: (alert: any) => void) {
    return supabase
      .channel('alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload: any) => callback(transformAlertToFrontend(payload.new))
      )
      .subscribe();
  }

  subscribeToTouristLocations(callback: (location: any) => void) {
    return supabase
      .channel('locations')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'locations' },
        (payload: any) => callback(transformLocationToFrontend(payload.new))
      )
      .subscribe();
  }

  // Delegate remaining methods to existing API service
  async updateLocation(location: any) {
    return apiService.updateLocation(location);
  }

  async getCurrentLocation() {
    return apiService.getCurrentLocation();
  }

  async triggerSOS(location?: any) {
    return apiService.triggerSOS(location);
  }

  async triggerPanic(message?: string, location?: any) {
    return apiService.triggerPanic(message, location);
  }

  async getMyAlerts(status?: string, limit = 20) {
    return apiService.getMyAlerts(status, limit);
  }

  async getMyDevice() {
    return apiService.getMyDevice();
  }

  async pairDevice(deviceData: any) {
    return apiService.pairDevice(deviceData);
  }

  async unpairDevice() {
    return apiService.unpairDevice();
  }

  async getSafeZones(latitude: number, longitude: number, radius = 5000) {
    return apiService.getSafeZones(latitude, longitude, radius);
  }

  async getSafetyScore(latitude: number, longitude: number) {
    return apiService.getSafetyScore(latitude, longitude);
  }

  async getNearbyAlerts(latitude: number, longitude: number, radius = 5000) {
    return apiService.getNearbyAlerts(latitude, longitude, radius);
  }

  async getEmergencyContacts(countryCode = 'IN') {
    return apiService.getEmergencyContacts(countryCode);
  }

  async addPersonalEmergencyContact(contact: any) {
    return apiService.addPersonalEmergencyContact(contact);
  }

  async getPersonalEmergencyContacts() {
    return apiService.getPersonalEmergencyContacts();
  }

  async performSafetyCheck(latitude: number, longitude: number) {
    return apiService.performSafetyCheck(latitude, longitude);
  }

  getGoogleMapsApiKey() {
    return apiService.getGoogleMapsApiKey();
  }

  async reverseGeocode(latitude: number, longitude: number) {
    return apiService.reverseGeocode(latitude, longitude);
  }

  async updateProfile(updates: any) {
    return apiService.updateProfile(updates);
  }

  async getProfile() {
    return apiService.getProfile();
  }

  async createDigitalId() {
    return apiService.createDigitalId();
  }

  async getDigitalId() {
    return apiService.getDigitalId();
  }

  clearAuthTokens() {
    return apiService.clearAuthTokens();
  }

  getAuthToken() {
    return apiService.getAuthToken();
  }
}

export const hybridApiService = new HybridApiService();
export default hybridApiService;