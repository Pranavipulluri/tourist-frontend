import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { apiService } from './api';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketEventHandlers {
  'location_updated': (data: any) => void;
  'new_alert': (alert: any) => void;
  'critical_alert': (alert: any) => void;
  'device_status_changed': (device: any) => void;
  'dashboard-stats': (stats: any) => void;
  'tourist_location_updated': (data: any) => void;
  'tourist_status_changed': (data: any) => void;
  'new_tourist_registered': (data: any) => void;
  'sos_alert_created': (alert: any) => void;
  'sos_alert_handled': (alert: any) => void;
  // Enhanced Emergency System Events
  'emergency_alert_broadcast': (alert: any) => void;
  'emergency_alert_updated': (alert: any) => void;
  'emergency_alert_status_changed': (alert: any) => void;
  'call_status_update': (callData: any) => void;
  'twilio_call_status': (callData: any) => void;
  'emergency_location_update': (data: any) => void;
  'message': (message: WebSocketMessage) => void;
  'connected': () => void;
  'disconnected': () => void;
  'error': (error: Event) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private eventHandlers: Partial<WebSocketEventHandlers> = {};
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    const token = apiService.getAuthToken();
    if (!token) {
      console.log('No auth token available for WebSocket connection');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      console.log('🔌 WebSocket connecting to:', wsUrl);
      this.socket = io(wsUrl, {
        query: { token },
        transports: ['websocket'],
        autoConnect: true
      });
      this.setupEventListeners();
    } catch (error) {
      console.error('Socket.IO connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Subscribe to dashboard stats
      this.socket?.emit('get-dashboard-stats');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnecting = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket.IO connection error:', error);
      this.isConnecting = false;
      this.emit('error', error);
      this.scheduleReconnect();
    });

    // Handle dashboard stats updates
    this.socket.on('dashboard-stats', (stats: any) => {
      this.emit('dashboard-stats', stats);
    });

    // Handle new alerts (from backend emergency service)
    this.socket.on('alert', (alert: any) => {
      console.log('🚨 New alert received:', alert);
      this.emit('new_alert', alert);
      this.emit('sos_alert_created', alert);
      
      // Show critical notification for SOS alerts
      if (alert.type === 'SOS' || alert.emergency_type === 'SOS') {
        this.showNotification(
          '🚨 SOS Alert!', 
          `Tourist ${alert.touristName || alert.touristId} needs immediate help!`,
          'error'
        );
      }
    });

    // Handle location updates (from backend location service)
    this.socket.on('location-update', (locationData: any) => {
      console.log('📍 Location update received:', locationData);
      this.emit('location_updated', locationData);
      this.emit('tourist_location_updated', locationData);
    });

    // Legacy event handlers for backward compatibility
    this.socket.on('new-alert', (alert: any) => {
      this.emit('new_alert', alert);
    });

    // Handle pong response
    this.socket.on('pong', (data: any) => {
      console.log('Received pong:', data);
    });
  }

  private handleMessage(message: WebSocketMessage) {
    // Emit the general message event
    this.emit('message', message);

    // Emit specific event based on message type
    switch (message.type) {
      case 'location_updated':
        this.emit('location_updated', message.data);
        break;
      case 'new_alert':
        this.emit('new_alert', message.data);
        break;
      case 'critical_alert':
        this.emit('critical_alert', message.data);
        // Show browser notification for critical alerts
        this.showNotification('Critical Alert', message.data.message, 'error');
        break;
      case 'device_status_changed':
        this.emit('device_status_changed', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private showNotification(title: string, body: string, type: 'info' | 'warning' | 'error' = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: type === 'error' ? '/icons/alert-red.png' : '/icons/alert-blue.png',
        tag: `tourist-safety-${type}`,
        requireInteraction: type === 'error',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds for non-critical notifications
      if (type !== 'error') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  // Public methods
  on<K extends keyof WebSocketEventHandlers>(event: K, handler: WebSocketEventHandlers[K]) {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof WebSocketEventHandlers>(event: K, handler?: WebSocketEventHandlers[K]) {
    if (handler) {
      // If a specific handler is provided, we would need to track multiple handlers
      // For now, just remove the event handler if it matches
      const currentHandler = this.eventHandlers[event];
      if (currentHandler === handler) {
        delete this.eventHandlers[event];
      }
    } else {
      // Remove all handlers for this event
      delete this.eventHandlers[event];
    }
  }

  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }

    // Call local event handler if exists
    const handler = this.eventHandlers[event as keyof WebSocketEventHandlers];
    if (handler) {
      (handler as any)(data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    
    if (this.socket.connected) return 'connected';
    if (this.socket.disconnected) return 'disconnected';
    return 'connecting';
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;