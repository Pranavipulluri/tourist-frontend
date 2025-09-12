// Navigation Service for Tourist Safety Platform
// Provides route calculation, directions, and navigation features

import '../types/google-maps';

export interface NavigationOptions {
  mode?: 'driving' | 'walking' | 'transit';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  location: { lat: number; lng: number };
}

export interface NavigationResult {
  distance: string;
  duration: string;
  steps: RouteStep[];
}

export class NavigationService {
  private static directionsService: google.maps.DirectionsService | null = null;
  private static directionsRenderer: google.maps.DirectionsRenderer | null = null;

  static initializeDirections() {
    if (window.google && window.google.maps) {
      this.directionsService = new window.google.maps.DirectionsService();
      this.directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
    }
  }

  static async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: NavigationOptions = {}
  ): Promise<NavigationResult> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        this.initializeDirections();
      }

      if (!this.directionsService || !window.google) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      this.directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: this.getTravelMode(options.mode || 'driving'),
          avoidTolls: options.avoidTolls || false,
          avoidHighways: options.avoidHighways || false,
          unitSystem: window.google.maps.UnitSystem.METRIC
        },
        (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const leg = route.legs[0];
            
            const steps: RouteStep[] = leg.steps.map((step: google.maps.DirectionsStep) => ({
              instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
              distance: step.distance?.text || '',
              duration: step.duration?.text || '',
              location: {
                lat: step.start_location.lat(),
                lng: step.start_location.lng()
              }
            }));

            resolve({
              distance: leg.distance?.text || '',
              duration: leg.duration?.text || '',
              steps
            });
          } else {
            reject(new Error(`Route calculation failed: ${status}`));
          }
        }
      );
    });
  }

  static displayRouteOnMap(
    map: google.maps.Map,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: NavigationOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.directionsService || !this.directionsRenderer) {
        this.initializeDirections();
      }

      if (!this.directionsService || !this.directionsRenderer || !window.google) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      this.directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: this.getTravelMode(options.mode || 'driving'),
          avoidTolls: options.avoidTolls || false,
          avoidHighways: options.avoidHighways || false
        },
        (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            this.directionsRenderer!.setMap(map);
            this.directionsRenderer!.setDirections(result);
            resolve();
          } else {
            reject(new Error(`Route display failed: ${status}`));
          }
        }
      );
    });
  }

  static clearRoute() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }
  }

  private static getTravelMode(mode: string): google.maps.TravelMode {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }
    
    switch (mode) {
      case 'walking':
        return window.google.maps.TravelMode.WALKING;
      case 'transit':
        return window.google.maps.TravelMode.TRANSIT;
      case 'driving':
      default:
        return window.google.maps.TravelMode.DRIVING;
    }
  }

  // Get navigation instructions as text
  static getNavigationInstructions(steps: RouteStep[]): string[] {
    return steps.map(step => step.instruction);
  }

  // Calculate estimated time based on mode
  static getEstimatedTime(distance: number, mode: string = 'driving'): string {
    const avgSpeeds = {
      driving: 40, // km/h in city
      walking: 5,  // km/h
      transit: 25  // km/h average
    };

    const speed = avgSpeeds[mode as keyof typeof avgSpeeds] || avgSpeeds.driving;
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  // Open external navigation app (Google Maps, Apple Maps, etc.)
  static openExternalNavigation(
    destination: { lat: number; lng: number; name?: string },
    mode: string = 'driving'
  ): void {
    const { lat, lng, name } = destination;
    
    // Create Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;
    
    // Try to detect platform and use appropriate app
    const userAgent = navigator.userAgent.toLowerCase();
    let navigationUrl = googleMapsUrl;

    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iOS - try Apple Maps first, fallback to Google Maps
      const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=${mode === 'walking' ? 'w' : 'd'}`;
      navigationUrl = appleMapsUrl;
    } else if (userAgent.includes('android')) {
      // Android - use Google Maps intent
      navigationUrl = `google.navigation:q=${lat},${lng}&mode=${mode}`;
    }

    // Add location name if provided
    if (name) {
      navigationUrl = navigationUrl.replace(`${lat},${lng}`, `${encodeURIComponent(name)}`);
    }

    try {
      // Try to open in app first
      window.open(navigationUrl, '_blank');
      
      // Fallback to Google Maps web if app doesn't open
      setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 2000);
    } catch (error) {
      console.error('Failed to open navigation app:', error);
      // Final fallback
      window.open(googleMapsUrl, '_blank');
    }
  }
}