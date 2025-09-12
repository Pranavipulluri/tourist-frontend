import { Loader } from '@googlemaps/js-api-loader';
import React, { useEffect, useRef, useState } from 'react';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import PlacesService, { NearbyPlace, SafetyZone } from '../../services/placesService';
import '../../types/google-maps';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    icon?: string;
    type?: 'safe' | 'caution' | 'danger' | 'police' | 'hospital';
  }>;
  onNavigate?: (destination: { lat: number; lng: number }) => void;
  className?: string;
  showRealPlaces?: boolean;
  showSafetyZones?: boolean;
}

// Mock places generator for fallback
const generateMockPlaces = (center: { lat: number; lng: number }): NearbyPlace[] => {
  return [
    {
      id: 'mock_hospital_1',
      name: 'City Hospital',
      type: 'hospital',
      position: { lat: center.lat + 0.002, lng: center.lng + 0.003 },
      distance: 350,
      address: 'Main Street, Hospital District',
      safetyLevel: 'safe',
      rating: 4.2,
      isOpen: true
    },
    {
      id: 'mock_police_1',
      name: 'Police Station',
      type: 'police',
      position: { lat: center.lat - 0.001, lng: center.lng + 0.002 },
      distance: 200,
      address: 'Central Police Station',
      safetyLevel: 'safe',
      isOpen: true
    },
    {
      id: 'mock_restaurant_1',
      name: 'Local Restaurant',
      type: 'restaurant',
      position: { lat: center.lat + 0.001, lng: center.lng - 0.002 },
      distance: 150,
      address: 'Food Street',
      safetyLevel: 'safe',
      rating: 4.0,
      isOpen: true
    }
  ];
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  onNavigate,
  className = '',
  showRealPlaces = true,
  showSafetyZones = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [placesService, setPlacesService] = useState<PlacesService | null>(null);

  // Google Maps API key from config
  const API_KEY = GOOGLE_MAPS_CONFIG.apiKey;

  useEffect(() => {
    const loader = new Loader({
      apiKey: API_KEY,
      version: 'weekly',
      libraries: ['geometry', 'places']
    });

    loader.load().then(() => {
      setIsLoaded(true);
    }).catch(console.error);
  }, [API_KEY]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map && window.google) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(newMap);

      // Initialize places service
      const service = PlacesService.getInstance();
      service.initialize(newMap);
      setPlacesService(service);

      // Add user location marker
      new window.google.maps.Marker({
        position: center,
        map: newMap,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="#ffffff" stroke-width="3"/>
              <circle cx="12" cy="12" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });
    }
  }, [isLoaded, center, map]);

  // Fetch real nearby places when location changes
  useEffect(() => {
    if (placesService && showRealPlaces) {
      const fetchPlaces = async () => {
        try {
          console.log('Fetching nearby places for:', center);
          const places = await placesService.getNearbyPlaces(center, 2000);
          console.log('Fetched places:', places);
          setNearbyPlaces(places);
        } catch (error) {
          console.error('Error fetching nearby places:', error);
          // Fallback to mock data if API fails
          setNearbyPlaces(generateMockPlaces(center));
        }
      };

      fetchPlaces();
    }
  }, [placesService, center, showRealPlaces]);

  // Fetch safety zones
  useEffect(() => {
    if (placesService && showSafetyZones) {
      const fetchSafetyZones = async () => {
        try {
          const zones = await placesService.getSafetyZones(center);
          setSafetyZones(zones);
        } catch (error) {
          console.error('Error fetching safety zones:', error);
        }
      };

      fetchSafetyZones();
    }
  }, [placesService, center, showSafetyZones]);

  // Display safety zones on map
  useEffect(() => {
    if (map && safetyZones.length > 0 && window.google) {
      console.log('Displaying safety zones:', safetyZones);
      
      safetyZones.forEach(zone => {
        const zoneColors = {
          safe: { fill: '#22C55E', stroke: '#16A34A' },
          caution: { fill: '#F59E0B', stroke: '#D97706' },
          danger: { fill: '#EF4444', stroke: '#DC2626' }
        };

        const colors = zoneColors[zone.type];
        
        const polygon = new window.google.maps.Polygon({
          paths: zone.coordinates,
          strokeColor: colors.stroke,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: colors.fill,
          fillOpacity: 0.2,
          map: map
        });

        // Add info window for zone
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: ${colors.stroke};">${zone.name}</h3>
              <p style="margin: 0; font-size: 14px;">${zone.description}</p>
              <span style="
                display: inline-block; 
                margin-top: 8px; 
                padding: 4px 8px; 
                background: ${colors.fill}; 
                color: white; 
                border-radius: 4px; 
                font-size: 12px;
                text-transform: uppercase;
              ">${zone.type} Zone</span>
            </div>
          `
        });

        polygon.addListener('click', (event: any) => {
          infoWindow.setPosition(event.latLng);
          infoWindow.open(map);
        });
      });
    }
  }, [map, safetyZones]);

  // Display real nearby places as markers
  useEffect(() => {
    if (map && nearbyPlaces.length > 0 && window.google) {
      console.log('Displaying nearby places:', nearbyPlaces);
      
      nearbyPlaces.forEach(place => {
        const iconColors: Record<string, string> = {
          safe: '#22C55E',
          caution: '#F59E0B', 
          danger: '#EF4444',
          police: '#3B82F6',
          hospital: '#8B5CF6',
          restaurant: '#F97316',
          hotel: '#06B6D4',
          tourist_spot: '#10B981',
          safe_zone: '#22C55E',
          danger_zone: '#EF4444'
        };

        const color = iconColors[place.type] || iconColors.safe;
        
        const marker = new window.google.maps.Marker({
          position: place.position,
          map,
          title: place.name,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="12" r="4" fill="#ffffff"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        // Add info window for places
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: ${color};">${place.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px;">${place.address}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                📍 ${Math.round(place.distance)}m away
                ${place.rating ? ` | ⭐ ${place.rating}` : ''}
                ${place.isOpen !== undefined ? ` | ${place.isOpen ? '🟢 Open' : '🔴 Closed'}` : ''}
              </p>
              <button 
                onclick="window.navigateToPlace && window.navigateToPlace(${place.position.lat}, ${place.position.lng})"
                style="
                  background: ${color}; 
                  color: white; 
                  border: none; 
                  padding: 6px 12px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 12px;
                  margin-top: 8px;
                "
              >Navigate Here</button>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Add navigation callback to window
        (window as any).navigateToPlace = (lat: number, lng: number) => {
          if (onNavigate) {
            onNavigate({ lat, lng });
          }
        };
      });
    }
  }, [map, nearbyPlaces, onNavigate]);

  // Display original markers if provided
  useEffect(() => {
    if (map && markers.length > 0 && window.google) {
      markers.forEach(marker => {
        const iconColors = {
          safe: '#22C55E',
          caution: '#F59E0B', 
          danger: '#EF4444',
          police: '#3B82F6',
          hospital: '#8B5CF6'
        };

        const color = iconColors[marker.type || 'safe'];
        
        const mapMarker = new window.google.maps.Marker({
          position: marker.position,
          map,
          title: marker.title,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="12" r="4" fill="#ffffff"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        // Add click listener for navigation
        mapMarker.addListener('click', () => {
          if (onNavigate) {
            onNavigate(marker.position);
          }
        });
      });
    }
  }, [map, markers, onNavigate]);

  // Update map center when props change
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [map, center]);

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`${className} rounded-lg`} />;
};

export default GoogleMap;