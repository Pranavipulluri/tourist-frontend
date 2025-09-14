import { apiService } from './api';
import { websocketService } from './websocket';

export interface EmergencyAlert {
  id: string;
  touristId: string;
  type: 'SOS' | 'PANIC' | 'MEDICAL' | 'ACCIDENT' | 'CRIME' | 'NATURAL_DISASTER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  message: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  tourist?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  responseTime?: number;
  emergencyContacts?: EmergencyContact[];
  notifications?: EmergencyNotification[];
  firNumber?: string; // FIR (First Information Report) number
  dispatchedUnits?: DispatchedUnit[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
}

export interface EmergencyNotification {
  id: string;
  type: 'SMS' | 'EMAIL' | 'CALL' | 'PUSH' | 'WHATSAPP';
  recipient: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: string;
  message?: string;
  error?: string;
}

export interface DispatchedUnit {
  id: string;
  type: 'POLICE' | 'AMBULANCE' | 'FIRE' | 'RESCUE';
  unitId: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RETURNING';
  estimatedArrival?: string;
  actualArrival?: string;
  assignedOfficer?: string;
  contactNumber?: string;
}

export interface EmergencyCallRequest {
  touristId: string;
  adminId: string;
  reason: 'EMERGENCY_RESPONSE' | 'FOLLOW_UP' | 'MEDICAL_CONSULTATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alertId?: string;
}

export interface TwilioCallSession {
  sid: string;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed';
  from: string;
  to: string;
  duration?: number;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
}

class EmergencyResponseService {
  private static instance: EmergencyResponseService;
  private emergencyCallbacks: Map<string, (alert: EmergencyAlert) => void> = new Map();

  public static getInstance(): EmergencyResponseService {
    if (!EmergencyResponseService.instance) {
      EmergencyResponseService.instance = new EmergencyResponseService();
    }
    return EmergencyResponseService.instance;
  }

  constructor() {
    this.initializeWebSocketListeners();
  }

  private initializeWebSocketListeners() {
    // Listen for emergency alerts from tourists
    websocketService.on('sos_alert_created', (alert: EmergencyAlert) => {
      console.log('🚨 SOS Alert received:', alert);
      this.handleNewEmergencyAlert(alert);
    });

    // Listen for alert status updates from admin
    websocketService.on('emergency_alert_updated', (alert: EmergencyAlert) => {
      console.log('📝 Emergency alert updated:', alert);
      this.handleEmergencyAlertUpdate(alert);
    });

    // Listen for Twilio call events
    websocketService.on('twilio_call_status', (callData: TwilioCallSession) => {
      console.log('📞 Call status update:', callData);
      this.handleCallStatusUpdate(callData);
    });
  }

  // ==== EMERGENCY ALERT MANAGEMENT ====

  async triggerEmergencyAlert(alertData: {
    type: EmergencyAlert['type'];
    message: string;
    location: { latitude: number; longitude: number; accuracy?: number };
    severity?: EmergencyAlert['severity'];
  }): Promise<EmergencyAlert> {
    try {
      console.log('🚨 Triggering emergency alert:', alertData);

      // Get current location address
      let address: string | undefined;
      try {
        const reverseGeocode = await apiService.reverseGeocode(
          alertData.location.latitude,
          alertData.location.longitude
        );
        address = reverseGeocode;
      } catch (error) {
        console.warn('Could not get address:', error);
      }

      // Create emergency alert
      const alert = await apiService.triggerEnhancedEmergency({
        type: alertData.type,
        severity: alertData.severity || 'HIGH',
        latitude: alertData.location.latitude,
        longitude: alertData.location.longitude,
        accuracy: alertData.location.accuracy,
        address,
        message: alertData.message
      });

      console.log('✅ Emergency alert created:', alert);

      // Trigger all emergency protocols
      await this.executeEmergencyProtocols(alert);

      return alert;
    } catch (error) {
      console.error('❌ Failed to trigger emergency alert:', error);
      throw error;
    }
  }

  private async executeEmergencyProtocols(alert: EmergencyAlert) {
    console.log('🚀 Executing emergency protocols for alert:', alert.id);

    try {
      // 1. Real-time notification to admin panel
      websocketService.emit('emergency_alert_broadcast', alert);

      // 2. Notify emergency contacts via Twilio
      await this.notifyEmergencyContacts(alert);

      // 3. Send location to emergency services
      await this.notifyEmergencyServices(alert);

      // 4. Create FIR (First Information Report) if applicable
      if (alert.type === 'CRIME' || alert.severity === 'CRITICAL') {
        await this.generateFIR(alert);
      }

      // 5. Start location tracking beacon
      await this.startLocationTracking(alert);

      // 6. Send push notifications to nearby admins
      await this.notifyNearbyAdmins(alert);

    } catch (error) {
      console.error('❌ Emergency protocols execution failed:', error);
    }
  }

  // ==== TWILIO INTEGRATION ====

