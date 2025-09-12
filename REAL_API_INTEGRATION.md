# Backend API Configuration for Real Data Integration

## Environment Variables Setup

Create a `.env` file in your backend directory with real API keys:

```env
# Google Maps API (for geocoding and places)
GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A

# OpenWeather API (for weather data)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tourist_safety

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Real API Integration Examples

### 1. Location Services with Google Maps API

```javascript
// Get place details and safety information
async function getLocationSafety(latitude, longitude) {
  const googleMapsResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1000&type=police&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  
  const places = await googleMapsResponse.json();
  
  // Calculate safety score based on nearby facilities
  const safetyScore = calculateSafetyScore(places.results);
  
  return {
    latitude,
    longitude,
    safetyScore,
    nearbyPolice: places.results.filter(p => p.types.includes('police')),
    nearbyHospitals: places.results.filter(p => p.types.includes('hospital'))
  };
}
```

### 2. Weather Integration with OpenWeather API

```javascript
// Get real weather data
async function getWeatherData(latitude, longitude) {
  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
  );
  
  const weather = await weatherResponse.json();
  
  return {
    temperature: weather.main.temp,
    condition: weather.weather[0].main,
    description: weather.weather[0].description,
    humidity: weather.main.humidity,
    windSpeed: weather.wind.speed,
    visibility: weather.visibility / 1000, // Convert to km
    pressure: weather.main.pressure,
    cloudiness: weather.clouds.all
  };
}
```

### 3. Crime Data Integration (Example with mock API)

```javascript
// Integrate with crime data APIs
async function getCrimeData(latitude, longitude) {
  // Example with UK Police API (replace with local crime data source)
  const crimeResponse = await fetch(
    `https://data.police.uk/api/crimes-at-location?date=2023-01&lat=${latitude}&lng=${longitude}`
  );
  
  const crimes = await crimeResponse.json();
  
  return {
    recentCrimes: crimes.length,
    crimeTypes: crimes.map(c => c.category),
    riskLevel: crimes.length > 5 ? 'HIGH' : crimes.length > 2 ? 'MEDIUM' : 'LOW'
  };
}
```

## API Keys You Need to Obtain

### 1. Google Maps API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create new project or select existing
- Enable APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Roads API
- Create credentials → API Key
- Restrict API key to your domain

### 2. OpenWeather API Key
- Go to [OpenWeatherMap](https://openweathermap.org/api)
- Sign up for free account
- Get API key from dashboard
- Free tier: 1000 calls/day

### 3. Twilio Account (for SMS)
- Go to [Twilio Console](https://console.twilio.com/)
- Sign up and verify phone number
- Get Account SID and Auth Token
- Buy phone number for SMS sending

### 4. Email SMTP Setup
- Gmail: Enable 2FA and create App Password
- Or use services like SendGrid, Mailgun

## Backend Route Implementation

Here's how your backend routes should look with real API integration:

```javascript
// routes/location.js
const express = require('express');
const router = express.Router();

// Real location update with external API calls
router.post('/update', async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.id;
    
    // Save location to database
    const location = await db.locations.create({
      userId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date()
    });
    
    // Get real weather data
    const weather = await getWeatherData(latitude, longitude);
    
    // Get safety information
    const safety = await getLocationSafety(latitude, longitude);
    
    // Get address from Google Geocoding
    const address = await reverseGeocode(latitude, longitude);
    
    res.json({
      location: {
        ...location,
        address,
        weather,
        safety
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real weather endpoint
router.get('/weather/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const weather = await getWeatherData(parseFloat(lat), parseFloat(lng));
    res.json({ weather });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Firebase Cloud Functions with Real APIs

If using Firebase, here's how to integrate real APIs:

```javascript
// firebase-functions/src/index.ts
const functions = require('firebase-functions');
const axios = require('axios');

exports.getLocationData = functions.https.onCall(async (data, context) => {
  const { latitude, longitude } = data;
  
  try {
    // Real weather data
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${functions.config().openweather.api_key}&units=metric`
    );
    
    // Real places data
    const placesResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1000&type=hospital|police&key=${functions.config().google.maps_key}`
    );
    
    return {
      weather: weatherResponse.data,
      places: placesResponse.data.results,
      safetyScore: calculateSafetyScore(placesResponse.data.results)
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

## How to Set Up Real API Integration

### Step 1: Get API Keys
```bash
# Sign up for services and get API keys:
# - Google Cloud Console (Maps, Places, Geocoding)
# - OpenWeatherMap (Weather data)
# - Twilio (SMS alerts)
```

### Step 2: Configure Environment
```bash
# Create .env file with real API keys
cp .env.example .env
# Edit .env with your actual API keys
```

### Step 3: Update Firebase Functions Config
```bash
firebase functions:config:set openweather.api_key="your_key"
firebase functions:config:set google.maps_key="your_key"
firebase functions:config:set twilio.account_sid="your_sid"
firebase functions:config:set twilio.auth_token="your_token"
```

### Step 4: Deploy Updated Functions
```bash
firebase deploy --only functions
```

## Testing Real API Integration

```javascript
// Test script to verify API integration
const testAPIs = async () => {
  const lat = 28.6139; // Delhi
  const lng = 77.2090;
  
  // Test weather API
  const weather = await getWeatherData(lat, lng);
  console.log('Weather:', weather);
  
  // Test places API
  const places = await getLocationSafety(lat, lng);
  console.log('Places:', places);
  
  // Test SMS API
  const sms = await sendSMS('+1234567890', 'Test emergency alert');
  console.log('SMS:', sms);
};
```

This setup will give you real, live data instead of mock responses, making your tourist safety system production-ready with actual weather conditions, location details, and emergency services.