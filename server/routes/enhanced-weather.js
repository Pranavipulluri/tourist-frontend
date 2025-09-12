const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tourist_safety'
});

// Real-time weather endpoint with comprehensive data
router.get('/current/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    console.log(`🌤️ Getting real-time weather for ${latitude}, ${longitude}`);
    
    if (!process.env.OPENWEATHER_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenWeather API key not configured',
        mock: true,
        data: getMockWeatherData(latitude, longitude)
      });
    }
    
    // Get current weather from OpenWeather API
    const currentWeather = await getCurrentWeather(latitude, longitude);
    
    // Get weather forecast
    const forecast = await getWeatherForecast(latitude, longitude);
    
    // Get air quality data
    const airQuality = await getAirQuality(latitude, longitude);
    
    // Get weather alerts
    const alerts = await getWeatherAlerts(latitude, longitude);
    
    // Calculate comprehensive risk assessment
    const riskAssessment = calculateWeatherRisk(currentWeather, forecast, airQuality, alerts);
    
    // Store weather data in database for historical tracking
    await storeWeatherData(latitude, longitude, currentWeather, riskAssessment);
    
    res.json({
      current: currentWeather,
      forecast: forecast,
      airQuality: airQuality,
      alerts: alerts,
      riskAssessment: riskAssessment,
      recommendations: generateWeatherRecommendations(currentWeather, forecast, alerts),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Real weather API error:', error);
    res.status(500).json({ 
      error: error.message,
      mock: true,
      data: getMockWeatherData(parseFloat(req.params.lat), parseFloat(req.params.lng))
    });
  }
});

