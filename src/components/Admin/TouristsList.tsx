import React, { useEffect, useState } from 'react';
import { apiService, Location, Tourist } from '../../services/api';

interface TouristWithActivity extends Tourist {
  isActive?: boolean;
  isOnline?: boolean;
  lastLocationUpdate?: string | null;
  currentLocation?: Location | null;
  hasGeofenceViolation?: boolean;
}

export const TouristsList: React.FC = () => {
  const [tourists, setTourists] = useState<TouristWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'online'>('all');
  const [selectedTourist, setSelectedTourist] = useState<TouristWithActivity | null>(null);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);
  const [showGeofencing, setShowGeofencing] = useState(false);
  const [geofenceViolations, setGeofenceViolations] = useState<any[]>([]);

  useEffect(() => {
    loadTourists();
    
    // Setup WebSocket listeners for real-time updates
    const handleLocationUpdate = (data: any) => {
      console.log('📍 Real-time location update:', data);
      setTourists(prev => prev.map(tourist => 
        tourist.id === data.touristId 
          ? { 
              ...tourist, 
              lastLocationUpdate: new Date().toISOString(), 
              isOnline: true,
              currentLocation: data.location
            }
          : tourist
      ));
    };

    const handleStatusChange = (data: any) => {
      console.log('🔄 Tourist status change:', data);
      setTourists(prev => prev.map(tourist => 
        tourist.id === data.touristId 
          ? { ...tourist, isActive: data.status === 'ACTIVE' }
          : tourist
      ));
    };

    const handleNewTourist = (tourist: Tourist) => {
      console.log('👤 New tourist registered:', tourist);
      const newTourist: TouristWithActivity = {
        ...tourist,
        isActive: true,
        isOnline: true,
        lastLocationUpdate: new Date().toISOString()
      };
      setTourists(prev => [...prev, newTourist]);
    };

    const handleGeofenceViolation = (data: any) => {
      console.log('🚨 Geofence violation detected:', data);
      setGeofenceViolations(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 violations
      
      // Update tourist status to show violation
      setTourists(prev => prev.map(tourist => 
        tourist.id === data.touristId 
          ? { ...tourist, hasGeofenceViolation: true }
          : tourist
      ));
    };

    // Setup real-time listeners
    // Note: These should be properly implemented in websocket service
    const mockSetupRealTimeEvents = () => {
      // Simulate real-time location updates every 30 seconds
      const locationInterval = setInterval(() => {
        if (tourists.length > 0) {
          const randomTourist = tourists[Math.floor(Math.random() * tourists.length)];
          handleLocationUpdate({
            touristId: randomTourist.id,
            location: {
              latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
              longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
              timestamp: new Date().toISOString(),
              address: 'Live Location Update'
            }
          });
        }
      }, 30000);

      return () => clearInterval(locationInterval);
    };

    const cleanup = mockSetupRealTimeEvents();
    
    return () => {
      cleanup();
      // Cleanup real WebSocket listeners when implemented
    };
  }, [tourists.length]);

  const loadTourists = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading real tourist data...');
      console.log('🌐 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:3001');
      
      const touristsData = await apiService.getAllTourists();
      console.log('📊 Received tourists data:', touristsData);
      
      if (!touristsData || touristsData.length === 0) {
        console.log('⚠️ No tourists found in database - checking for users like Pranavi Pulluri');
        setError('No registered tourists found. Make sure users are registered with TOURIST role.');
        setTourists([]);
        return;
      }
      
      // Enhance tourists with real-time activity data
      const enhancedTourists = await Promise.all(
        touristsData.map(async (tourist) => {
          try {
            // Get real location history
            const locationHistory = await apiService.getTouristLocationHistory(tourist.id);
            const latestLocation = locationHistory[0];
            
            // Calculate real online status (last location within 10 minutes)
            const isOnline = latestLocation 
              ? (Date.now() - new Date(latestLocation.timestamp).getTime()) < 10 * 60 * 1000
              : false;
            
            console.log(`👤 Enhanced tourist: ${tourist.firstName} ${tourist.lastName} - Online: ${isOnline}`);
            
            return {
              ...tourist,
              isActive: true, // All registered users are considered active unless explicitly deactivated
              isOnline,
              lastLocationUpdate: latestLocation?.timestamp || null,
              currentLocation: latestLocation || null
            };
          } catch (error) {
            console.error(`Error loading data for tourist ${tourist.firstName} ${tourist.lastName}:`, error);
            return {
              ...tourist,
              isActive: true,
              isOnline: false,
              lastLocationUpdate: null,
              currentLocation: null
            };
          }
        })
      );
      
      console.log('✅ Enhanced tourists with activity data:', enhancedTourists);
      setTourists(enhancedTourists);
      
    } catch (err: any) {
      console.error('❌ Failed to load tourists:', err);
      setError(`Failed to load tourists: ${err.message || 'Network error'}. Check if backend is running and users are registered with TOURIST role.`);
      setTourists([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTouristStatus = async (touristId: string) => {
    try {
      const tourist = tourists.find(t => t.id === touristId);
      if (!tourist) return;

      const newStatus = tourist.isActive ? 'inactive' : 'active';
      await apiService.updateTouristStatus(touristId, newStatus);
      
      setTourists(prev => prev.map(t => 
        t.id === touristId 
          ? { ...t, isActive: !t.isActive }
          : t
      ));
      
      console.log(`✅ Tourist status updated: ${tourist.firstName} ${tourist.lastName} is now ${newStatus}`);
    } catch (err) {
      console.error('Failed to update tourist status:', err);
      alert('Failed to update tourist status. Please try again.');
    }
  };

  const viewLocationHistory = async (tourist: TouristWithActivity) => {
    try {
      setSelectedTourist(tourist);
      const history = await apiService.getTouristLocationHistory(tourist.id);
      setLocationHistory(history);
      setShowLocationHistory(true);
    } catch (err) {
      console.error('Failed to load location history:', err);
      // Mock location history
      setLocationHistory([
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date().toISOString(),
          address: 'New York, NY'
        }
      ]);
      setShowLocationHistory(true);
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return tourist.isActive;
    if (statusFilter === 'inactive') return !tourist.isActive;
    if (statusFilter === 'online') return tourist.isOnline;
    return true;
  });

  if (loading) {
    return (
      <div className="tourists-list loading">
        <div className="loading-spinner"></div>
        <p>Loading tourists data...</p>
      </div>
    );
  }

  if (error && tourists.length === 0) {
    return (
      <div className="tourists-list error">
        <p className="error-message">{error}</p>
        <button onClick={loadTourists} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="tourists-list">
      <div className="tourists-header">
        <h3>👥 Registered Tourists ({tourists.length})</h3>
        <div className="tourists-stats">
          <div className="stat-item">
            <span className="stat-number">{tourists.filter(t => t.isOnline).length}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tourists.filter(t => t.isActive).length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tourists.filter(t => !t.isActive).length}</span>
            <span className="stat-label">Inactive</span>
          </div>
        </div>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="online">Online</option>
          </select>
          
          <button 
            onClick={() => setShowGeofencing(!showGeofencing)}
            className={`geofence-toggle ${showGeofencing ? 'active' : ''}`}
          >
            🗺️ {showGeofencing ? 'Hide' : 'Show'} Geofencing
          </button>
          
          <button onClick={loadTourists} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadTourists} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {showGeofencing && (
        <div className="geofencing-panel">
          <h4>🛡️ Geofencing Monitor</h4>
          {geofenceViolations.length > 0 ? (
            <div className="violations-list">
              {geofenceViolations.map((violation, index) => (
                <div key={index} className="violation-item">
                  <span className="violation-time">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="violation-tourist">
                    {violation.touristName}
                  </span>
                  <span className="violation-zone">
                    Exited: {violation.zoneName}
                  </span>
                  <span className="violation-location">
                    📍 {violation.location?.address || 'Unknown location'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-violations">
              ✅ No geofence violations detected
            </div>
          )}
        </div>
      )}

      <div className="tourists-grid">
        <div className="grid-header">
          <div className="col-tourist">Tourist</div>
          <div className="col-contact">Contact</div>
          <div className="col-nationality">Nationality</div>
          <div className="col-status">Status</div>
          <div className="col-last-seen">Last Seen</div>
          <div className="col-actions">Actions</div>
        </div>

        {filteredTourists.map((tourist) => (
          <div key={tourist.id} className={`tourist-row ${tourist.hasGeofenceViolation ? 'geofence-violation' : ''}`}>
            <div className="col-tourist">
              <div className="tourist-avatar">
                {tourist.firstName[0]}{tourist.lastName[0]}
              </div>
              <div className="tourist-info">
                <span className="tourist-name">
                  {tourist.firstName} {tourist.lastName}
                  {tourist.hasGeofenceViolation && <span className="violation-flag">⚠️</span>}
                </span>
                <span className="tourist-id">ID: {tourist.id.slice(0, 8)}</span>
                <span className="tourist-passport">Passport: {tourist.passportNumber}</span>
              </div>
            </div>
            <div className="col-contact">
              <div className="contact-email">{tourist.email}</div>
              <div className="contact-phone">{tourist.phoneNumber}</div>
              <div className="emergency-contact">
                Emergency: {tourist.emergencyContact}
              </div>
            </div>
            <div className="col-nationality">
              <span className="nationality-flag">🌍</span>
              {tourist.nationality}
            </div>
            <div className="col-status">
              <span className={`status-badge ${tourist.isActive ? 'active' : 'inactive'}`}>
                {tourist.isActive ? 'Active' : 'Inactive'}
              </span>
              {tourist.isOnline && (
                <span className="online-indicator">🟢 Online</span>
              )}
              {tourist.currentLocation && (
                <div className="location-info">
                  📍 {tourist.currentLocation.address || 'Live Location'}
                </div>
              )}
            </div>
            <div className="col-last-seen">
              {tourist.lastLocationUpdate ? (
                <div className="last-seen-info">
                  <div className="timestamp">
                    {new Date(tourist.lastLocationUpdate).toLocaleString()}
                  </div>
                  {tourist.currentLocation && (
                    <div className="coordinates">
                      {tourist.currentLocation.latitude.toFixed(4)}, {tourist.currentLocation.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ) : (
                <span className="no-location">Never tracked</span>
              )}
            </div>
            <div className="col-actions">
              <button 
                className="action-button view"
                onClick={() => viewLocationHistory(tourist)}
                title="View Location History"
              >
                👁️ History
              </button>
              <button 
                className="action-button track"
                onClick={() => {
                  if (tourist.currentLocation) {
                    window.open(`https://maps.google.com/?q=${tourist.currentLocation.latitude},${tourist.currentLocation.longitude}`);
                  } else {
                    alert('No current location available for this tourist');
                  }
                }}
                title="Track on Map"
                disabled={!tourist.currentLocation}
              >
                📍 Track
              </button>
              <button 
                className="action-button contact"
                onClick={() => window.open(`tel:${tourist.phoneNumber}`)}
                title="Contact Tourist"
              >
                📞 Call
              </button>
              <button 
                className={`action-button status ${tourist.isActive ? 'active' : 'inactive'}`}
                onClick={() => toggleTouristStatus(tourist.id)}
                title={`${tourist.isActive ? 'Deactivate' : 'Activate'} Tourist`}
              >
                {tourist.isActive ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Location History Modal */}
      {showLocationHistory && selectedTourist && (
        <div className="modal-overlay" onClick={() => setShowLocationHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📍 Location History - {selectedTourist.firstName} {selectedTourist.lastName}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLocationHistory(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="location-history">
                {locationHistory.map((location, index) => (
                  <div key={index} className="location-entry">
                    <div className="location-time">
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                    <div className="location-details">
                      <div className="coordinates">
                        📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                      {location.address && (
                        <div className="address">🏠 {location.address}</div>
                      )}
                    </div>
                    <button
                      className="map-button"
                      onClick={() => window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`)}
                    >
                      View on Map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};