// 🌍 Real API Integration Configuration for Tourist Safety Backend
// This file demonstrates how to integrate real APIs instead of mock data

// 🔑 API Keys Configuration (Environment Variables)
interface APIConfig {
  // Weather APIs
  OPENWEATHER_API_KEY: string;
  ACCUWEATHER_API_KEY: string;
  WEATHERAPI_KEY: string;
  
  // Location & Safety APIs
  GOOGLE_MAPS_API_KEY: string;
  HERE_MAPS_API_KEY: string;
  MAPBOX_ACCESS_TOKEN: string;
  
  // Crime & Safety Data APIs
  NUMBEO_API_KEY: string;
  CRIME_DATA_API_KEY: string;
  GOVERNMENT_ALERTS_API_KEY: string;
  
  // Social Media & News APIs for Real-time Alerts
  TWITTER_BEARER_TOKEN: string;
  REDDIT_API_KEY: string;
  NEWS_API_KEY: string;
  
  // Emergency Services APIs
  EMERGENCY_SERVICES_API_KEY: string;
  LOCAL_POLICE_API_KEY: string;
  
  // Travel Advisory APIs
  STATE_DEPT_API_KEY: string;
  UK_FCO_API_KEY: string;
  CANADIAN_TRAVEL_API_KEY: string;
}

// 🌦️ Real Weather API Integration
export class RealWeatherService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // OpenWeatherMap Integration
  async getCurrentWeather(lat: number, lon: number) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        location: { lat, lon },
        current: {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main.toLowerCase(),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          visibility: data.visibility / 1000, // Convert m to km
          uvIndex: data.uvi || 0,
          safetyRating: this.calculateWeatherSafetyRating(data.weather[0].main, data.wind.speed)
        },
        alerts: this.generateWeatherAlerts(data),
        apiSource: 'OpenWeatherMap',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather API Error:', error);
      return this.getFallbackWeatherData(lat, lon);
    }
  }
  
  // AccuWeather Integration for Enhanced Alerts
  async getWeatherAlerts(lat: number, lon: number) {
    const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${this.apiKey}&q=${lat},${lon}`;
    
    try {
      const locationResponse = await fetch(locationUrl);
      const locationData = await locationResponse.json();
      const locationKey = locationData.Key;
      
      const alertsUrl = `https://dataservice.accuweather.com/alerts/v1/${locationKey}?apikey=${this.apiKey}`;
      const alertsResponse = await fetch(alertsUrl);
      const alertsData = await alertsResponse.json();
      
      return alertsData.map((alert: any) => ({
        type: 'weather_warning',
        severity: alert.Level.toLowerCase(),
        title: alert.Type,
        description: alert.Text,
        startTime: alert.EffectiveDate,
        endTime: alert.EndDate,
        source: 'AccuWeather'
      }));
    } catch (error) {
      console.error('Weather Alerts API Error:', error);
      return [];
    }
  }
  
  private calculateWeatherSafetyRating(condition: string, windSpeed: number): number {
    let baseRating = 8.0;
    
    // Weather condition impacts
    switch (condition.toLowerCase()) {
      case 'thunderstorm':
        baseRating = 2.0;
        break;
      case 'rain':
        baseRating = 5.0;
        break;
      case 'snow':
        baseRating = 4.0;
        break;
      case 'fog':
      case 'mist':
        baseRating = 4.5;
        break;
      case 'clear':
        baseRating = 9.5;
        break;
      case 'clouds':
        baseRating = 8.0;
        break;
    }
    
    // Wind speed impacts
    if (windSpeed > 15) baseRating -= 2.0; // High wind
    if (windSpeed > 25) baseRating -= 3.0; // Very high wind
    
    return Math.max(1.0, Math.min(10.0, baseRating));
  }
  
  private generateWeatherAlerts(weatherData: any): string[] {
    const alerts: string[] = [];
    
    // Temperature alerts
    if (weatherData.main.temp > 40) {
      alerts.push('Extreme heat warning - Stay hydrated and seek shade');
    } else if (weatherData.main.temp < 0) {
      alerts.push('Freezing temperatures - Dress warmly and watch for ice');
    }
    
    // Wind alerts
    if (weatherData.wind.speed > 15) {
      alerts.push('High winds - Secure loose objects and avoid exposed areas');
    }
    
    // Visibility alerts
    if (weatherData.visibility < 1000) {
      alerts.push('Poor visibility - Use caution when traveling');
    }
    
    // Weather condition alerts
    switch (weatherData.weather[0].main.toLowerCase()) {
      case 'thunderstorm':
        alerts.push('Thunderstorm warning - Seek shelter immediately');
        break;
      case 'rain':
        alerts.push('Rain forecast - Carry umbrella and watch for flooding');
        break;
      case 'snow':
        alerts.push('Snow conditions - Expect travel delays and slippery surfaces');
        break;
    }
    
    return alerts;
  }
  
  private getFallbackWeatherData(lat: number, lon: number) {
    // Return realistic fallback data when API fails
    return {
      location: { lat, lon },
      current: {
        temperature: 25,
        condition: 'partly_cloudy',
        humidity: 60,
        windSpeed: 10,
        visibility: 10,
        uvIndex: 5,
        safetyRating: 8.0
      },
      alerts: ['Unable to get real-time weather data'],
      apiSource: 'Fallback',
      timestamp: new Date().toISOString()
    };
  }
}

