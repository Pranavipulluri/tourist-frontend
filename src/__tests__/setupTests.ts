// src/utils/helpers.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;
      await sleep(delay * attempt);
    }
  }
  
  throw lastError!;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundTo = (value: number, decimals: number): number => {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (data: string, filename: string, type: string = 'text/plain'): void => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// src/utils/encryption.ts
class EncryptionService {
  private async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const key = await this.deriveKey(password, salt);
      const encodedData = encoder.encode(data);
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedData
      );
      
      const encryptedArray = new Uint8Array(encrypted);
      const resultArray = new Uint8Array(salt.length + iv.length + encryptedArray.length);
      resultArray.set(salt, 0);
      resultArray.set(iv, salt.length);
      resultArray.set(encryptedArray, salt.length + iv.length);
      
      return btoa(String.fromCharCode(...resultArray));
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const dataArray = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const salt = dataArray.slice(0, 16);
      const iv = dataArray.slice(16, 28);
      const encrypted = dataArray.slice(28);
      
      const key = await this.deriveKey(password, salt);
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const encryptionService = new EncryptionService();

// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100)));
    } catch (error) {
      // Ignore storage errors
    }
  }

  debug(message: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
    
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: any): void {
    const entry = this.createLogEntry('error', message, error);
    this.addLog(entry);
    
    console.error(`[ERROR] ${message}`, error);
    
    // Send to error reporting service in production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.reportError(entry);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private async reportError(entry: LogEntry): Promise<void> {
    try {
      // Replace with your error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail if error reporting fails
    }
  }

  // Load persisted logs
  loadPersistedLogs(): void {
    try {
      const savedLogs = localStorage.getItem('app_logs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs) as LogEntry[];
        this.logs = parsedLogs;
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }
}

export const logger = new Logger();

// Initialize persisted logs
logger.loadPersistedLogs();

// src/services/analytics.ts
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadUserId(): void {
    this.userId = localStorage.getItem('analytics_user_id');
  }

  setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('analytics_user_id', userId);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  // Common tracking methods
  trackPageView(page: string, title?: string): void {
    this.track('page_view', {
      page,
      title: title || document.title,
      url: window.location.href,
      referrer: document.referrer,
    });
  }

  trackClick(element: string, location?: string): void {
    this.track('click', {
      element,
      location,
      url: window.location.pathname,
    });
  }

  trackError(error: Error, context?: string): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.pathname,
    });
  }

  trackTiming(category: string, variable: string, time: number): void {
    this.track('timing', {
      category,
      variable,
      time,
      url: window.location.pathname,
    });
  }

  trackSearch(query: string, results?: number): void {
    this.track('search', {
      query,
      results,
      url: window.location.pathname,
    });
  }

  // Tourist Safety specific events
  trackEmergencyAlert(type: 'SOS' | 'PANIC', location?: { lat: number; lng: number }): void {
    this.track('emergency_alert', {
      type,
      location,
      timestamp: new Date().toISOString(),
    });
  }

  trackLocationUpdate(accuracy: number): void {
    this.track('location_update', {
      accuracy,
      timestamp: new Date().toISOString(),
    });
  }

  trackDevicePairing(deviceType: string, success: boolean): void {
    this.track('device_pairing', {
      deviceType,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to analytics service
      if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
        await fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Analytics event tracked', event);
      }
    } catch (error) {
      logger.error('Failed to send analytics event', error);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analyticsService = new AnalyticsService();

// src/services/notification.ts
interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkPermission();
    this.initializeServiceWorker();
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.getRegistration();
      } catch (error) {
        logger.error('Failed to get service worker registration', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      logger.warn('Notification permission not granted');
      return null;
    }

    try {
      // Use service worker for better notification handling
      if (this.registration) {
        await this.registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/logo192.png',
          badge: options.badge || '/logo192.png',
          image: options.image,
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          vibrate: options.vibrate || [200, 100, 200],
          actions: options.actions || [],
        });
        return null; // Service worker notifications don't return a Notification object
      } else {
        // Fallback to regular notifications
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logo192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
        });

        if (options.vibrate && navigator.vibrate) {
          navigator.vibrate(options.vibrate);
        }

        return notification;
      }
    } catch (error) {
      logger.error('Failed to show notification', error);
      return null;
    }
  }

  // Convenience methods for different types of notifications
  async showEmergencyAlert(message: string, location?: string): Promise<void> {
    await this.showNotification({
      title: '🚨 Emergency Alert',
      body: message + (location ? ` at ${location}` : ''),
      tag: 'emergency',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      data: { type: 'emergency', message, location },
    });
  }

  async showLocationAlert(message: string): Promise<void> {
    await this.showNotification({
      title: '📍 Location Alert',
      body: message,
      tag: 'location',
      vibrate: [200, 100, 200],
      data: { type: 'location', message },
    });
  }

  async showDeviceAlert(message: string, deviceType: string): Promise<void> {
    await this.showNotification({
      title: '📱 Device Alert',
      body: message,
      tag: 'device',
      data: { type: 'device', message, deviceType },
    });
  }

  async showSystemNotification(title: string, message: string): Promise<void> {
    await this.showNotification({
      title,
      body: message,
      tag: 'system',
      data: { type: 'system', message },
    });
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  async scheduleNotification(options: NotificationOptions, delay: number): Promise<void> {
    setTimeout(async () => {
      await this.showNotification(options);
    }, delay);
  }
}

export const notificationService = new NotificationService();

// src/__tests__/setupTests.ts
import '@testing-library/jest-dom';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock Notification API
global.Notification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  close: jest.fn(),
})) as any;

Object.defineProperty(global.Notification, 'permission', {
  value: 'granted',
  writable: true,
});

Object.defineProperty(global.Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  writable: true,
});

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
})) as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      generateKey: jest.fn(),
      importKey: jest.fn(),
      deriveKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      digest: jest.fn(),
    },
  },
});

// Set up environment variables for tests
process.env.REACT_APP_API_URL = 'http://localhost:5000';
process.env.REACT_APP_WS_URL = 'ws://localhost:5000';
process.env.REACT_APP_ENVIRONMENT = 'test';

// Global test utilities
global.testUtils = {
  mockUser: {
    id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    emergencyContact: '+1234567891',
    nationality: 'US',
    passportNumber: 'TEST123456',
    role: 'TOURIST' as const,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  mockLocation: {
    id: 'test-location-1',
    touristId: 'test-user-1',
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 10,
    timestamp: '2024-01-01T12:00:00Z',
  },
  mockAlert: {
    id: 'test-alert-1',
    touristId: 'test-user-1',
    type: 'SOS' as const,
    status: 'ACTIVE' as const,
    priority: 'CRITICAL' as const,
    message: 'Emergency assistance needed',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
    },
    createdAt: '2024-01-01T12:00:00Z',
  },
};