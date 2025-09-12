const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tourist_safety'
});

// Enhanced location update with real API integration
router.post('/update', async (req, res) => {
  try {
    const { latitude, longitude, accuracy, altitude, speed, heading } = req.body;
    const userId = req.user.id;
    
    console.log(`📍 Real location update for user ${userId}:`, { latitude, longitude });
    
    // Save location to database with PostGIS
    const locationQuery = `
      INSERT INTO locations (user_id, latitude, longitude, accuracy, altitude, speed, heading, geom, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())
      RETURNING *
    `;
    
    const locationResult = await pool.query(locationQuery, [
      userId, latitude, longitude, accuracy, altitude, speed, heading
    ]);
    
    const location = locationResult.rows[0];
    
    // Get real weather data from OpenWeather API
    const weather = await getRealWeatherData(latitude, longitude);
    
    // Get real safety information from Google Places API
    const safety = await getRealSafetyData(latitude, longitude);
    
    // Get real address from Google Geocoding API
    const address = await getRealAddress(latitude, longitude);
    
    // Check geofencing with real zones
    await checkRealGeofencing(userId, latitude, longitude);
    
    // Calculate enhanced safety score
    const safetyScore = await calculateRealSafetyScore(latitude, longitude, weather, safety);
    
    res.json({
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
        address,
        weather,
        safety,
        safetyScore
      }
    });
    
  } catch (error) {
    console.error('Real location update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real weather data endpoint
router.get('/weather/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    
    console.log(`🌤️ Getting real weather for ${lat}, ${lng}`);
    
    const weather = await getRealWeatherData(parseFloat(lat), parseFloat(lng));
    res.json({ weather });
    
  } catch (error) {
    console.error('Real weather API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real safety score endpoint
router.get('/safety-score/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    console.log(`🛡️ Calculating real safety score for ${latitude}, ${longitude}`);
    
    // Get real data from multiple sources
    const weather = await getRealWeatherData(latitude, longitude);
    const safety = await getRealSafetyData(latitude, longitude);
    const crime = await getRealCrimeData(latitude, longitude);
    
    const safetyScore = await calculateRealSafetyScore(latitude, longitude, weather, safety, crime);
    
    res.json({
      safetyScore,
      factors: {
        weather: weather.riskFactor || 0,
        crimeRate: crime.riskLevel || 'LOW',
        emergencyServices: safety.emergencyServicesNearby || 0,
        publicTransport: safety.publicTransportAccess || 'GOOD',
        lighting: safety.streetLighting || 'ADEQUATE',
        crowdDensity: safety.crowdDensity || 'MODERATE'
      },
      recommendations: generateSafetyRecommendations(weather, safety, crime)
    });
    
  } catch (error) {
    console.error('Real safety score error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real nearby places endpoint
router.get('/nearby-places/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { type, radius = 1000 } = req.query;
    
    console.log(`🏢 Getting real nearby places for ${lat}, ${lng}`);
    
    const places = await getRealNearbyPlaces(parseFloat(lat), parseFloat(lng), type, radius);
    res.json({ places });
    
  } catch (error) {
    console.error('Real nearby places error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==== REAL API INTEGRATION FUNCTIONS ====

// Real Weather Data from OpenWeather API
async function getRealWeatherData(latitude, longitude) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      console.warn('⚠️ No OpenWeather API key, using mock data');
      return getMockWeatherData(latitude, longitude);
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    const weather = response.data;
    
    // Calculate weather-based risk factor
    const riskFactor = calculateWeatherRisk(weather);
    
    return {
      temperature: weather.main.temp,
      condition: weather.weather[0].main,
      description: weather.weather[0].description,
      humidity: weather.main.humidity,
      windSpeed: weather.wind?.speed || 0,
      visibility: (weather.visibility || 10000) / 1000, // Convert to km
      pressure: weather.main.pressure,
      cloudiness: weather.clouds?.all || 0,
      uvIndex: await getUVIndex(latitude, longitude), // Additional API call
      riskFactor,
      alerts: weather.alerts || []
    };
    
  } catch (error) {
    console.error('OpenWeather API error:', error);
    return getMockWeatherData(latitude, longitude);
  }
}

// Real Safety Data from Google Places API
async function getRealSafetyData(latitude, longitude) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ No Google Maps API key, using mock data');
      return getMockSafetyData(latitude, longitude);
    }
    
    // Get nearby emergency services
    const emergencyServices = await getRealNearbyPlaces(latitude, longitude, 'hospital|police|fire_station', 2000);
    
    // Get nearby amenities
    const amenities = await getRealNearbyPlaces(latitude, longitude, 'atm|bank|pharmacy|gas_station', 1000);
    
    // Get transportation
    const transport = await getRealNearbyPlaces(latitude, longitude, 'bus_station|subway_station|taxi_stand', 500);
    
    return {
      emergencyServicesNearby: emergencyServices.length,
      hospitalDistance: getClosestDistance(emergencyServices, 'hospital'),
      policeDistance: getClosestDistance(emergencyServices, 'police'),
      amenitiesNearby: amenities.length,
      publicTransportAccess: transport.length > 0 ? 'GOOD' : 'LIMITED',
      crowdDensity: calculateCrowdDensity(emergencyServices, amenities, transport),
      streetLighting: estimateStreetLighting(latitude, longitude), // Based on urban density
      safetyRating: calculatePlacesSafetyRating(emergencyServices, amenities, transport)
    };
    
  } catch (error) {
    console.error('Google Places API error:', error);
    return getMockSafetyData(latitude, longitude);
  }
}

// Real Nearby Places from Google Places API
async function getRealNearbyPlaces(latitude, longitude, type, radius) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return [];
    }
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    return response.data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      type: place.types[0],
      rating: place.rating || 0,
      distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng),
      isOpen: place.opening_hours?.open_now,
      vicinity: place.vicinity
    }));
    
  } catch (error) {
    console.error('Google Places API error:', error);
    return [];
  }
}