// Weather forecast endpoint
router.get('/forecast/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { days = 5 } = req.query;
    
    console.log(`📅 Getting ${days}-day weather forecast for ${lat}, ${lng}`);
    
    if (!process.env.OPENWEATHER_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenWeather API key not configured',
        mock: true,
        data: getMockForecastData(parseFloat(lat), parseFloat(lng), parseInt(days))
      });
    }
    
    const forecast = await getDetailedForecast(parseFloat(lat), parseFloat(lng), parseInt(days));
    
    res.json({
      forecast: forecast,
      travelSafety: assessTravelSafety(forecast),
      recommendations: generateForecastRecommendations(forecast)
    });
    
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Weather alerts endpoint
router.get('/alerts/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    
    console.log(`⚠️ Getting weather alerts for ${lat}, ${lng}`);
    
    const alerts = await getWeatherAlerts(parseFloat(lat), parseFloat(lng));
    
    res.json({
      alerts: alerts,
      severity: getHighestSeverity(alerts),
      activeCount: alerts.filter(a => a.active).length
    });
    
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Air quality endpoint
router.get('/air-quality/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    
    console.log(`🌫️ Getting air quality for ${lat}, ${lng}`);
    
    const airQuality = await getAirQuality(parseFloat(lat), parseFloat(lng));
    
    res.json({
      airQuality: airQuality,
      healthRecommendations: generateAirQualityRecommendations(airQuality)
    });
    
  } catch (error) {
    console.error('Air quality error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Historical weather data endpoint
router.get('/history/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { start, end } = req.query;
    
    console.log(`📊 Getting historical weather for ${lat}, ${lng}`);
    
    const historicalData = await getHistoricalWeather(
      parseFloat(lat), 
      parseFloat(lng), 
      start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end || new Date().toISOString()
    );
    
    res.json({
      historical: historicalData,
      trends: analyzeWeatherTrends(historicalData),
      patterns: identifyWeatherPatterns(historicalData)
    });
    
  } catch (error) {
    console.error('Historical weather error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==== REAL API INTEGRATION FUNCTIONS ====

// Get current weather from OpenWeather API
async function getCurrentWeather(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    const data = response.data;
    
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed || 0,
      windDirection: data.wind?.deg || 0,
      windGust: data.wind?.gust || 0,
      visibility: (data.visibility || 10000) / 1000, // Convert to km
      cloudiness: data.clouds?.all || 0,
      uvIndex: await getUVIndex(latitude, longitude),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      timezone: data.timezone,
      location: {
        city: data.name,
        country: data.sys.country,
        coordinates: [latitude, longitude]
      }
    };
    
  } catch (error) {
    console.error('OpenWeather current API error:', error);
    throw error;
  }
}

// Get weather forecast from OpenWeather API
async function getWeatherForecast(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    const data = response.data;
    
    return data.list.slice(0, 8).map(item => ({
      datetime: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: item.wind?.speed || 0,
      windDirection: item.wind?.deg || 0,
      cloudiness: item.clouds?.all || 0,
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
      precipitationProbability: item.pop * 100
    }));
    
  } catch (error) {
    console.error('OpenWeather forecast API error:', error);
    return [];
  }
}

// Get detailed forecast for multiple days
async function getDetailedForecast(latitude, longitude, days) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&cnt=${days * 8}`
    );
    
    const data = response.data;
    
    // Group by day
    const dailyForecast = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date: date,
          entries: [],
          minTemp: item.main.temp,
          maxTemp: item.main.temp,
          conditions: []
        };
      }
      
      dailyForecast[date].entries.push({
        time: new Date(item.dt * 1000).getHours(),
        temperature: item.main.temp,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        windSpeed: item.wind?.speed || 0,
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
        precipitationProbability: item.pop * 100
      });
      
      dailyForecast[date].minTemp = Math.min(dailyForecast[date].minTemp, item.main.temp);
      dailyForecast[date].maxTemp = Math.max(dailyForecast[date].maxTemp, item.main.temp);
      dailyForecast[date].conditions.push(item.weather[0].main);
    });
    
    return Object.values(dailyForecast).map(day => ({
      ...day,
      dominantCondition: getMostFrequent(day.conditions),
      avgWindSpeed: day.entries.reduce((sum, e) => sum + e.windSpeed, 0) / day.entries.length,
      totalPrecipitation: day.entries.reduce((sum, e) => sum + e.precipitation, 0),
      maxPrecipitationProb: Math.max(...day.entries.map(e => e.precipitationProbability))
    }));
    
  } catch (error) {
    console.error('Detailed forecast API error:', error);
    return [];
  }
}

// Get air quality data
async function getAirQuality(latitude, longitude) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      return getMockAirQuality();
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    const data = response.data.list[0];
    
    const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    
    return {
      aqi: data.main.aqi,
      aqiLevel: aqiLevels[data.main.aqi - 1] || 'Unknown',
      components: {
        co: data.components.co,      // Carbon monoxide (μg/m³)
        no: data.components.no,      // Nitric oxide (μg/m³)
        no2: data.components.no2,    // Nitrogen dioxide (μg/m³)
        o3: data.components.o3,      // Ozone (μg/m³)
        so2: data.components.so2,    // Sulphur dioxide (μg/m³)
        pm2_5: data.components.pm2_5, // PM2.5 (μg/m³)
        pm10: data.components.pm10,   // PM10 (μg/m³)
        nh3: data.components.nh3      // Ammonia (μg/m³)
      },
      healthRisk: calculateHealthRisk(data.main.aqi, data.components),
      recommendations: getAirQualityRecommendations(data.main.aqi)
    };
    
  } catch (error) {
    console.error('Air quality API error:', error);
    return getMockAirQuality();
  }
}

// Get weather alerts
async function getWeatherAlerts(latitude, longitude) {
  try {
    // OpenWeather One Call API for alerts (requires subscription)
    if (!process.env.OPENWEATHER_API_KEY) {
      return [];
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&exclude=minutely,daily`
    );
    
    const alerts = response.data.alerts || [];
    
    return alerts.map(alert => ({
      event: alert.event,
      start: new Date(alert.start * 1000).toISOString(),
      end: new Date(alert.end * 1000).toISOString(),
      severity: alert.tags?.[0] || 'Unknown',
      description: alert.description,
      senderName: alert.sender_name,
      active: alert.end * 1000 > Date.now()
    }));
    
  } catch (error) {
    console.error('Weather alerts API error:', error);
    // Check local alert database as fallback
    return getLocalWeatherAlerts(latitude, longitude);
  }
}

// Get UV Index
async function getUVIndex(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    return {
      index: response.data.value,
      level: getUVLevel(response.data.value),
      recommendations: getUVRecommendations(response.data.value)
    };
    
  } catch (error) {
    console.error('UV Index API error:', error);
    return {
      index: 5,
      level: 'Moderate',
      recommendations: ['Use sunscreen if outdoors for extended periods']
    };
  }
}

// Store weather data in database
async function storeWeatherData(latitude, longitude, weatherData, riskAssessment) {
  try {
    const query = `
      INSERT INTO weather_history (
        latitude, longitude, temperature, condition, humidity, wind_speed, 
        visibility, pressure, risk_score, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `;
    
    await pool.query(query, [
      latitude, longitude, weatherData.temperature, weatherData.condition,
      weatherData.humidity, weatherData.windSpeed, weatherData.visibility,
      weatherData.pressure, riskAssessment.overallRisk
    ]);
    
  } catch (error) {
    console.error('Weather data storage error:', error);
  }
}

