import React, { useEffect, useRef, useState } from 'react';
import { mapsLoader } from '../../services/mapsLoader';
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
  showLegend?: boolean;
  filteredPlaces?: NearbyPlace[];
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
  showSafetyZones = true,
  showLegend = false,
  filteredPlaces = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [placesService, setPlacesService] = useState<PlacesService | null>(null);

  useEffect(() => {
    const loadMaps = async () => {
      try {
        setMapError(null);
        console.log('🗺️ Loading Google Maps with singleton loader...');
        
        await mapsLoader.loadGoogleMaps();
        setIsLoaded(true);
        console.log('✅ Google Maps loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load Google Maps:', error);
        setMapError('Failed to load Google Maps. Using fallback functionality.');
        setIsLoaded(false);
        
        // Initialize places service anyway for mock data
        const service = PlacesService.getInstance();
        setPlacesService(service);
      }
    };

    loadMaps();
  }, []); // Remove API_KEY dependency since we're using singleton loader

  useEffect(() => {
    if (isLoaded && mapRef.current && !map && window.google) {
      try {
        console.log('🗺️ Initializing Google Map with center:', center);
        
        const mapOptions: google.maps.MapOptions = {
          center,
          zoom,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy'
        };

        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        
        // Wait for map to be ready
        newMap.addListener('idle', () => {
          console.log('✅ Map is ready and idle');
          setMap(newMap);
          
          // Initialize places service after map is ready
          const service = PlacesService.getInstance();
          service.initialize(newMap);
          setPlacesService(service);
          
          // Add user location marker using AdvancedMarkerElement
          if (window.google.maps.marker?.AdvancedMarkerElement) {
            console.log('🎯 Using AdvancedMarkerElement for user location');
            const userLocationPin = document.createElement('div');
            userLocationPin.innerHTML = `
              <div style="
                width: 20px;
                height: 20px;
                background: #4285F4;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
            `;
            
            new window.google.maps.marker.AdvancedMarkerElement({
              position: center,
              map: newMap,
              title: 'Your Location',
              content: userLocationPin
            });
          } else {
            console.log('📍 Using legacy Marker for user location');
            // Fallback to legacy marker
            new window.google.maps.Marker({
              position: center,
              map: newMap,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="6" fill="#4285F4" stroke="#ffffff" stroke-width="3"/>
                    <circle cx="10" cy="10" r="2" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10)
              }
            });
          }
        });
        
        // Set the map immediately for basic functionality
        setMap(newMap);
        
      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
        setMapError('Failed to initialize map');
      }
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

        const colors = zoneColors[zone.level];
        
        // Create a circle instead of polygon since we now have center/radius
        const circle = new window.google.maps.Circle({
          center: { lat: zone.center.lat, lng: zone.center.lng },
          radius: zone.radius,
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
              ">${zone.level} Zone</span>
            </div>
          `
        });

        circle.addListener('click', (event: any) => {
          infoWindow.setPosition(event.latLng);
          infoWindow.open(map);
        });
      });
    }
  }, [map, safetyZones]);

  // Display real nearby places as markers (use filtered places if provided)
  useEffect(() => {
    const placesToShow = filteredPlaces.length > 0 ? filteredPlaces : nearbyPlaces;
    
    if (map && placesToShow.length > 0 && window.google) {
      console.log('Displaying places on map:', placesToShow);
      
      placesToShow.forEach(place => {
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
        
        // Create marker element
        let marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement;
        
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          // Use new AdvancedMarkerElement
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="12" r="4" fill="#ffffff"/>
            </svg>
          `;
          
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: place.position,
            map,
            title: place.name,
            content: markerElement
          });
        } else {
          // Fallback to legacy marker
          marker = new window.google.maps.Marker({
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
        }

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
  }, [map, nearbyPlaces, filteredPlaces, onNavigate]);

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
        
        // Create marker element
        let mapMarker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement;
        
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          // Use new AdvancedMarkerElement
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="12" r="4" fill="#ffffff"/>
            </svg>
          `;
          
          mapMarker = new window.google.maps.marker.AdvancedMarkerElement({
            position: marker.position,
            map,
            title: marker.title,
            content: markerElement
          });
        } else {
          // Fallback to legacy marker
          mapMarker = new window.google.maps.Marker({
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
        }

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

  // Show error message if Maps API failed to load
  if (mapError && !isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg p-4`}>
        <div className="text-center">
          <div className="text-yellow-600 mb-2">⚠️</div>
          <p className="text-gray-700 text-sm mb-2">{mapError}</p>
          <p className="text-gray-500 text-xs">Map features may be limited</p>
        </div>
      </div>
    );
  }

  if (!isLoaded && !mapError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg relative`} style={{ width: '100%', height: '400px', minHeight: '400px' }}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '400px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd'
        }}
      />
      
      {/* Debug Information */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-20">
        Map: {map ? '✅' : '❌'} | Loaded: {isLoaded ? '✅' : '❌'} | Places: {nearbyPlaces.length}
      </div>
      
      {/* Built-in Map Legend Overlay */}
      {showLegend && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs z-10">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🗺️ Map Legend
          </h4>
          
          {/* Safety Zones */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Safety Zones</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Safe Zones</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Caution Areas</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High Risk</span>
              </div>
            </div>
          </div>

          {/* Place Types */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Places</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">🏥</span>
                <span>Hospitals</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">🚔</span>
                <span>Police</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">🍽️</span>
                <span>Restaurants</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">🏨</span>
                <span>Hotels</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">📍</span>
                <span>Tourist Spots</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Status</h5>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;