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
  'message': (message: WebSocketMessage) => void;
  'connected': () => void;
  'disconnected': () => void;
  'error': (error: Event) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private eventHandlers: Partial<WebSocketEventHandlers> = {};
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = apiService.getAuthToken();
    if (!token) {
      console.log('No auth token available for WebSocket connection');
      return;
    }

    this.isConnecting = true;
    const wsUrl = `ws://localhost:3000/api/v1/ws?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Subscribe to tourist tracking
      this.emit('join_tourist_tracking', { touristId: 'current' });
      this.emit('subscribe_to_alerts');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.emit('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.emit('error', error);
    };
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

  off<K extends keyof WebSocketEventHandlers>(event: K) {
    delete this.eventHandlers[event];
  }

  emit(event: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }

    // Call local event handler if exists
    const handler = this.eventHandlers[event as keyof WebSocketEventHandlers];
    if (handler) {
      (handler as any)(data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
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