// Calculate comprehensive weather risk
function calculateWeatherRisk(current, forecast, airQuality, alerts) {
  let riskScore = 0;
  const factors = [];
  
  // Temperature risk
  if (current.temperature < 0 || current.temperature > 40) {
    riskScore += 30;
    factors.push('Extreme temperature');
  } else if (current.temperature < 5 || current.temperature > 35) {
    riskScore += 15;
    factors.push('High/Low temperature');
  }
  
  // Severe weather conditions
  const severeConditions = ['Thunderstorm', 'Snow', 'Tornado', 'Hurricane', 'Hail'];
  if (severeConditions.includes(current.condition)) {
    riskScore += 40;
    factors.push(`Severe weather: ${current.condition}`);
  }
  
  // Wind risk
  if (current.windSpeed > 15) {
    riskScore += 25;
    factors.push('High wind speed');
  } else if (current.windSpeed > 10) {
    riskScore += 10;
    factors.push('Moderate wind');
  }
  
  // Visibility risk
  if (current.visibility < 1) {
    riskScore += 30;
    factors.push('Very poor visibility');
  } else if (current.visibility < 5) {
    riskScore += 15;
    factors.push('Poor visibility');
  }
  
  // Air quality risk
  if (airQuality && airQuality.aqi > 3) {
    riskScore += 20;
    factors.push('Poor air quality');
  }
  
  // Weather alerts
  if (alerts && alerts.length > 0) {
    riskScore += 25;
    factors.push('Active weather alerts');
  }
  
  // UV risk
  if (current.uvIndex && current.uvIndex.index > 8) {
    riskScore += 10;
    factors.push('Very high UV index');
  }
  
  return {
    overallRisk: Math.min(100, riskScore),
    riskLevel: getRiskLevel(riskScore),
    factors: factors,
    safeForTravel: riskScore < 30,
    recommendations: generateRiskRecommendations(riskScore, factors)
  };
}

// ==== HELPER FUNCTIONS ====

function getMockWeatherData(latitude, longitude) {
  return {
    temperature: 25,
    feelsLike: 27,
    condition: 'Clear',
    description: 'Clear sky',
    humidity: 60,
    pressure: 1013,
    windSpeed: 5,
    windDirection: 180,
    visibility: 10,
    cloudiness: 10,
    uvIndex: { index: 5, level: 'Moderate' },
    location: {
      coordinates: [latitude, longitude]
    }
  };
}

function getMockAirQuality() {
  return {
    aqi: 2,
    aqiLevel: 'Fair',
    components: {
      pm2_5: 15,
      pm10: 25,
      o3: 80,
      no2: 25,
      so2: 10,
      co: 0.3
    },
    healthRisk: 'Low',
    recommendations: ['Air quality is acceptable for most people']
  };
}

function getRiskLevel(score) {
  if (score < 20) return 'LOW';
  if (score < 40) return 'MODERATE';
  if (score < 70) return 'HIGH';
  return 'EXTREME';
}

function getUVLevel(index) {
  if (index < 3) return 'Low';
  if (index < 6) return 'Moderate';
  if (index < 8) return 'High';
  if (index < 11) return 'Very High';
  return 'Extreme';
}

function getMostFrequent(arr) {
  return arr.sort((a,b) =>
    arr.filter(v => v===a).length - arr.filter(v => v===b).length
  ).pop();
}

function generateWeatherRecommendations(current, forecast, alerts) {
  const recommendations = [];
  
  if (current.temperature < 5) {
    recommendations.push('Dress warmly and protect against hypothermia');
  }
  
  if (current.temperature > 35) {
    recommendations.push('Stay hydrated and avoid prolonged sun exposure');
  }
  
  if (current.windSpeed > 10) {
    recommendations.push('Be cautious of strong winds, secure loose objects');
  }
  
  if (current.visibility < 5) {
    recommendations.push('Exercise caution when driving or walking');
  }
  
  if (alerts && alerts.length > 0) {
    recommendations.push('Check weather alerts and avoid affected areas');
  }
  
  return recommendations;
}

function generateRiskRecommendations(score, factors) {
  const recommendations = [];
  
  if (score > 50) {
    recommendations.push('Consider postponing outdoor activities');
    recommendations.push('If you must go out, take extra precautions');
  } else if (score > 30) {
    recommendations.push('Monitor weather conditions closely');
    recommendations.push('Prepare for changing conditions');
  }
  
  factors.forEach(factor => {
    if (factor.includes('temperature')) {
      recommendations.push('Dress appropriately for temperature conditions');
    }
    if (factor.includes('wind')) {
      recommendations.push('Be aware of wind-related hazards');
    }
    if (factor.includes('visibility')) {
      recommendations.push('Use extra caution when traveling');
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
}

module.exports = router;