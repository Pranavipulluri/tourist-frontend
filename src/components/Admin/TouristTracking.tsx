import L from 'leaflet';
import {
    Activity,
    AlertTriangle,
    Battery,
    Clock,
    Download,
    Eye,
    MapPin,
    MessageSquare,
    Navigation,
    Phone,
    Search,
    Users,
    Wifi,
    WifiOff
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Circle,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap
} from 'react-leaflet';
import io, { Socket } from 'socket.io-client';
import './TouristTracking.css';

// Types
interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface Tourist {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EMERGENCY' | 'WARNING' | 'OFFLINE';
  lastLocation?: LocationPoint;
  locationHistory: LocationPoint[];
  deviceInfo?: {
    batteryLevel?: number;
    isOnline: boolean;
    lastSeen: string;
    deviceType: string;
    appVersion: string;
  };
  emergencyContacts?: string[];
  digitalId?: string;
  checkInTime?: string;
  expectedCheckOut?: string;
  geofenceStatus?: {
    isInSafeZone: boolean;
    currentZone?: string;
    violations: number;
  };
}

interface TrackingFilters {
  status: 'ALL' | 'ACTIVE' | 'EMERGENCY' | 'OFFLINE';
  timeRange: '1h' | '6h' | '24h' | '7d';
  showTrails: boolean;
  showGeofences: boolean;
  selectedTourists: string[];
}

interface TouristTrackingProps {
  onTouristSelect?: (tourist: Tourist) => void;
}