// 🗺️ Real Location Safety API Integration
export class RealLocationSafetyService {
  private googleMapsKey: string;
  private numbeoKey: string;
  
  constructor(googleMapsKey: string, numbeoKey: string) {
    this.googleMapsKey = googleMapsKey;
    this.numbeoKey = numbeoKey;
  }
  
  // Google Places API for POI Safety
  async getNearbyPOISafety(lat: number, lon: number, radius: number = 5000) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&key=${this.googleMapsKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return data.results.map((place: any) => ({
        name: place.name,
        type: place.types[0],
        location: place.geometry.location,
        rating: place.rating || 0,
        safetyScore: this.calculatePOISafetyScore(place),
        isOpen: place.opening_hours?.open_now || false,
        vicinity: place.vicinity
      }));
    } catch (error) {
      console.error('Google Places API Error:', error);
      return [];
    }
  }
  
  // Numbeo Crime Index API
  async getCrimeData(city: string, country: string) {
    const url = `https://api.numbeo.com/api/crime?api_key=${this.numbeoKey}&city=${city}&country=${country}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        crimeIndex: data.crime_index,
        safetyIndex: data.safety_index,
        lastUpdate: data.last_update,
        breakdown: {
          pettyTheft: data.level_of_money_and_property_crimes,
          violentCrime: data.level_of_violent_crimes,
          drugProblems: data.problem_drug_taking,
          safetyWalking: data.safe_walking_alone
        },
        recommendations: this.generateSafetyRecommendations(data.crime_index)
      };
    } catch (error) {
      console.error('Numbeo API Error:', error);
      return this.getFallbackCrimeData();
    }
  }
  
  private calculatePOISafetyScore(place: any): number {
    let score = 7.0; // Base score
    
    // POI type influences safety
    if (place.types.includes('police')) score = 9.5;
    if (place.types.includes('hospital')) score = 9.0;
    if (place.types.includes('embassy')) score = 9.2;
    if (place.types.includes('tourist_attraction')) score = 8.5;
    if (place.types.includes('shopping_mall')) score = 8.0;
    if (place.types.includes('night_club')) score = 4.0;
    if (place.types.includes('liquor_store')) score = 5.0;
    
    // Rating influences safety
    if (place.rating) {
      score += (place.rating - 2.5) * 0.8; // Scale rating to safety
    }
    
    return Math.max(1.0, Math.min(10.0, score));
  }
  
  private generateSafetyRecommendations(crimeIndex: number): string[] {
    const recommendations: string[] = [];
    
    if (crimeIndex > 60) {
      recommendations.push('High crime area - Exercise extreme caution');
      recommendations.push('Avoid walking alone, especially at night');
      recommendations.push('Keep valuables hidden and secure');
      recommendations.push('Stay in well-lit, populated areas');
    } else if (crimeIndex > 40) {
      recommendations.push('Moderate crime risk - Stay alert');
      recommendations.push('Be cautious with personal belongings');
      recommendations.push('Avoid isolated areas after dark');
    } else {
      recommendations.push('Relatively safe area');
      recommendations.push('Standard precautions recommended');
    }
    
    return recommendations;
  }
  
  private getFallbackCrimeData() {
    return {
      crimeIndex: 50,
      safetyIndex: 50,
      lastUpdate: new Date().toISOString(),
      breakdown: {
        pettyTheft: 'Moderate',
        violentCrime: 'Low',
        drugProblems: 'Low',
        safetyWalking: 'Moderate'
      },
      recommendations: ['Standard safety precautions recommended']
    };
  }
}

// 📢 Real-time Alerts from Social Media & News
export class RealTimeAlertsService {
  private twitterToken: string;
  private newsApiKey: string;
  
  constructor(twitterToken: string, newsApiKey: string) {
    this.twitterToken = twitterToken;
    this.newsApiKey = newsApiKey;
  }
  
  // Twitter API for real-time incident reports
  async getTwitterAlerts(location: string, keywords: string[] = ['emergency', 'alert', 'danger', 'avoid']) {
    const query = `${location} (${keywords.join(' OR ')}) -is:retweet lang:en`;
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=50`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.twitterToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return data.data?.map((tweet: any) => ({
        type: 'social_media_alert',
        source: 'Twitter',
        content: tweet.text,
        timestamp: tweet.created_at,
        verified: false, // Social media requires verification
        priority: this.calculateAlertPriority(tweet.text)
      })) || [];
    } catch (error) {
      console.error('Twitter API Error:', error);
      return [];
    }
  }
  
  // News API for verified incident reports
  async getNewsAlerts(location: string) {
    const url = `https://newsapi.org/v2/everything?q=${location} AND (emergency OR alert OR danger OR crime)&sortBy=publishedAt&apiKey=${this.newsApiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return data.articles?.slice(0, 10).map((article: any) => ({
        type: 'news_alert',
        source: article.source.name,
        title: article.title,
        description: article.description,
        url: article.url,
        timestamp: article.publishedAt,
        verified: true, // News sources are more reliable
        priority: 'medium'
      })) || [];
    } catch (error) {
      console.error('News API Error:', error);
      return [];
    }
  }
  
  private calculateAlertPriority(text: string): 'high' | 'medium' | 'low' {
    const highPriorityKeywords = ['shooting', 'bomb', 'terrorist', 'evacuation', 'emergency'];
    const mediumPriorityKeywords = ['protest', 'accident', 'fire', 'police'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }
}

// 🚨 Government Travel Advisories API
export class TravelAdvisoryService {
  private stateDeptKey: string;
  
  constructor(stateDeptKey: string) {
    this.stateDeptKey = stateDeptKey;
  }
  
  // US State Department Travel Advisories
  async getUSStateDeptAdvisories(country: string) {
    const url = `https://api.state.gov/travel-advisories/v1/advisories/${country}`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.stateDeptKey}` }
      });
      
      const data = await response.json();
      
      return {
        country: data.country,
        advisoryLevel: data.advisory_level,
        lastUpdated: data.last_updated,
        summary: data.summary,
        details: data.details,
        recommendations: data.recommendations
      };
    } catch (error) {
      console.error('State Dept API Error:', error);
      return this.getFallbackAdvisoryData(country);
    }
  }
  
  private getFallbackAdvisoryData(country: string) {
    return {
      country,
      advisoryLevel: 2,
      lastUpdated: new Date().toISOString(),
      summary: 'Exercise increased caution',
      details: 'Standard travel advisory in effect',
      recommendations: ['Exercise normal precautions', 'Monitor local conditions']
    };
  }
}

