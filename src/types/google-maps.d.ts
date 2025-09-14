// Google Maps TypeScript declarations
/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google & {
      maps: typeof google.maps & {
        marker?: {
          AdvancedMarkerElement: new (options: {
            position: google.maps.LatLng | google.maps.LatLngLiteral;
            map: google.maps.Map;
            title?: string;
            content?: HTMLElement;
          }) => {
            addListener: (event: string, handler: () => void) => void;
          };
        };
      };
    };
  }
  
  namespace google.maps.places {
    interface PlaceOpeningHours {
      isOpen(): boolean;
    }
  }
}

export { };

