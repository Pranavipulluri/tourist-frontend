import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

interface FallbackMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  onNavigate?: (destination: { lat: number; lng: number }) => void;
  className?: string;
  showRealPlaces?: boolean;
  showSafetyZones?: boolean;
  showLegend?: boolean;
  filteredPlaces?: Array<{
    id: string;
    name: string;
    type: string;
    position: { lat: number; lng: number };
    distance: number;
    address?: string;
    safetyLevel?: string;
  }>;
}

export const FallbackMap: React.FC<FallbackMapProps> = ({
  center,
  zoom = 15,
  onNavigate,
  className = '',
  showSafetyZones = true,
  showLegend = true,
  filteredPlaces = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    initializeMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && filteredPlaces.length > 0) {
      updateMapMarkers();
    }
  }, [filteredPlaces]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      // Dynamically import Leaflet to avoid SSR issues
      const L = await import('leaflet');
      
      // Fix default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map
      const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add user location marker
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([center.lat, center.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 Your Location')
        .openPopup();

      // Add safety zones if enabled
      if (showSafetyZones) {
        addSafetyZones(L, map, center);
      }

      mapInstanceRef.current = map;
      updateMapMarkers();

    } catch (error) {
      console.error('Error initializing fallback map:', error);
      // Show error message in map container
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            height: 100%; 
            background: #f5f5f5; 
            color: #666;
            text-align: center;
            padding: 20px;
          ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
            <h3>Map Temporarily Unavailable</h3>
            <p>Unable to load map tiles. Check your internet connection.</p>
          </div>
        `;
      }
    }
  };

  const addSafetyZones = async (L: any, map: any, center: { lat: number; lng: number }) => {
    // Safe zone (green)
    L.circle([center.lat + 0.001, center.lng + 0.0015], {
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.3,
      radius: 200
    }).addTo(map).bindPopup('🟢 Safe Zone - Well Patrolled Area');

    // Caution zone (yellow)
    L.circle([center.lat - 0.0008, center.lng + 0.001], {
      color: '#F59E0B',
      fillColor: '#F59E0B',
      fillOpacity: 0.3,
      radius: 150
    }).addTo(map).bindPopup('🟡 Caution Zone - Stay Alert');

    // Tourist help center
    const helpIcon = L.divIcon({
      className: 'help-marker',
      html: '<div style="background: #10B981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">ℹ️</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    L.marker([center.lat + 0.0012, center.lng - 0.0008], { icon: helpIcon })
      .addTo(map)
      .bindPopup('🏛️ Tourist Help Center');
  };

  const updateMapMarkers = async () => {
    if (!mapInstanceRef.current || filteredPlaces.length === 0) return;

    try {
      const L = await import('leaflet');
      
      filteredPlaces.forEach(place => {
        const getPlaceIcon = (type: string) => {
          const iconMap: { [key: string]: string } = {
            hospital: '🏥',
            police: '🚔',
            restaurant: '🍽️',
            hotel: '🏨',
            tourist_spot: '📍'
          };
          return iconMap[type] || '📍';
        };

        const getPlaceColor = (safetyLevel?: string) => {
          switch (safetyLevel) {
            case 'safe': return '#10B981';
            case 'caution': return '#F59E0B';
            case 'danger': return '#EF4444';
            default: return '#6B7280';
          }
        };

        const placeIcon = L.divIcon({
          className: 'place-marker',
          html: `<div style="
            background: ${getPlaceColor(place.safetyLevel)}; 
            color: white; 
            width: 35px; 
            height: 35px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 16px;
            border: 2px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${getPlaceIcon(place.type)}</div>`,
          iconSize: [35, 35],
          iconAnchor: [17.5, 17.5]
        });

        const marker = L.marker([place.position.lat, place.position.lng], { icon: placeIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="text-align: center; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0;">${getPlaceIcon(place.type)} ${place.name}</h4>
              <p style="margin: 4px 0; font-size: 0.9em; color: #666;">${place.address || 'Address not available'}</p>
              <p style="margin: 4px 0; font-weight: bold;">📏 ${Math.round(place.distance)}m away</p>
              <div style="
                background: ${getPlaceColor(place.safetyLevel)}; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 0.8em; 
                margin: 8px 0;
                display: inline-block;
              ">
                ${place.safetyLevel === 'safe' ? '✅ Safe' : 
                  place.safetyLevel === 'caution' ? '⚠️ Caution' : '🚨 Risk'}
              </div>
              <br>
              <button onclick="window.navigateToPlace && window.navigateToPlace(${place.position.lat}, ${place.position.lng})" 
                style="
                  background: #3B82F6; 
                  color: white; 
                  border: none; 
                  padding: 6px 12px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 0.9em;
                ">
                🧭 Navigate
              </button>
            </div>
          `);

        // Add click handler for navigation
        marker.on('click', () => {
          if (onNavigate) {
            onNavigate(place.position);
          }
        });
      });

      // Set up global navigation function
      (window as any).navigateToPlace = (lat: number, lng: number) => {
        if (onNavigate) {
          onNavigate({ lat, lng });
        }
      };

    } catch (error) {
      console.error('Error adding place markers:', error);
    }
  };

  return (
    <div className={`fallback-map-container ${className}`} style={{ position: 'relative' }}>
      {/* Map Legend */}
      {showLegend && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '0.85em',
          maxWidth: '200px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1em' }}>🗺️ Map Legend</h4>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#3B82F6' }}>🔵</span> Your Location
          </div>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#10B981' }}>🟢</span> Safe Zones
          </div>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#F59E0B' }}>🟡</span> Caution Areas
          </div>
          <div style={{ marginBottom: '6px' }}>
            🏥🚔🍽️🏨📍 Places of Interest
          </div>
        </div>
      )}

      {/* Attribution */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        right: '5px',
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.7em',
        zIndex: 1000
      }}>
        Fallback Map • © OpenStreetMap
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default FallbackMap;