// 🔧 Main Service Integration Class
export class RealAPIIntegrationService {
  private weatherService: RealWeatherService;
  private locationService: RealLocationSafetyService;
  private alertsService: RealTimeAlertsService;
  private advisoryService: TravelAdvisoryService;
  
  constructor(config: APIConfig) {
    this.weatherService = new RealWeatherService(config.OPENWEATHER_API_KEY);
    this.locationService = new RealLocationSafetyService(config.GOOGLE_MAPS_API_KEY, config.NUMBEO_API_KEY);
    this.alertsService = new RealTimeAlertsService(config.TWITTER_BEARER_TOKEN, config.NEWS_API_KEY);
    this.advisoryService = new TravelAdvisoryService(config.STATE_DEPT_API_KEY);
  }
  
  // Comprehensive safety assessment for a location
  async getComprehensiveSafetyData(lat: number, lon: number, city?: string, country?: string) {
    try {
      const [
        weatherData,
        weatherAlerts,
        nearbyPOIs,
        crimeData,
        twitterAlerts,
        newsAlerts,
        travelAdvisory
      ] = await Promise.all([
        this.weatherService.getCurrentWeather(lat, lon),
        this.weatherService.getWeatherAlerts(lat, lon),
        this.locationService.getNearbyPOISafety(lat, lon),
        city && country ? this.locationService.getCrimeData(city, country) : null,
        city ? this.alertsService.getTwitterAlerts(city) : [],
        city ? this.alertsService.getNewsAlerts(city) : [],
        country ? this.advisoryService.getUSStateDeptAdvisories(country) : null
      ]);
      
      return {
        location: { latitude: lat, longitude: lon, city, country },
        weather: weatherData,
        alerts: {
          weather: weatherAlerts,
          social: twitterAlerts,
          news: newsAlerts
        },
        safety: {
          nearbyPOIs,
          crimeData,
          travelAdvisory
        },
        overallSafetyScore: this.calculateOverallSafetyScore(weatherData, crimeData, travelAdvisory),
        lastUpdated: new Date().toISOString(),
        dataSource: 'Real APIs'
      };
    } catch (error) {
      console.error('Comprehensive Safety Data Error:', error);
      throw new Error('Unable to fetch real-time safety data');
    }
  }
  
