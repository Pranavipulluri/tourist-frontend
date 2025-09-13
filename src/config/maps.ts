// Google Maps Configuration
// API key is loaded from environment variables

export const GOOGLE_MAPS_CONFIG = {
  // Use environment variable for API key
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDn5H4CtugS827eG6bCYwIhdY2pRQ5rMWA',
  
  // Map default settings
  defaultZoom: 15,
  defaultCenter: {
    lat: 28.6139,  // Delhi coordinates as fallback
    lng: 77.2090
  },
  
  // Map styling options
  mapStyles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'simplified' }]
    }
  ]
};

// Instructions for getting a Google Maps API Key:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable the "Maps JavaScript API" and "Directions API"
// 4. Create credentials (API Key)
// 5. Restrict the API key to your domain for security
// 6. Replace the placeholder key above with your actual key

export default GOOGLE_MAPS_CONFIG;