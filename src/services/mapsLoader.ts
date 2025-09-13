import { Loader } from '@googlemaps/js-api-loader';
import GOOGLE_MAPS_CONFIG from '../config/maps';

// Singleton Google Maps Loader to prevent multiple initializations
class MapsLoaderService {
  private static instance: MapsLoaderService;
  private loader: Loader | null = null;
  private loadPromise: Promise<typeof google> | null = null;
  private isLoaded = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): MapsLoaderService {
    if (!MapsLoaderService.instance) {
      MapsLoaderService.instance = new MapsLoaderService();
    }
    return MapsLoaderService.instance;
  }

  public async loadGoogleMaps(): Promise<typeof google> {
    // If already loaded, return google object
    if (this.isLoaded && window.google) {
      return Promise.resolve(window.google);
    }

    // If loading is in progress, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create new loader only once
    if (!this.loader) {
      console.log('🗺️ Initializing Google Maps API with key:', GOOGLE_MAPS_CONFIG.apiKey?.substring(0, 10) + '...');
      
      this.loader = new Loader({
        apiKey: GOOGLE_MAPS_CONFIG.apiKey,
        version: 'weekly',
        libraries: ['geometry', 'places'],
        // Use a specific ID to prevent conflicts
        id: '__googleMapsScriptId'
      });
    }

    // Start loading
    this.loadPromise = this.loader.load().then((google) => {
      console.log('✅ Google Maps API loaded successfully');
      this.isLoaded = true;
      return google;
    }).catch((error) => {
      console.error('❌ Failed to load Google Maps API:', error);
      // Reset loader on error to allow retry
      this.loader = null;
      this.loadPromise = null;
      throw error;
    });

    return this.loadPromise;
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google;
  }

  public getGoogleMaps(): typeof google | null {
    return this.isGoogleMapsLoaded() ? window.google : null;
  }

  // Reset the loader (useful for testing or reinitialization)
  public reset(): void {
    this.loader = null;
    this.loadPromise = null;
    this.isLoaded = false;
  }
}

// Export singleton instance
export const mapsLoader = MapsLoaderService.getInstance();
export default mapsLoader;