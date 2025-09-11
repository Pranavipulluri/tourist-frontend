import { logger } from '../utils/logger';

export interface AnalyticsEvent {
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