// Real Address from Google Geocoding API
async function getRealAddress(latitude, longitude) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
  } catch (error) {
    console.error('Google Geocoding API error:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

// Real Crime Data (example with UK Police API - adapt for your country)
async function getRealCrimeData(latitude, longitude) {
  try {
    // Example with UK Police API - replace with your local crime data source
    const response = await axios.get(
      `https://data.police.uk/api/crimes-at-location?date=2023-12&lat=${latitude}&lng=${longitude}`
    );
    
    const crimes = response.data;
    
    return {
      recentCrimes: crimes.length,
      crimeTypes: [...new Set(crimes.map(c => c.category))],
      riskLevel: crimes.length > 5 ? 'HIGH' : crimes.length > 2 ? 'MEDIUM' : 'LOW',
      lastIncident: crimes.length > 0 ? crimes[0].month : null
    };
    
  } catch (error) {
    console.error('Crime data API error:', error);
    // Return estimated data based on location type
    return getMockCrimeData(latitude, longitude);
  }
}

// Enhanced geofencing with real-time zone checks
async function checkRealGeofencing(userId, latitude, longitude) {
  try {
    // Check against real danger zones in database
    const dangerZonesQuery = `
      SELECT id, name, type, radius, ST_Distance(
        geom, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      ) as distance
      FROM safety_zones 
      WHERE type = 'danger' 
      AND ST_DWithin(
        geom, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326), 
        radius / 111320 -- Convert meters to degrees
      )
    `;
    
    const result = await pool.query(dangerZonesQuery, [longitude, latitude]);
    
    if (result.rows.length > 0) {
      for (const zone of result.rows) {
        // Trigger real-time alert
        await triggerRealGeofenceAlert(userId, latitude, longitude, zone);
      }
    }
    
  } catch (error) {
    console.error('Real geofencing check error:', error);
  }
}

// Calculate enhanced safety score with real data
async function calculateRealSafetyScore(latitude, longitude, weather, safety, crime) {
  let score = 10; // Start with perfect score
  
  // Weather factor
  if (weather.riskFactor > 0.7) score -= 2;
  else if (weather.riskFactor > 0.4) score -= 1;
  
  // Crime factor
  if (crime?.riskLevel === 'HIGH') score -= 3;
  else if (crime?.riskLevel === 'MEDIUM') score -= 1.5;
  
  // Emergency services factor
  if (safety.emergencyServicesNearby === 0) score -= 2;
  else if (safety.emergencyServicesNearby < 2) score -= 1;
  
  // Time of day factor
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) score -= 1; // Night time
  
  // Public transport factor
  if (safety.publicTransportAccess === 'LIMITED') score -= 0.5;
  
  return Math.max(0, Math.min(10, score));
}

// ==== HELPER FUNCTIONS ====

function calculateWeatherRisk(weather) {
  let risk = 0;
  
  // Temperature extremes
  if (weather.main.temp < 0 || weather.main.temp > 40) risk += 0.3;
  
  // Severe weather conditions
  const severeConditions = ['Thunderstorm', 'Snow', 'Tornado', 'Hurricane'];
  if (severeConditions.includes(weather.weather[0].main)) risk += 0.5;
  
  // High wind speed
  if (weather.wind?.speed > 10) risk += 0.2;
  
  // Low visibility
  if (weather.visibility < 5000) risk += 0.2;
  
  return Math.min(1, risk);
}

function getMockWeatherData(latitude, longitude) {
  return {
    temperature: 25,
    condition: 'Clear',
    description: 'Clear sky',
    humidity: 60,
    windSpeed: 5,
    visibility: 10,
    pressure: 1013,
    cloudiness: 10,
    riskFactor: 0.1
  };
}

function getMockSafetyData(latitude, longitude) {
  return {
    emergencyServicesNearby: 3,
    hospitalDistance: 0.8,
    policeDistance: 0.5,
    amenitiesNearby: 12,
    publicTransportAccess: 'GOOD',
    crowdDensity: 'MODERATE',
    streetLighting: 'ADEQUATE',
    safetyRating: 7.5
  };
}

function getMockCrimeData(latitude, longitude) {
  return {
    recentCrimes: 2,
    crimeTypes: ['theft', 'vandalism'],
    riskLevel: 'LOW',
    lastIncident: '2023-12'
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function getClosestDistance(places, type) {
  const filtered = places.filter(p => p.type.includes(type));
  return filtered.length > 0 ? Math.min(...filtered.map(p => p.distance)) : null;
}

function calculateCrowdDensity(emergency, amenities, transport) {
  const total = emergency.length + amenities.length + transport.length;
  if (total > 20) return 'HIGH';
  if (total > 10) return 'MODERATE';
  return 'LOW';
}

function estimateStreetLighting(latitude, longitude) {
  // Estimate based on urban density (simplified)
  // In real implementation, you could use satellite data or city APIs
  return 'ADEQUATE';
}

function calculatePlacesSafetyRating(emergency, amenities, transport) {
  let rating = 5;
  rating += emergency.length * 0.5;
  rating += Math.min(amenities.length * 0.1, 2);
  rating += Math.min(transport.length * 0.2, 1);
  return Math.min(10, rating);
}

async function getUVIndex(latitude, longitude) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) return 5;
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    return response.data.value || 5;
  } catch (error) {
    return 5;
  }
}

