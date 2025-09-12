import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mock geofencing data for different cities
export const mockGeofencingData = {
  // New Delhi, India
  delhi: {
    city: 'New Delhi',
    country: 'India',
    center: { latitude: 28.6139, longitude: 77.2090 },
    safeZones: [
      {
        name: 'India Gate Area',
        type: 'safe',
        latitude: 28.6129,
        longitude: 77.2295,
        radius: 1000,
        description: 'Well-patrolled tourist area with police presence',
        safetyScore: 9.2,
        amenities: ['Police Station', 'Tourist Information', 'Medical Aid'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Connaught Place',
        type: 'safe',
        latitude: 28.6315,
        longitude: 77.2167,
        radius: 800,
        description: 'Central business district with high security',
        safetyScore: 8.8,
        amenities: ['Metro Station', 'Shopping Center', 'Restaurants'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Red Fort Area',
        type: 'safe',
        latitude: 28.6562,
        longitude: 77.2410,
        radius: 600,
        description: 'Historic monument with tourist police',
        safetyScore: 8.5,
        amenities: ['Tourist Police', 'First Aid', 'Guide Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Lotus Temple',
        type: 'safe',
        latitude: 28.5535,
        longitude: 77.2588,
        radius: 500,
        description: 'Peaceful religious site with security',
        safetyScore: 9.0,
        amenities: ['Security', 'Parking', 'Information Center'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Khan Market',
        type: 'safe',
        latitude: 28.6003,
        longitude: 77.2294,
        radius: 400,
        description: 'Upscale market area with good lighting',
        safetyScore: 8.7,
        amenities: ['Shopping', 'Restaurants', 'ATMs'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Old Delhi Back Alleys',
        type: 'danger',
        latitude: 28.6507,
        longitude: 77.2334,
        radius: 300,
        description: 'Narrow lanes with poor lighting and pickpocket incidents',
        riskLevel: 'HIGH',
        riskFactors: ['Poor Lighting', 'Pickpockets', 'Crowded', 'Limited Police'],
        recommendation: 'Avoid after dark, stay in groups',
        lastIncident: '2024-01-10T18:30:00Z',
        incidentType: 'Theft'
      },
      {
        name: 'Paharganj Side Streets',
        type: 'danger',
        latitude: 28.6414,
        longitude: 77.2085,
        radius: 400,
        description: 'Backpacker area with drug-related activities',
        riskLevel: 'MEDIUM',
        riskFactors: ['Drug Activity', 'Overcrowded', 'Scams'],
        recommendation: 'Be cautious with belongings, avoid isolated areas',
        lastIncident: '2024-01-12T21:15:00Z',
        incidentType: 'Harassment'
      },
      {
        name: 'Yamuna River Banks',
        type: 'danger',
        latitude: 28.6403,
        longitude: 77.2773,
        radius: 800,
        description: 'Isolated area with minimal security',
        riskLevel: 'HIGH',
        riskFactors: ['Isolated', 'No Lighting', 'Criminal Activity'],
        recommendation: 'Avoid completely, especially at night',
        lastIncident: '2024-01-08T22:00:00Z',
        incidentType: 'Assault'
      }
    ]
  },

  // Mumbai, India
  mumbai: {
    city: 'Mumbai',
    country: 'India',
    center: { latitude: 19.0760, longitude: 72.8777 },
    safeZones: [
      {
        name: 'Gateway of India',
        type: 'safe',
        latitude: 19.0728,
        longitude: 72.8347,
        radius: 600,
        description: 'Major tourist landmark with heavy security',
        safetyScore: 9.1,
        amenities: ['Tourist Police', 'Boat Services', 'Hotels'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Marine Drive',
        type: 'safe',
        latitude: 18.9435,
        longitude: 72.8234,
        radius: 1200,
        description: 'Well-lit promenade with constant foot traffic',
        safetyScore: 8.9,
        amenities: ['Street Lighting', 'Food Stalls', 'Police Patrol'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Bandra-Kurla Complex',
        type: 'safe',
        latitude: 19.0688,
        longitude: 72.8688,
        radius: 1000,
        description: 'Modern business district with high security',
        safetyScore: 9.3,
        amenities: ['Corporate Security', 'Metro Access', 'Shopping'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Dharavi Slum Area',
        type: 'danger',
        latitude: 19.0423,
        longitude: 72.8570,
        radius: 1500,
        description: 'Dense slum area, not recommended for tourists',
        riskLevel: 'HIGH',
        riskFactors: ['Maze-like Layout', 'Limited Police Access', 'Theft Risk'],
        recommendation: 'Only visit with authorized guides',
        lastIncident: '2024-01-11T16:45:00Z',
        incidentType: 'Robbery'
      },
      {
        name: 'Kamathipura Red Light Area',
        type: 'danger',
        latitude: 18.9647,
        longitude: 72.8258,
        radius: 500,
        description: 'Red light district with illegal activities',
        riskLevel: 'HIGH',
        riskFactors: ['Illegal Activities', 'Harassment Risk', 'Police Raids'],
        recommendation: 'Completely avoid this area',
        lastIncident: '2024-01-09T23:30:00Z',
        incidentType: 'Harassment'
      }
    ]
  },

  // London, UK
  london: {
    city: 'London',
    country: 'United Kingdom',
    center: { latitude: 51.5074, longitude: -0.1278 },
    safeZones: [
      {
        name: 'Westminster & Big Ben',
        type: 'safe',
        latitude: 51.4994,
        longitude: -0.1245,
        radius: 800,
        description: 'Government area with extensive CCTV and police',
        safetyScore: 9.5,
        amenities: ['CCTV', 'Police Presence', 'Tourist Information'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Covent Garden',
        type: 'safe',
        latitude: 51.5118,
        longitude: -0.1226,
        radius: 400,
        description: 'Popular shopping and entertainment district',
        safetyScore: 9.0,
        amenities: ['Shopping', 'Restaurants', 'Street Performers'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Tower Bridge Area',
        type: 'safe',
        latitude: 51.5055,
        longitude: -0.0754,
        radius: 600,
        description: 'Tourist hotspot with good security measures',
        safetyScore: 8.8,
        amenities: ['Tourist Attractions', 'River Police', 'Emergency Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Elephant and Castle',
        type: 'danger',
        latitude: 51.4946,
        longitude: -0.0999,
        radius: 600,
        description: 'Higher crime rates, especially at night',
        riskLevel: 'MEDIUM',
        riskFactors: ['Knife Crime', 'Drug Activity', 'Poor Lighting'],
        recommendation: 'Avoid late night walks, use main roads',
        lastIncident: '2024-01-13T22:15:00Z',
        incidentType: 'Mugging'
      },
      {
        name: 'Brixton Market Area',
        type: 'danger',
        latitude: 51.4613,
        longitude: -0.1157,
        radius: 400,
        description: 'Petty crime and pickpocketing incidents',
        riskLevel: 'MEDIUM',
        riskFactors: ['Pickpockets', 'Crowded Areas', 'Distraction Theft'],
        recommendation: 'Keep valuables secure, stay alert',
        lastIncident: '2024-01-14T15:20:00Z',
        incidentType: 'Pickpocketing'
      }
    ]
  },

  // New York City, USA
  newYork: {
    city: 'New York City',
    country: 'United States',
    center: { latitude: 40.7128, longitude: -74.0060 },
    safeZones: [
      {
        name: 'Times Square',
        type: 'safe',
        latitude: 40.7580,
        longitude: -73.9855,
        radius: 500,
        description: 'Heavily policed tourist area with constant activity',
        safetyScore: 9.2,
        amenities: ['NYPD Substation', 'Tourist Police', '24/7 Activity'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Central Park South',
        type: 'safe',
        latitude: 40.7677,
        longitude: -73.9807,
        radius: 800,
        description: 'Well-maintained park area with regular patrols',
        safetyScore: 8.7,
        amenities: ['Park Rangers', 'Emergency Phones', 'Good Lighting'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Brooklyn Bridge',
        type: 'safe',
        latitude: 40.7061,
        longitude: -73.9969,
        radius: 300,
        description: 'Iconic landmark with tourist safety measures',
        safetyScore: 8.9,
        amenities: ['Bridge Security', 'Emergency Access', 'Tourist Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Brownsville, Brooklyn',
        type: 'danger',
        latitude: 40.6692,
        longitude: -73.9092,
        radius: 1000,
        description: 'High crime neighborhood with gang activity',
        riskLevel: 'HIGH',
        riskFactors: ['Gang Activity', 'Gun Violence', 'Drug Trade'],
        recommendation: 'Avoid unless absolutely necessary',
        lastIncident: '2024-01-12T20:30:00Z',
        incidentType: 'Armed Robbery'
      },
      {
        name: 'East New York',
        type: 'danger',
        latitude: 40.6664,
        longitude: -73.8826,
        radius: 800,
        description: 'Higher crime rates, especially violent crimes',
        riskLevel: 'HIGH',
        riskFactors: ['Violent Crime', 'Poor Police Response', 'Drug Activity'],
        recommendation: 'Do not visit as a tourist',
        lastIncident: '2024-01-10T19:45:00Z',
        incidentType: 'Assault'
      }
    ]
  },

  // Paris, France
  paris: {
    city: 'Paris',
    country: 'France',
    center: { latitude: 48.8566, longitude: 2.3522 },
    safeZones: [
      {
        name: 'Champs-Élysées',
        type: 'safe',
        latitude: 48.8698,
        longitude: 2.3075,
        radius: 600,
        description: 'Famous avenue with high security presence',
        safetyScore: 9.0,
        amenities: ['Police Patrol', 'CCTV', 'Tourist Information'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Louvre Museum Area',
        type: 'safe',
        latitude: 48.8606,
        longitude: 2.3376,
        radius: 400,
        description: 'Museum district with excellent security',
        safetyScore: 9.3,
        amenities: ['Museum Security', 'Tourist Police', 'Emergency Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Notre-Dame Cathedral',
        type: 'safe',
        latitude: 48.8530,
        longitude: 2.3498,
        radius: 300,
        description: 'Historic site with enhanced security measures',
        safetyScore: 8.8,
        amenities: ['Enhanced Security', 'Emergency Response', 'Tourist Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Châtelet-Les Halles',
        type: 'danger',
        latitude: 48.8619,
        longitude: 2.3467,
        radius: 300,
        description: 'Underground area with pickpocket activity',
        riskLevel: 'MEDIUM',
        riskFactors: ['Pickpockets', 'Underground Passages', 'Tourist Targeting'],
        recommendation: 'Stay alert, secure belongings',
        lastIncident: '2024-01-14T17:30:00Z',
        incidentType: 'Pickpocketing'
      },
      {
        name: 'Gare du Nord',
        type: 'danger',
        latitude: 48.8809,
        longitude: 2.3553,
        radius: 400,
        description: 'Train station area with crime incidents',
        riskLevel: 'MEDIUM',
        riskFactors: ['Theft', 'Scams', 'Crowded Areas'],
        recommendation: 'Keep luggage secure, avoid distractions',
        lastIncident: '2024-01-13T14:45:00Z',
        incidentType: 'Luggage Theft'
      }
    ]
  },

  // Bangkok, Thailand 🇹🇭
  bangkok: {
    city: 'Bangkok',
    country: 'Thailand',
    center: { latitude: 13.7563, longitude: 100.5018 },
    safeZones: [
      {
        name: 'Grand Palace',
        type: 'safe',
        latitude: 13.7500,
        longitude: 100.4925,
        radius: 400,
        description: 'Royal palace with strict security and tourist police',
        safetyScore: 9.5,
        amenities: ['Tourist Police', 'Security Checkpoints', 'Guided Tours'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Wat Pho Temple',
        type: 'safe',
        latitude: 13.7465,
        longitude: 100.4927,
        radius: 300,
        description: 'Sacred temple with monk supervision and security',
        safetyScore: 9.2,
        amenities: ['Temple Security', 'Information Center', 'First Aid'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Chatuchak Weekend Market',
        type: 'safe',
        latitude: 13.7998,
        longitude: 100.5494,
        radius: 600,
        description: 'Large organized market with security and police presence',
        safetyScore: 8.3,
        amenities: ['Market Security', 'Police Booth', 'Information Desk'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Siam Paragon Shopping Center',
        type: 'safe',
        latitude: 13.7460,
        longitude: 100.5346,
        radius: 300,
        description: 'High-end shopping mall with excellent security',
        safetyScore: 9.1,
        amenities: ['Mall Security', 'CCTV', 'Emergency Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Patpong District',
        type: 'danger',
        latitude: 13.7278,
        longitude: 100.5340,
        radius: 500,
        description: 'Red-light district with scams and overcharging',
        riskLevel: 'MEDIUM',
        riskFactors: ['Tourist Scams', 'Overcharging', 'Fake Goods', 'Harassment'],
        recommendation: 'Be very cautious, avoid giving personal information',
        lastIncident: '2024-01-12T23:30:00Z',
        incidentType: 'Scam'
      },
      {
        name: 'Khlong Toei Slum',
        type: 'danger',
        latitude: 13.7167,
        longitude: 100.5500,
        radius: 1000,
        description: 'Large slum area with drug-related crime',
        riskLevel: 'HIGH',
        riskFactors: ['Drug Activity', 'Gang Presence', 'Poor Infrastructure'],
        recommendation: 'Avoid completely - not a tourist area',
        lastIncident: '2024-01-10T19:45:00Z',
        incidentType: 'Drug Crime'
      },
      {
        name: 'Khaosan Road Late Night',
        type: 'danger',
        latitude: 13.7587,
        longitude: 100.4979,
        radius: 300,
        description: 'Backpacker street with late-night incidents',
        riskLevel: 'MEDIUM',
        riskFactors: ['Drunk Tourists', 'Pickpockets', 'Drink Spiking'],
        recommendation: 'Watch drinks, stay with friends, avoid excessive alcohol',
        lastIncident: '2024-01-13T02:15:00Z',
        incidentType: 'Theft'
      }
    ]
  },

  // Tokyo, Japan 🇯🇵
  tokyo: {
    city: 'Tokyo',
    country: 'Japan',
    center: { latitude: 35.6762, longitude: 139.6503 },
    safeZones: [
      {
        name: 'Tokyo Imperial Palace',
        type: 'safe',
        latitude: 35.6852,
        longitude: 139.7528,
        radius: 600,
        description: 'Imperial residence with extensive security measures',
        safetyScore: 9.8,
        amenities: ['Imperial Guard', 'CCTV', 'Emergency Response'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Shibuya Crossing',
        type: 'safe',
        latitude: 35.6598,
        longitude: 139.7006,
        radius: 200,
        description: 'Famous intersection with excellent crowd management',
        safetyScore: 9.5,
        amenities: ['Traffic Police', 'CCTV', 'Crowd Control'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Senso-ji Temple',
        type: 'safe',
        latitude: 35.7148,
        longitude: 139.7967,
        radius: 400,
        description: 'Historic temple with traditional security',
        safetyScore: 9.3,
        amenities: ['Temple Security', 'Tourist Information', 'First Aid'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Ginza Shopping District',
        type: 'safe',
        latitude: 35.6715,
        longitude: 139.7637,
        radius: 800,
        description: 'Upscale shopping area with premium security',
        safetyScore: 9.6,
        amenities: ['Private Security', 'Police Patrol', 'Luxury Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Kabukicho District',
        type: 'danger',
        latitude: 35.6946,
        longitude: 139.7016,
        radius: 400,
        description: 'Entertainment district with yakuza presence',
        riskLevel: 'MEDIUM',
        riskFactors: ['Yakuza Activity', 'Expensive Bars', 'Tourist Traps'],
        recommendation: 'Avoid going alone, be cautious of expensive establishments',
        lastIncident: '2024-01-11T23:45:00Z',
        incidentType: 'Overcharging'
      },
      {
        name: 'Ameya-Yokocho Market Night',
        type: 'danger',
        latitude: 35.7127,
        longitude: 139.7746,
        radius: 200,
        description: 'Market area with potential pickpocketing after dark',
        riskLevel: 'LOW',
        riskFactors: ['Pickpockets', 'Crowded Areas', 'Poor Lighting'],
        recommendation: 'Visit during daylight hours, secure belongings',
        lastIncident: '2024-01-09T21:30:00Z',
        incidentType: 'Pickpocketing'
      }
    ]
  },

  // Sydney, Australia 🇦🇺
  sydney: {
    city: 'Sydney',
    country: 'Australia',
    center: { latitude: -33.8688, longitude: 151.2093 },
    safeZones: [
      {
        name: 'Sydney Opera House',
        type: 'safe',
        latitude: -33.8568,
        longitude: 151.2153,
        radius: 500,
        description: 'Iconic landmark with excellent security and surveillance',
        safetyScore: 9.4,
        amenities: ['Security Personnel', 'CCTV', 'Tourist Information'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Circular Quay',
        type: 'safe',
        latitude: -33.8613,
        longitude: 151.2109,
        radius: 400,
        description: 'Major transport hub with constant police presence',
        safetyScore: 9.0,
        amenities: ['Transport Police', 'Ferry Security', 'Emergency Services'],
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      {
        name: 'Bondi Beach',
        type: 'safe',
        latitude: -33.8909,
        longitude: 151.2743,
        radius: 600,
        description: 'Popular beach with lifeguards and patrol services',
        safetyScore: 8.8,
        amenities: ['Lifeguards', 'Surf Rescue', 'Beach Patrol'],
        lastUpdated: '2024-01-15T10:00:00Z'
      }
    ],
    dangerZones: [
      {
        name: 'Kings Cross (Late Night)',
        type: 'danger',
        latitude: -33.8737,
        longitude: 151.2222,
        radius: 400,
        description: 'Entertainment district with late-night incidents',
        riskLevel: 'MEDIUM',
        riskFactors: ['Drunk Violence', 'Drug Activity', 'Theft'],
        recommendation: 'Avoid late night, travel in groups',
        lastIncident: '2024-01-12T03:30:00Z',
        incidentType: 'Assault'
      },
      {
        name: 'Redfern Station Area',
        type: 'danger',
        latitude: -33.8935,
        longitude: 151.2044,
        radius: 300,
        description: 'Train station area with higher crime rates',
        riskLevel: 'MEDIUM',
        riskFactors: ['Theft', 'Drug Activity', 'Harassment'],
        recommendation: 'Stay alert, avoid loitering',
        lastIncident: '2024-01-10T18:15:00Z',
        incidentType: 'Robbery'
      }
    ]
  }
};

// Function to seed Firebase with geofencing data
export async function seedGeofencingData() {
  console.log('🌍 Seeding geofencing data to Firebase...');
  
  try {
    const safetyZonesCollection = collection(db, 'safetyZones');
    
    // Clear existing data (optional)
    // const existingZones = await getDocs(safetyZonesCollection);
    // for (const doc of existingZones.docs) {
    //   await deleteDoc(doc.ref);
    // }
    
    let totalZones = 0;
    
    // Add all safe and danger zones for each city
    for (const [cityKey, cityData] of Object.entries(mockGeofencingData)) {
      console.log(`📍 Adding zones for ${cityData.city}...`);
      
      // Add safe zones
      for (const zone of cityData.safeZones) {
        const zoneData = {
          ...zone,
          city: cityData.city,
          country: cityData.country,
          geopoint: new (await import('firebase/firestore')).GeoPoint(zone.latitude, zone.longitude),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };
        
        await addDoc(safetyZonesCollection, zoneData);
        totalZones++;
      }
      
      // Add danger zones
      for (const zone of cityData.dangerZones) {
        const zoneData = {
          ...zone,
          city: cityData.city,
          country: cityData.country,
          geopoint: new (await import('firebase/firestore')).GeoPoint(zone.latitude, zone.longitude),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };
        
        await addDoc(safetyZonesCollection, zoneData);
        totalZones++;
      }
    }
    
    console.log(`✅ Successfully seeded ${totalZones} safety zones to Firebase!`);
    return { success: true, totalZones };
  } catch (error: any) {
    console.error('❌ Error seeding geofencing data:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// 🔥 REAL-TIME DANGER ALERTS with Live Data Sources
export const liveDangerAlerts = {
  // Current active incidents from various data sources
  activeIncidents: [
    {
      id: 'delhi-protest-2024-01-15',
      type: 'civil_unrest',
      location: { latitude: 28.6139, longitude: 77.2090 },
      severity: 'HIGH',
      title: 'Large Protest Rally - India Gate',
      description: 'Ongoing political demonstration affecting traffic and pedestrian movement',
      startTime: '2024-01-15T14:00:00Z',
      estimatedEndTime: '2024-01-15T18:00:00Z',
      affectedRadius: 2000,
      recommendations: ['Avoid area', 'Use alternate routes', 'Monitor local news'],
      source: 'Delhi Police Twitter',
      verified: true
    },
    {
      id: 'mumbai-monsoon-2024-01-15',
      type: 'weather_warning',
      location: { latitude: 19.0760, longitude: 72.8777 },
      severity: 'MEDIUM',
      title: 'Heavy Rainfall Warning - Mumbai',
      description: 'IMD warning for heavy rainfall, potential flooding in low-lying areas',
      startTime: '2024-01-15T16:00:00Z',
      estimatedEndTime: '2024-01-16T06:00:00Z',
      affectedRadius: 50000,
      recommendations: ['Avoid coastal areas', 'Carry umbrella', 'Monitor weather updates'],
      source: 'India Meteorological Department',
      verified: true
    },
    {
      id: 'paris-strike-2024-01-15',
      type: 'transport_disruption',
      location: { latitude: 48.8566, longitude: 2.3522 },
      severity: 'MEDIUM',
      title: 'Metro Strike - Paris',
      description: 'Partial metro service disruption due to transport workers strike',
      startTime: '2024-01-15T06:00:00Z',
      estimatedEndTime: '2024-01-15T20:00:00Z',
      affectedRadius: 15000,
      recommendations: ['Use buses', 'Plan extra travel time', 'Consider walking'],
      source: 'RATP Official',
      verified: true
    }
  ]
};

// 🌦️ REAL WEATHER API Integration Mock (for your backend concern)
export const realWeatherAPIMock = {
  // These would connect to real APIs in production
  getCurrentWeather: async (lat: number, lon: number) => {
    // Mock response that simulates real API data structure
    const weatherConditions = [
      'clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy'
    ];
    
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    return {
      location: { lat, lon },
      current: {
        temperature: Math.floor(Math.random() * 40) + 5, // 5-45°C
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 100),
        windSpeed: Math.floor(Math.random() * 30),
        visibility: randomCondition === 'foggy' ? 0.5 : Math.random() * 10 + 1,
        uvIndex: Math.floor(Math.random() * 11),
        safetyRating: calculateWeatherSafetyRating(randomCondition)
      },
      alerts: generateWeatherAlerts(randomCondition),
      apiSource: 'OpenWeatherMap/AccuWeather', // Real APIs you would use
      timestamp: new Date().toISOString()
    };
  }
};

function calculateWeatherSafetyRating(condition: string): number {
  const ratings = {
    clear: 9.5,
    cloudy: 8.5,
    rainy: 6.0,
    stormy: 3.0,
    foggy: 4.0,
    snowy: 5.0
  };
  return ratings[condition as keyof typeof ratings] || 7.0;
}

function generateWeatherAlerts(condition: string): string[] {
  const alerts = {
    stormy: ['Take shelter immediately', 'Avoid outdoor activities', 'Monitor emergency broadcasts'],
    rainy: ['Carry umbrella', 'Watch for slippery surfaces', 'Avoid flood-prone areas'],
    foggy: ['Reduced visibility', 'Use caution when driving', 'Stay on main roads'],
    snowy: ['Dress warmly', 'Watch for icy surfaces', 'Allow extra travel time'],
    clear: [],
    cloudy: []
  };
  return alerts[condition as keyof typeof alerts] || [];
}

// Function to get nearby zones (for testing without Firebase)
export function getNearbyZonesMock(latitude: number, longitude: number, radiusKm = 5) {
  const nearbyZones = [];
  
  for (const cityData of Object.values(mockGeofencingData)) {
    const allZones = [...cityData.safeZones, ...cityData.dangerZones];
    
    for (const zone of allZones) {
      const distance = calculateDistance(latitude, longitude, zone.latitude, zone.longitude);
      
      if (distance <= radiusKm * 1000) { // Convert km to meters
        nearbyZones.push({
          ...zone,
          city: cityData.city,
          country: cityData.country,
          distance: Math.round(distance)
        });
      }
    }
  }
  
  return nearbyZones.sort((a, b) => a.distance - b.distance);
}

// Calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default mockGeofencingData;