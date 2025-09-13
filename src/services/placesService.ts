
export interface NearbyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'safe_zone' | 'danger_zone' | 'tourist_spot' | 'restaurant' | 'hotel';
  position: { lat: number; lng: number };
  distance: number; // in meters
  address: string;
  rating?: number;
  isOpen?: boolean;
  phone?: string;
  safetyLevel: 'safe' | 'caution' | 'danger';
}

export interface SafetyZone {
  id: string;
  name: string;
  type: 'safe' | 'caution' | 'danger';
  coordinates: Array<{ lat: number; lng: number }>;
  description: string;
}

class PlacesService {
  private static instance: PlacesService;
  private placesService: google.maps.places.PlacesService | null = null;

  public static getInstance(): PlacesService {
    if (!PlacesService.instance) {
      PlacesService.instance = new PlacesService();
    }
    return PlacesService.instance;
  }

  initialize(map: google.maps.Map) {
    if (window.google && window.google.maps) {
      this.placesService = new window.google.maps.places.PlacesService(map);
    }
  }

  // Fetch real nearby places using Google Places API
  async getNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 2000
  ): Promise<NearbyPlace[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        console.warn('Places service not initialized, returning mock data');
        const mockPlaces = [
          ...this.getMockPlacesByType(location, 'hospital').slice(0, 2),
          ...this.getMockPlacesByType(location, 'police').slice(0, 2),
          ...this.getMockPlacesByType(location, 'restaurant').slice(0, 2)
        ].sort((a, b) => a.distance - b.distance);
        resolve(mockPlaces);
        return;
      }

      const request: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: 'establishment'
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: NearbyPlace[] = results.slice(0, 20).map((place, index) => {
            const types = place.types || [];
            let placeType: NearbyPlace['type'] = 'tourist_spot';
            let safetyLevel: 'safe' | 'caution' | 'danger' = 'safe';

            // Determine place type and safety level
            if (types.includes('hospital') || types.includes('pharmacy')) {
              placeType = 'hospital';
              safetyLevel = 'safe';
            } else if (types.includes('police')) {
              placeType = 'police';
              safetyLevel = 'safe';
            } else if (types.includes('restaurant') || types.includes('food')) {
              placeType = 'restaurant';
              safetyLevel = 'safe';
            } else if (types.includes('lodging')) {
              placeType = 'hotel';
              safetyLevel = 'safe';
            } else if (types.includes('tourist_attraction')) {
              placeType = 'tourist_spot';
              safetyLevel = 'safe';
            }

            // Calculate distance
            const distance = this.calculateDistance(
              location,
              {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            );

            return {
              id: place.place_id || `place_${index}`,
              name: place.name || 'Unknown Place',
              type: placeType,
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              distance,
              address: place.vicinity || '',
              rating: place.rating,
              isOpen: place.opening_hours?.open_now,
              safetyLevel
            };
          });

          resolve(places);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  // Get specific types of places
  async getHospitals(location: { lat: number; lng: number }): Promise<NearbyPlace[]> {
    return this.getPlacesByType(location, 'hospital');
  }

  async getPoliceStations(location: { lat: number; lng: number }): Promise<NearbyPlace[]> {
    return this.getPlacesByType(location, 'police');
  }

  async getRestaurants(location: { lat: number; lng: number }): Promise<NearbyPlace[]> {
    return this.getPlacesByType(location, 'restaurant');
  }

  private async getPlacesByType(
    location: { lat: number; lng: number },
    type: string
  ): Promise<NearbyPlace[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        console.warn('Places service not initialized, returning mock data');
        resolve(this.getMockPlacesByType(location, type));
        return;
      }

      const request: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 5000,
        type: type as any
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: NearbyPlace[] = results.slice(0, 10).map((place, index) => {
            let placeType: NearbyPlace['type'] = 'tourist_spot';
            let safetyLevel: 'safe' | 'caution' | 'danger' = 'safe';

            if (type === 'hospital') {
              placeType = 'hospital';
              safetyLevel = 'safe';
            } else if (type === 'police') {
              placeType = 'police';
              safetyLevel = 'safe';
            } else if (type === 'restaurant') {
              placeType = 'restaurant';
              safetyLevel = 'safe';
            }

            const distance = this.calculateDistance(
              location,
              {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            );

            return {
              id: place.place_id || `${type}_${index}`,
              name: place.name || `Unknown ${type}`,
              type: placeType,
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              distance,
              address: place.vicinity || '',
              rating: place.rating,
              isOpen: place.opening_hours?.open_now,
              phone: place.formatted_phone_number,
              safetyLevel
            };
          });

          resolve(places);
        } else {
          reject(new Error(`${type} search failed: ${status}`));
        }
      });
    });
  }

  // Generate mock places when Google Places API is not available
  private getMockPlacesByType(location: { lat: number; lng: number }, type: string): NearbyPlace[] {
    const mockPlaces: Record<string, NearbyPlace[]> = {
      hospital: [
        {
          id: 'mock_hospital_1',
          name: 'City General Hospital',
          type: 'hospital',
          position: { lat: location.lat + 0.002, lng: location.lng + 0.003 },
          distance: 350,
          address: 'Medical District, Emergency Wing',
          safetyLevel: 'safe',
          rating: 4.2,
          isOpen: true,
          phone: '+91-11-2345-6789'
        },
        {
          id: 'mock_hospital_2',
          name: 'Emergency Medical Center',
          type: 'hospital',
          position: { lat: location.lat - 0.003, lng: location.lng + 0.001 },
          distance: 420,
          address: 'Main Street Healthcare',
          safetyLevel: 'safe',
          rating: 4.0,
          isOpen: true,
          phone: '+91-11-2345-6780'
        }
      ],
      police: [
        {
          id: 'mock_police_1',
          name: 'Central Police Station',
          type: 'police',
          position: { lat: location.lat - 0.001, lng: location.lng + 0.002 },
          distance: 200,
          address: 'Police Headquarters District',
          safetyLevel: 'safe',
          isOpen: true,
          phone: '100'
        },
        {
          id: 'mock_police_2',
          name: 'Tourist Police Booth',
          type: 'police',
          position: { lat: location.lat + 0.001, lng: location.lng - 0.001 },
          distance: 180,
          address: 'Tourist Area Security',
          safetyLevel: 'safe',
          isOpen: true,
          phone: '1091'
        }
      ],
      restaurant: [
        {
          id: 'mock_restaurant_1',
          name: 'Safe Dining Restaurant',
          type: 'restaurant',
          position: { lat: location.lat + 0.001, lng: location.lng - 0.002 },
          distance: 150,
          address: 'Food Court Area',
          safetyLevel: 'safe',
          rating: 4.3,
          isOpen: true,
          phone: '+91-11-2345-6781'
        },
        {
          id: 'mock_restaurant_2',
          name: 'Tourist Café',
          type: 'restaurant',
          position: { lat: location.lat - 0.002, lng: location.lng - 0.001 },
          distance: 280,
          address: 'Heritage Plaza',
          safetyLevel: 'safe',
          rating: 4.1,
          isOpen: true,
          phone: '+91-11-2345-6782'
        }
      ]
    };

    return mockPlaces[type] || [];
  }

  // Mock safety zones (in real app, this would come from backend)
  async getSafetyZones(location: { lat: number; lng: number }): Promise<SafetyZone[]> {
    // Generate mock safety zones around the user's location
    const zones: SafetyZone[] = [
      {
        id: 'safe_zone_1',
        name: 'Tourist Safe Zone',
        type: 'safe',
        coordinates: [
          { lat: location.lat + 0.005, lng: location.lng + 0.005 },
          { lat: location.lat + 0.005, lng: location.lng - 0.005 },
          { lat: location.lat - 0.005, lng: location.lng - 0.005 },
          { lat: location.lat - 0.005, lng: location.lng + 0.005 }
        ],
        description: 'Well-patrolled tourist area with good lighting and emergency services'
      },
      {
        id: 'caution_zone_1',
        name: 'Market Area',
        type: 'caution',
        coordinates: [
          { lat: location.lat + 0.008, lng: location.lng + 0.008 },
          { lat: location.lat + 0.008, lng: location.lng + 0.003 },
          { lat: location.lat + 0.003, lng: location.lng + 0.003 },
          { lat: location.lat + 0.003, lng: location.lng + 0.008 }
        ],
        description: 'Crowded area - be aware of pickpockets and keep valuables secure'
      },
      {
        id: 'danger_zone_1',
        name: 'Construction Zone',
        type: 'danger',
        coordinates: [
          { lat: location.lat - 0.008, lng: location.lng + 0.008 },
          { lat: location.lat - 0.008, lng: location.lng + 0.003 },
          { lat: location.lat - 0.003, lng: location.lng + 0.003 },
          { lat: location.lat - 0.003, lng: location.lng + 0.008 }
        ],
        description: 'Active construction zone - avoid during nighttime'
      }
    ];

    return Promise.resolve(zones);
  }

  // Calculate distance between two points
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat-point1.lat) * Math.PI/180;
    const Δλ = (point2.lng-point1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

export default PlacesService;