function generateSafetyRecommendations(weather, safety, crime) {
  const recommendations = [];
  
  if (weather.riskFactor > 0.5) {
    recommendations.push('Check weather conditions before going out');
  }
  
  if (crime?.riskLevel === 'HIGH') {
    recommendations.push('Avoid isolated areas and stay in well-lit public spaces');
  }
  
  if (safety.emergencyServicesNearby < 2) {
    recommendations.push('Keep emergency contact numbers handy');
  }
  
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    recommendations.push('Exercise extra caution during nighttime');
  }
  
  return recommendations;
}

async function triggerRealGeofenceAlert(userId, latitude, longitude, zone) {
  try {
    // Create alert in database
    const alertQuery = `
      INSERT INTO emergency_alerts (user_id, type, severity, message, latitude, longitude, zone_id, created_at)
      VALUES ($1, 'geofence_violation', 'HIGH', $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const message = `User entered danger zone: ${zone.name}`;
    await pool.query(alertQuery, [userId, message, latitude, longitude, zone.id]);
    
    console.log(`🚨 Real geofence alert triggered: User ${userId} entered ${zone.name}`);
    
    // Trigger real-time notifications (SMS, email, push)
    // This would integrate with your notification service
    
  } catch (error) {
    console.error('Real geofence alert error:', error);
  }
}

module.exports = router;