  async initiateEmergencyCall(request: EmergencyCallRequest): Promise<TwilioCallSession> {
    try {
      console.log('📞 Initiating emergency call:', request);

      const response = await fetch('/api/emergency/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const callSession: TwilioCallSession = await response.json();
      console.log('✅ Call initiated:', callSession);

      return callSession;
    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      throw error;
    }
  }

  async endEmergencyCall(sessionId: string): Promise<void> {
    try {
      await fetch(`/api/emergency/call/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      console.log('✅ Call ended:', sessionId);
    } catch (error) {
      console.error('❌ Failed to end call:', error);
    }
  }

  private async notifyEmergencyContacts(alert: EmergencyAlert) {
    try {
      console.log('📱 Notifying emergency contacts for alert:', alert.id);

      const response = await fetch('/api/emergency/notify-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          alertId: alert.id,
          touristId: alert.touristId,
          location: alert.location,
          message: alert.message,
          severity: alert.severity
        })
      });

      if (response.ok) {
        const notifications = await response.json();
        console.log('✅ Emergency contacts notified:', notifications);
      }
    } catch (error) {
      console.error('❌ Failed to notify emergency contacts:', error);
    }
  }

  private async notifyEmergencyServices(alert: EmergencyAlert) {
    try {
      console.log('🚑 Notifying emergency services for alert:', alert.id);

      const response = await fetch('/api/emergency/notify-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          location: alert.location,
          touristInfo: alert.tourist
        })
      });

      if (response.ok) {
        const dispatch = await response.json();
        console.log('✅ Emergency services notified:', dispatch);
      }
    } catch (error) {
      console.error('❌ Failed to notify emergency services:', error);
    }
  }

  // ==== FIR (First Information Report) AUTOMATION ====

  private async generateFIR(alert: EmergencyAlert): Promise<string | null> {
    try {
      console.log('📋 Generating FIR for alert:', alert.id);

      const response = await fetch('/api/emergency/generate-fir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          alertId: alert.id,
          incidentType: alert.type,
          location: alert.location,
          description: alert.message,
          touristDetails: alert.tourist,
          timestamp: alert.createdAt
        })
      });

      if (response.ok) {
        const fir = await response.json();
        console.log('✅ FIR generated:', fir.firNumber);
        return fir.firNumber;
      }
    } catch (error) {
      console.error('❌ Failed to generate FIR:', error);
    }
    return null;
  }

  // ==== LOCATION TRACKING ====

  private async startLocationTracking(alert: EmergencyAlert) {
    try {
      console.log('📍 Starting location tracking for alert:', alert.id);

      // Start high-frequency location updates
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };

            // Send location update to backend
            websocketService.emit('emergency_location_update', {
              alertId: alert.id,
              location
            });
          },
          (error) => console.error('Location tracking error:', error),
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
          }
        );

        // Store watch ID for cleanup
        sessionStorage.setItem(`location_watch_${alert.id}`, watchId.toString());
      }
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
    }
  }

  async stopLocationTracking(alertId: string) {
    try {
      const watchId = sessionStorage.getItem(`location_watch_${alertId}`);
      if (watchId) {
        navigator.geolocation.clearWatch(parseInt(watchId));
        sessionStorage.removeItem(`location_watch_${alertId}`);
        console.log('✅ Location tracking stopped for alert:', alertId);
      }
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
    }
  }

  // ==== EVENT HANDLERS ====

  private handleNewEmergencyAlert(alert: EmergencyAlert) {
    // Notify all registered callbacks
    this.emergencyCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Emergency Alert', {
        body: `${alert.type} alert from ${alert.tourist?.firstName} ${alert.tourist?.lastName}`,
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: `emergency-${alert.id}`
      });
    }

    // Play sound alert
    this.playEmergencySound();
  }

  private handleEmergencyAlertUpdate(alert: EmergencyAlert) {
    // Update any active UI components
    websocketService.emit('emergency_alert_status_changed', alert);
  }

  private handleCallStatusUpdate(callData: TwilioCallSession) {
    console.log('📞 Call status:', callData.status);
    
    // Update call UI if active
    websocketService.emit('call_status_update', callData);
  }

  private async notifyNearbyAdmins(alert: EmergencyAlert) {
    try {
      const response = await fetch('/api/emergency/notify-nearby-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          alertId: alert.id,
          location: alert.location,
          radius: 5000 // 5km radius
        })
      });

      if (response.ok) {
        console.log('✅ Nearby admins notified');
      }
    } catch (error) {
      console.error('❌ Failed to notify nearby admins:', error);
    }
  }

  private playEmergencySound() {
    try {
      const audio = new Audio('/sounds/emergency-alert.mp3');
      audio.volume = 0.8;
      audio.play().catch(error => {
        console.warn('Could not play emergency sound:', error);
      });
    } catch (error) {
      console.warn('Emergency sound not available:', error);
    }
  }

  // ==== PUBLIC API ====

  onEmergencyAlert(callback: (alert: EmergencyAlert) => void): string {
    const id = Date.now().toString();
    this.emergencyCallbacks.set(id, callback);
    return id;
  }

  offEmergencyAlert(id: string): void {
    this.emergencyCallbacks.delete(id);
  }

  async acknowledgeEmergencyAlert(alertId: string, adminId: string): Promise<void> {
    try {
      await apiService.acknowledgeEmergencyAlert(alertId, adminId);
      console.log('✅ Emergency alert acknowledged:', alertId);
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      throw error;
    }
  }

  async resolveEmergencyAlert(alertId: string, resolution: string, adminId: string): Promise<void> {
    try {
      await apiService.resolveEmergencyAlert(alertId, resolution, adminId);
      console.log('✅ Emergency alert resolved:', alertId);
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      throw error;
    }
  }

  async getEmergencyAlerts(status?: EmergencyAlert['status']): Promise<EmergencyAlert[]> {
    try {
      return await apiService.getEmergencyAlerts(status || 'ACTIVE');
    } catch (error) {
      console.error('❌ Failed to get emergency alerts:', error);
      return [];
    }
  }
}

export const emergencyResponseService = EmergencyResponseService.getInstance();
export default emergencyResponseService;