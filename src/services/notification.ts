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
