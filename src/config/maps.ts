// Google Maps Configuration
// API key is loaded from environment variables

export const GOOGLE_MAPS_CONFIG = {
  // Use environment variable for API key
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  
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
  ],

  // Map options for better performance and appearance
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    clickableIcons: true,
    mapTypeId: 'roadmap'
  }
};

// Validation function to check if API key is set
export const validateAPIKey = (): boolean => {
  const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ Google Maps API key is not properly configured!');
    return false;
  }
  console.log('✅ Google Maps API key is configured:', apiKey?.substring(0, 10) + '...');
  console.log('🔍 Testing API key validity...');
  
  // Test the API key by making a simple request
  testAPIKey(apiKey);
  
  return true;
};

// Test function to validate API key
const testAPIKey = async (apiKey: string) => {
  try {
    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__dummy__`;
    console.log('🌍 Testing Google Maps API access...');
    
    // Create a test script to check if API loads
    const script = document.createElement('script');
    script.src = testUrl;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps API script loaded successfully');
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API script:', error);
      console.error('💡 Possible issues:');
      console.error('   - Invalid API key');
      console.error('   - APIs not enabled (Maps JavaScript API, Places API)');
      console.error('   - Billing not set up in Google Cloud Console');
      console.error('   - Domain restrictions blocking localhost');
    };
    
  } catch (error) {
    console.error('❌ Error testing API key:', error);
  }
};

// Instructions for getting a Google Maps API Key:
// 1. Go to Google Cloud Console (https://console.cloud.google.com/)
// 2. Create a new project or select existing one
// 3. Enable the "Maps JavaScript API" and "Places API (New)"
// 4. Create credentials (API Key)
// 5. Restrict the API key to your domain for security
// 6. Replace the placeholder key above with your actual key

export default GOOGLE_MAPS_CONFIG;