// Real-time map component with live updates
const LiveTrackingMap: React.FC<{
  tourists: Tourist[];
  filters: TrackingFilters;
  onTouristClick: (tourist: Tourist) => void;
  selectedTourist?: Tourist;
}> = ({ tourists, filters, onTouristClick, selectedTourist }) => {
  const map = useMap();

  // Custom icons based on tourist status
  const getTouristIcon = (tourist: Tourist) => {
    const statusColors = {
      ACTIVE: '#10B981',
      INACTIVE: '#6B7280',
      EMERGENCY: '#EF4444',
      WARNING: '#F59E0B',
      OFFLINE: '#9CA3AF'
    };

    const size = selectedTourist?.id === tourist.id ? 20 : 16;
    const color = statusColors[tourist.status];

    return L.divIcon({
      html: `
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          ${tourist.status === 'EMERGENCY' ? 'animation: pulse 1s infinite;' : ''}
        ">
          ${!tourist.deviceInfo?.isOnline ? `
            <div style="
              position: absolute;
              top: -5px;
              right: -5px;
              width: 8px;
              height: 8px;
              background: #EF4444;
              border-radius: 50%;
              border: 1px solid white;
            "></div>
          ` : ''}
        </div>
      `,
      className: 'tourist-marker',
      iconSize: [size + 6, size + 6],
      iconAnchor: [(size + 6) / 2, (size + 6) / 2]
    });
  };

  // Filter tourists based on current filters
  const filteredTourists = Array.isArray(tourists) ? tourists.filter(tourist => {
    if (filters.status !== 'ALL' && tourist.status !== filters.status) return false;
    if (filters.selectedTourists.length > 0 && !filters.selectedTourists.includes(tourist.id)) return false;
    return true;
  }) : [];

  // Get location trail for a tourist
  const getLocationTrail = (tourist: Tourist) => {
    if (!filters.showTrails || !tourist.locationHistory.length) return [];
    
    const now = new Date();
    const timeLimit = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[filters.timeRange];

    return tourist.locationHistory
      .filter(point => (now.getTime() - new Date(point.timestamp).getTime()) <= timeLimit)
      .map(point => [point.latitude, point.longitude] as [number, number]);
  };

  return (
    <>
      {/* Tourist markers */}
      {filteredTourists.map(tourist => 
        tourist.lastLocation && (
          <Marker
            key={tourist.id}
            position={[tourist.lastLocation.latitude, tourist.lastLocation.longitude]}
            icon={getTouristIcon(tourist)}
            eventHandlers={{
              click: () => onTouristClick(tourist)
            }}
          >
            <Popup>
              <div className="tourist-popup">
                <div className="popup-header">
                  <h4>{tourist.name}</h4>
                  <span className={`status-badge ${tourist.status.toLowerCase()}`}>
                    {tourist.status}
                  </span>
                </div>
                
                <div className="popup-details">
                  <div className="detail-row">
                    <Phone size={14} />
                    <span>{tourist.phone}</span>
                  </div>
                  
                  <div className="detail-row">
                    <Clock size={14} />
                    <span>{new Date(tourist.lastLocation.timestamp).toLocaleString()}</span>
                  </div>
                  
                  {tourist.lastLocation.accuracy && (
                    <div className="detail-row">
                      <Navigation size={14} />
                      <span>±{tourist.lastLocation.accuracy}m accuracy</span>
                    </div>
                  )}

                  {tourist.lastLocation.speed && (
                    <div className="detail-row">
                      <Activity size={14} />
                      <span>{(tourist.lastLocation.speed * 3.6).toFixed(1)} km/h</span>
                    </div>
                  )}

                  {tourist.deviceInfo && (
                    <div className="device-info">
                      <div className="detail-row">
                        {tourist.deviceInfo.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{tourist.deviceInfo.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                      
                      {tourist.deviceInfo.batteryLevel && (
                        <div className="detail-row">
                          <Battery size={14} />
                          <span>{tourist.deviceInfo.batteryLevel}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {tourist.geofenceStatus && (
                    <div className="geofence-info">
                      <div className={`detail-row ${tourist.geofenceStatus.isInSafeZone ? 'safe' : 'warning'}`}>
                        <MapPin size={14} />
                        <span>
                          {tourist.geofenceStatus.isInSafeZone ? 'In Safe Zone' : 'Outside Safe Zone'}
                        </span>
                      </div>
                      {tourist.geofenceStatus.currentZone && (
                        <div className="detail-row">
                          <span>Zone: {tourist.geofenceStatus.currentZone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="popup-actions">
                  <button 
                    className="btn-track"
                    onClick={() => onTouristClick(tourist)}
                  >
                    <Eye size={14} />
                    Track
                  </button>
                  <button 
                    className="btn-call"
                    onClick={() => window.open(`tel:${tourist.phone}`)}
                  >
                    <Phone size={14} />
                    Call
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      )}

      {/* Location trails */}
      {filters.showTrails && filteredTourists.map(tourist => {
        const trail = getLocationTrail(tourist);
        if (trail.length < 2) return null;

        const trailColor = {
          ACTIVE: '#10B981',
          INACTIVE: '#6B7280',
          EMERGENCY: '#EF4444',
          WARNING: '#F59E0B',
          OFFLINE: '#9CA3AF'
        }[tourist.status];

        return (
          <Polyline
            key={`trail-${tourist.id}`}
            positions={trail}
            pathOptions={{
              color: trailColor,
              weight: selectedTourist?.id === tourist.id ? 4 : 2,
              opacity: selectedTourist?.id === tourist.id ? 0.8 : 0.5,
              dashArray: tourist.status === 'OFFLINE' ? '5, 10' : undefined
            }}
          />
        );
      })}

      {/* Accuracy circles for selected tourist */}
      {selectedTourist?.lastLocation?.accuracy && (
        <Circle
          center={[selectedTourist.lastLocation.latitude, selectedTourist.lastLocation.longitude]}
          radius={selectedTourist.lastLocation.accuracy}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            weight: 1
          }}
        />
      )}
    </>
  );
};

// Tourist list component
const TouristList: React.FC<{
  tourists: Tourist[];
  filters: TrackingFilters;
  onTouristSelect: (tourist: Tourist) => void;
  onFiltersChange: (filters: TrackingFilters) => void;
  selectedTourist?: Tourist;
}> = ({ tourists, filters, onTouristSelect, onFiltersChange, selectedTourist }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTourists = Array.isArray(tourists) ? tourists.filter(tourist => {
    const matchesSearch = tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tourist.phone.includes(searchTerm) ||
                         tourist.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'ALL' || tourist.status === filters.status;
    return matchesSearch && matchesStatus;
  }) : [];

  const getStatusIcon = (status: Tourist['status']) => {
    const icons = {
      ACTIVE: <Activity size={16} style={{ color: '#10B981' }} />,
      INACTIVE: <Clock size={16} style={{ color: '#6B7280' }} />,
      EMERGENCY: <AlertTriangle size={16} style={{ color: '#EF4444' }} />,
      WARNING: <AlertTriangle size={16} style={{ color: '#F59E0B' }} />,
      OFFLINE: <WifiOff size={16} style={{ color: '#9CA3AF' }} />
    };
    return icons[status];
  };

  const getLastSeenText = (tourist: Tourist) => {
    if (!tourist.lastLocation) return 'No location data';
    
    const lastSeen = new Date(tourist.lastLocation.timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="tourist-list">
      <div className="list-header">
        <h3>
          <Users size={20} />
          Tourists ({filteredTourists.length})
        </h3>
        
        <div className="list-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tourists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({
              ...filters,
              status: e.target.value as TrackingFilters['status']
            })}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      <div className="tourist-items">
        {filteredTourists.map(tourist => (
          <div
            key={tourist.id}
            className={`tourist-item ${selectedTourist?.id === tourist.id ? 'selected' : ''}`}
            onClick={() => onTouristSelect(tourist)}
          >
            <div className="tourist-avatar">
              {getStatusIcon(tourist.status)}
            </div>
            
            <div className="tourist-info">
              <div className="tourist-name">{tourist.name}</div>
              <div className="tourist-details">
                <span className="phone">{tourist.phone}</span>
                {tourist.deviceInfo && (
                  <span className="device-status">
                    {tourist.deviceInfo.isOnline ? (
                      <Wifi size={12} style={{ color: '#10B981' }} />
                    ) : (
                      <WifiOff size={12} style={{ color: '#EF4444' }} />
                    )}
                    {tourist.deviceInfo.batteryLevel && (
                      <span>{tourist.deviceInfo.batteryLevel}%</span>
                    )}
                  </span>
                )}
              </div>
              <div className="last-seen">{getLastSeenText(tourist)}</div>
            </div>

            <div className="tourist-actions">
              <button
                className="btn-call"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${tourist.phone}`);
                }}
              >
                <Phone size={14} />
              </button>
              <button
                className="btn-message"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle message action
                }}
              >
                <MessageSquare size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Tourist Tracking Component
const TouristTracking: React.FC<TouristTrackingProps> = ({ onTouristSelect }) => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<Tourist | undefined>();
  const [filters, setFilters] = useState<TrackingFilters>({
    status: 'ALL',
    timeRange: '6h',
    showTrails: true,
    showGeofences: true,
    selectedTourists: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());

  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Tourist Tracking WebSocket connected');
      setIsConnected(true);
      socket.emit('join-room', 'tourist-tracking');
    });

    socket.on('disconnect', () => {
      console.log('❌ Tourist Tracking WebSocket disconnected');
      setIsConnected(false);
    });

    // Listen for location updates
    socket.on('tourist-location-update', (updatedTourist: Tourist) => {
      setTourists(prev => Array.isArray(prev) ? prev.map(tourist => 
        tourist.id === updatedTourist.id 
          ? { 
              ...tourist, 
              ...updatedTourist,
              locationHistory: [
                ...(tourist.locationHistory || []),
                ...(updatedTourist.locationHistory || [])
              ].slice(-100) // Keep last 100 points
            }
          : tourist
      ) : []);
      setLastUpdate(new Date().toISOString());
    });

    // Listen for status changes
    socket.on('tourist-status-change', (data: { touristId: string; status: Tourist['status'] }) => {
      setTourists(prev => Array.isArray(prev) ? prev.map(tourist => 
        tourist.id === data.touristId 
          ? { ...tourist, status: data.status }
          : tourist
      ) : []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial tourist data
  const fetchTourists = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/tourists');
      const data = await response.json();
      const touristsData = data.data || data || [];
      setTourists(Array.isArray(touristsData) ? touristsData : []);
    } catch (error) {
      console.error('Failed to fetch tourists:', error);
      setTourists([]); // Ensure we always have an array on error
    }
  }, []);

  useEffect(() => {
    fetchTourists();
  }, [fetchTourists]);

  // Handle tourist selection
  const handleTouristSelect = (tourist: Tourist) => {
    setSelectedTourist(tourist);
    onTouristSelect?.(tourist);

    // Center map on selected tourist
    if (tourist.lastLocation && mapRef.current) {
      mapRef.current.setView(
        [tourist.lastLocation.latitude, tourist.lastLocation.longitude],
        15
      );
    }
  };

  // Export tracking data
  const exportTrackingData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      filters,
      tourists: Array.isArray(tourists) ? tourists.map(tourist => ({
        ...tourist,
        locationHistory: Array.isArray(tourist.locationHistory) ? tourist.locationHistory.filter(point => {
          const now = new Date();
          const timeLimit = {
            '1h': 1 * 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
          }[filters.timeRange];
          return (now.getTime() - new Date(point.timestamp).getTime()) <= timeLimit;
        }) : []
      })) : []
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourist-tracking-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tourist-tracking">
      <div className="tracking-header">
        <div className="header-left">
          <h1>
            <Navigation size={28} />
            Real-time Tourist Tracking
          </h1>
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            <span className="last-update">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="header-controls">
          <div className="filter-controls">
            <label>
              <input
                type="checkbox"
                checked={filters.showTrails}
                onChange={(e) => setFilters(prev => ({ ...prev, showTrails: e.target.checked }))}
              />
              Show Trails
            </label>
            
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                timeRange: e.target.value as TrackingFilters['timeRange'] 
              }))}
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          <button className="export-btn" onClick={exportTrackingData}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="tracking-content">
        <div className="map-section">
          <MapContainer
            center={[28.6139, 77.2090]} // Default to Delhi
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LiveTrackingMap
              tourists={tourists}
              filters={filters}
              onTouristClick={handleTouristSelect}
              selectedTourist={selectedTourist}
            />
          </MapContainer>
        </div>

        <TouristList
          tourists={tourists}
          filters={filters}
          onTouristSelect={handleTouristSelect}
          onFiltersChange={setFilters}
          selectedTourist={selectedTourist}
        />
      </div>

      {/* Selected Tourist Details Panel */}
      {selectedTourist && (
        <div className="tourist-details-panel">
          <div className="panel-header">
            <h3>{selectedTourist.name}</h3>
            <button onClick={() => setSelectedTourist(undefined)}>×</button>
          </div>
          
          <div className="panel-content">
            <div className="detail-section">
              <h4>Current Status</h4>
              <div className={`status-display ${selectedTourist.status.toLowerCase()}`}>
                {getStatusIcon(selectedTourist.status)}
                <span>{selectedTourist.status}</span>
              </div>
            </div>

            {selectedTourist.lastLocation && (
              <div className="detail-section">
                <h4>Last Location</h4>
                <div className="location-details">
                  <p><strong>Coordinates:</strong> {selectedTourist.lastLocation.latitude.toFixed(6)}, {selectedTourist.lastLocation.longitude.toFixed(6)}</p>
                  <p><strong>Time:</strong> {new Date(selectedTourist.lastLocation.timestamp).toLocaleString()}</p>
                  {selectedTourist.lastLocation.accuracy && (
                    <p><strong>Accuracy:</strong> ±{selectedTourist.lastLocation.accuracy}m</p>
                  )}
                  {selectedTourist.lastLocation.speed && (
                    <p><strong>Speed:</strong> {(selectedTourist.lastLocation.speed * 3.6).toFixed(1)} km/h</p>
                  )}
                </div>
              </div>
            )}

            {selectedTourist.deviceInfo && (
              <div className="detail-section">
                <h4>Device Information</h4>
                <div className="device-details">
                  <p><strong>Status:</strong> {selectedTourist.deviceInfo.isOnline ? 'Online' : 'Offline'}</p>
                  {selectedTourist.deviceInfo.batteryLevel && (
                    <p><strong>Battery:</strong> {selectedTourist.deviceInfo.batteryLevel}%</p>
                  )}
                  <p><strong>Device:</strong> {selectedTourist.deviceInfo.deviceType}</p>
                  <p><strong>App Version:</strong> {selectedTourist.deviceInfo.appVersion}</p>
                  <p><strong>Last Seen:</strong> {new Date(selectedTourist.deviceInfo.lastSeen).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="panel-actions">
              <button 
                className="btn-call"
                onClick={() => window.open(`tel:${selectedTourist.phone}`)}
              >
                <Phone size={16} />
                Call Tourist
              </button>
              <button className="btn-message">
                <MessageSquare size={16} />
                Send Message
              </button>
              <button className="btn-center-map">
                <MapPin size={16} />
                Center on Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getStatusIcon(status: Tourist['status']) {
  const icons = {
    ACTIVE: <Activity size={16} style={{ color: '#10B981' }} />,
    INACTIVE: <Clock size={16} style={{ color: '#6B7280' }} />,
    EMERGENCY: <AlertTriangle size={16} style={{ color: '#EF4444' }} />,
    WARNING: <AlertTriangle size={16} style={{ color: '#F59E0B' }} />,
    OFFLINE: <WifiOff size={16} style={{ color: '#9CA3AF' }} />
  };
  return icons[status];
}

export default TouristTracking;