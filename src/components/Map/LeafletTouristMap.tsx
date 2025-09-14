import L from 'leaflet';
import React, { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { NearbyPlace, SafetyZone } from '../../services/placesService';

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LeafletTouristMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  places: NearbyPlace[];
  safetyZones?: SafetyZone[];
  onNavigate?: (destination: { lat: number; lng: number }) => void;
  className?: string;
}

// Custom hook to update map center
const MapUpdater: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [map, center]);

  return null;
};

// Component to handle places markers
const PlacesLayer: React.FC<{
  places: NearbyPlace[];
  onNavigate?: (destination: { lat: number; lng: number }) => void;
}> = ({ places, onNavigate }) => {
  
  // Custom icons for different place types
  const getPlaceIcon = (type: string, safetyLevel: string) => {
    const getColor = () => {
      switch (safetyLevel) {
        case 'safe': return '#10B981';
        case 'caution': return '#F59E0B';
        case 'danger': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getSymbol = () => {
      switch (type) {
        case 'hospital': return '🏥';
        case 'police': return '🚔';
        case 'restaurant': return '🍽️';
        case 'hotel': return '🏨';
        case 'tourist_spot': return '📍';
        default: return '📍';
      }
    };

    return L.divIcon({
      html: `
        <div style="
          background-color: ${getColor()};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
        ">
          ${getSymbol()}
        </div>
      `,
      className: 'custom-place-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <>
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.position.lat, place.position.lng]}
          icon={getPlaceIcon(place.type, place.safetyLevel)}
        >
          <Popup>
            <div className="place-popup">
              <div className="popup-header">
                <h4>{place.name}</h4>
                <span className={`safety-badge ${place.safetyLevel}`}>
                  {place.safetyLevel === 'safe' ? '✅ Safe' : 
                   place.safetyLevel === 'caution' ? '⚠️ Caution' : '🚨 Risk'}
                </span>
              </div>
              
              <div className="popup-details">
                <p><strong>Type:</strong> {place.type}</p>
                <p><strong>Distance:</strong> {formatDistance(place.distance)}</p>
                {place.address && <p><strong>Address:</strong> {place.address}</p>}
                {place.rating && (
                  <p><strong>Rating:</strong> ⭐ {place.rating}</p>
                )}
                {place.isOpen !== undefined && (
                  <p><strong>Status:</strong> 
                    <span className={place.isOpen ? 'open' : 'closed'}>
                      {place.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </p>
                )}
              </div>

              <div className="popup-actions">
                <button 
                  className="navigate-btn"
                  onClick={() => onNavigate?.(place.position)}
                  style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  🧭 Navigate
                </button>
                {place.phone && (
                  <button 
                    className="call-btn"
                    onClick={() => window.open(`tel:${place.phone}`)}
                    style={{
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}
                  >
                    📞 Call
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

// Component to handle safety zones
const SafetyZonesLayer: React.FC<{ zones: SafetyZone[] }> = ({ zones }) => {
  const getZoneColor = (level: string) => {
    switch (level) {
      case 'safe': return { color: '#10B981', fillColor: '#D1FAE5' };
      case 'caution': return { color: '#F59E0B', fillColor: '#FEF3C7' };
      case 'danger': return { color: '#EF4444', fillColor: '#FEE2E2' };
      default: return { color: '#6B7280', fillColor: '#F3F4F6' };
    }
  };

  return (
    <>
      {zones.map((zone) => {
        const colors = getZoneColor(zone.level);
        return (
          <Circle
            key={zone.id}
            center={[zone.center.lat, zone.center.lng]}
            radius={zone.radius}
            pathOptions={{
              color: colors.color,
              fillColor: colors.fillColor,
              fillOpacity: 0.2,
              weight: 2,
              opacity: 0.8
            }}
          >
            <Popup>
              <div className="zone-popup">
                <h4>{zone.name}</h4>
                <p><strong>Safety Level:</strong> 
                  <span className={`safety-badge ${zone.level}`}>
                    {zone.level === 'safe' ? '✅ Safe Zone' : 
                     zone.level === 'caution' ? '⚠️ Caution Zone' : '🚨 Danger Zone'}
                  </span>
                </p>
                {zone.description && <p>{zone.description}</p>}
                <p><strong>Radius:</strong> {zone.radius}m</p>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
};

// Main Leaflet Tourist Map Component
const LeafletTouristMap: React.FC<LeafletTouristMapProps> = ({
  center,
  zoom = 15,
  places,
  safetyZones = [],
  onNavigate,
  className = ''
}) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Could not get current location:', error);
          setCurrentLocation(center);
        }
      );
    } else {
      setCurrentLocation(center);
    }
  }, [center]);

  // User location icon
  const userLocationIcon = L.divIcon({
    html: `
      <div style="
        background-color: #3B82F6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'user-location-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  return (
    <div className={`leaflet-tourist-map ${className}`} style={{ height: '400px', width: '100%' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapUpdater center={center} />
        
        {/* User's current location */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="user-location-popup">
                <h4>📍 Your Location</h4>
                <p>Lat: {currentLocation.lat.toFixed(6)}</p>
                <p>Lng: {currentLocation.lng.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Safety Zones */}
        {safetyZones.length > 0 && <SafetyZonesLayer zones={safetyZones} />}
        
        {/* Places */}
        <PlacesLayer places={places} onNavigate={onNavigate} />
      </MapContainer>
    </div>
  );
};

export default LeafletTouristMap;