  private calculateOverallSafetyScore(weatherData: any, crimeData: any, advisory: any): number {
    let score = 8.0; // Base score
    
    // Weather impact
    score = (score + weatherData.current.safetyRating) / 2;
    
    // Crime impact
    if (crimeData) {
      score = (score + (100 - crimeData.crimeIndex) / 10) / 2;
    }
    
    // Travel advisory impact
    if (advisory) {
      const advisoryImpact = {
        1: 0,    // Exercise normal precautions
        2: -1,   // Exercise increased caution
        3: -3,   // Reconsider travel
        4: -5    // Do not travel
      };
      score += advisoryImpact[advisory.advisoryLevel as keyof typeof advisoryImpact] || 0;
    }
    
    return Math.max(1.0, Math.min(10.0, score));
  }
}

// 📝 Usage Example for Backend Integration
export const REAL_API_USAGE_EXAMPLE = `
// Backend Express.js Route Example:

app.get('/api/safety/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  const { city, country } = req.query;
  
  const apiConfig: APIConfig = {
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY!,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY!,
    NUMBEO_API_KEY: process.env.NUMBEO_API_KEY!,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN!,
    NEWS_API_KEY: process.env.NEWS_API_KEY!,
    STATE_DEPT_API_KEY: process.env.STATE_DEPT_API_KEY!,
    // ... other API keys
  };
  
  const realAPIService = new RealAPIIntegrationService(apiConfig);
  
  try {
    const safetyData = await realAPIService.getComprehensiveSafetyData(
      parseFloat(lat), 
      parseFloat(lon), 
      city as string, 
      country as string
    );
    
    res.json({
      success: true,
      data: safetyData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time safety data',
      fallback: 'Using cached/mock data'
    });
  }
});

// Environment Variables (.env file):
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
NUMBEO_API_KEY=your_numbeo_key
TWITTER_BEARER_TOKEN=your_twitter_token
NEWS_API_KEY=your_news_api_key
STATE_DEPT_API_KEY=your_state_dept_key
`;

export default RealAPIIntegrationService;