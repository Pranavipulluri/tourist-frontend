// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

export interface GoogleMapsLoaderOptions {
  apiKey: string;
  version?: string;
  libraries?: string[];
  language?: string;
  region?: string;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type?: 'safe' | 'caution' | 'danger' | 'police' | 'hospital';
  description?: string;
  distance?: string;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
}

export interface NavigationOptions {
  mode?: 'driving' | 'walking' | 'transit';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

// Google Maps API Loader class
export class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async load(options: GoogleMapsLoaderOptions): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.loadGoogleMapsScript(options);
    
    try {
      await this.loadPromise;
      this.isLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  private loadGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: options.apiKey,
        callback: 'initMap'
      });

      if (options.libraries && options.libraries.length > 0) {
        params.append('libraries', options.libraries.join(','));
      }
      if (options.language) {
        params.append('language', options.language);
      }
      if (options.region) {
        params.append('region', options.region);
      }

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;

      window.initMap = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  isGoogleMapsLoaded(): boolean {
    return !!(this.isLoaded && window.google && window.google.maps);
  }
}

export default GoogleMapsLoader;