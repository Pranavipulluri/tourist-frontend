import React, { useEffect, useState } from 'react';
import { Location, Tourist } from '../../services/api';
import { hybridApiService } from '../../services/hybrid-api';
import './TouristsList.css';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTourists();
    
    // Setup real-time listeners
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
      setGeofenceViolations(prev => [data, ...prev.slice(0, 9)]);
      
      setTourists(prev => prev.map(tourist => 
        tourist.id === data.touristId 
          ? { ...tourist, hasGeofenceViolation: true }
          : tourist
      ));
    };

    // Mock real-time events setup
    const mockSetupRealTimeEvents = () => {
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
    
    return cleanup;
  }, [tourists.length]);

  const loadTourists = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading tourist data...');
      const touristsData = await hybridApiService.getAllTourists();
      console.log('📊 Received tourists data:', touristsData);
      
      if (!touristsData || touristsData.length === 0) {
        console.log('⚠️ No tourists found in database');
        setError('No registered tourists found. Make sure users are registered with TOURIST role.');
        setTourists([]);
        return;
      }
      
      // Enhance tourists with real-time activity data
      const enhancedTourists = await Promise.all(
        touristsData.map(async (tourist) => {
          try {
            const locationHistory = await hybridApiService.getLocationHistory(tourist.id);
            const latestLocation = locationHistory.locations[0];
            
            const isOnline = latestLocation 
              ? (Date.now() - new Date(latestLocation.timestamp).getTime()) < 10 * 60 * 1000
              : false;
            
            console.log(`👤 Enhanced tourist: ${tourist.firstName} ${tourist.lastName} - Online: ${isOnline}`);
            
            return {
              ...tourist,
              isActive: true,
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
      setError(`Failed to load tourists: ${err.message || 'Network error'}. Check if backend is running.`);
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
      await hybridApiService.updateTouristStatus(touristId, newStatus);
      
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
      const history = await hybridApiService.getLocationHistory(tourist.id);
      setLocationHistory(history.locations);
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

  const handleRetry = () => {
    setError('');
    loadTourists();
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesStatus = (() => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return tourist.isActive;
      if (statusFilter === 'inactive') return !tourist.isActive;
      if (statusFilter === 'online') return tourist.isOnline;
      return true;
    })();

    const matchesSearch = searchQuery === '' || 
      `${tourist.firstName} ${tourist.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.phoneNumber.includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="tourists-list-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading tourists data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tourists-list-container">
      {/* Header */}
      <div className="tourists-header">
        <div className="header-content">
          <div className="header-title">
            <h2>Registered Tourists</h2>
            <p className="header-subtitle">Manage and monitor tourist activities</p>
          </div>
          
          {/* Stats */}
          <div className="tourists-stats">
            <div className="stat-item">
              <div className="stat-number">{tourists.filter(t => t.isOnline).length}</div>
              <div className="stat-label">Online</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{tourists.filter(t => t.isActive).length}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{tourists.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
          <button className="retry-button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="tourists-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search tourists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="online">Online</option>
          </select>
          
          <button 
            onClick={() => setShowGeofencing(!showGeofencing)}
            className={`control-button ${showGeofencing ? 'active' : ''}`}
          >
            <span>🗺️</span>
            {showGeofencing ? 'Hide' : 'Show'} Geofencing
          </button>
          
          <button onClick={loadTourists} className="control-button">
            <span>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Geofencing Panel */}
      {showGeofencing && (
        <div className="geofencing-panel">
          <div className="panel-header">
            <h3>🛡️ Geofencing Monitor</h3>
          </div>
          <div className="panel-content">
            {geofenceViolations.length > 0 ? (
              <div className="violations-list">
                {geofenceViolations.map((violation, index) => (
                  <div key={index} className="violation-item">
                    <div className="violation-time">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="violation-details">
                      <div className="violation-tourist">{violation.touristName}</div>
                      <div className="violation-zone">Exited: {violation.zoneName}</div>
                      <div className="violation-location">
                        📍 {violation.location?.address || 'Unknown location'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-violations">
                <span className="success-icon">✅</span>
                <p>No geofence violations detected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tourists Grid */}
      <div className="tourists-grid">
        {filteredTourists.map((tourist) => (
          <div 
            key={tourist.id} 
            className={`tourist-card ${tourist.hasGeofenceViolation ? 'has-violation' : ''}`}
          >
            {/* Tourist Header */}
            <div className="tourist-header">
              <div className="tourist-avatar">
                <div className="avatar-circle">
                  {tourist.firstName[0]}{tourist.lastName[0]}
                </div>
                <div className="status-indicators">
                  {tourist.isOnline && <div className="online-indicator" title="Online" />}
                  {tourist.hasGeofenceViolation && <div className="violation-indicator" title="Geofence Violation">⚠️</div>}
                </div>
              </div>
              <div className="tourist-info">
                <h4 className="tourist-name">
                  {tourist.firstName} {tourist.lastName}
                </h4>
                <p className="tourist-nationality">{tourist.nationality}</p>
                <div className="tourist-badges">
                  <span className={`status-badge ${tourist.isActive ? 'active' : 'inactive'}`}>
                    {tourist.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {tourist.isOnline && (
                    <span className="online-badge">Online</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="contact-section">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-value">{tourist.email}</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span className="contact-value">{tourist.phoneNumber}</span>
              </div>
              {tourist.emergencyContact && (
                <div className="contact-item emergency">
                  <span className="contact-icon">🚨</span>
                  <span className="contact-value">Emergency: {tourist.emergencyContact}</span>
                </div>
              )}
            </div>

            {/* Location Info */}
            <div className="location-section">
              {tourist.currentLocation ? (
                <div className="location-info">
                  <div className="location-header">
                    <span className="location-icon">📍</span>
                    <span className="location-label">Current Location</span>
                  </div>
                  <p className="location-address">
                    {tourist.currentLocation.address || 'Live Location'}
                  </p>
                  <div className="location-coordinates">
                    {tourist.currentLocation.latitude.toFixed(4)}, {tourist.currentLocation.longitude.toFixed(4)}
                  </div>
                </div>
              ) : (
                <div className="no-location">
                  <span className="location-icon">📍</span>
                  <span>Location not available</span>
                </div>
              )}

              {tourist.lastLocationUpdate && (
                <div className="last-seen">
                  Last seen: {new Date(tourist.lastLocationUpdate).toLocaleString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="tourist-actions">
              <button 
                className="action-button primary"
                onClick={() => viewLocationHistory(tourist)}
                title="View Location History"
              >
                <span>👁️</span>
                History
              </button>
              <button 
                className="action-button secondary"
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
                <span>📍</span>
                Track
              </button>
              <button 
                className="action-button secondary"
                onClick={() => window.open(`tel:${tourist.phoneNumber}`)}
                title="Contact Tourist"
              >
                <span>📞</span>
                Call
              </button>
              <button 
                className={`action-button ${tourist.isActive ? 'danger' : 'success'}`}
                onClick={() => toggleTouristStatus(tourist.id)}
                title={`${tourist.isActive ? 'Deactivate' : 'Activate'} Tourist`}
              >
                <span>{tourist.isActive ? '⏸️' : '▶️'}</span>
                {tourist.isActive ? 'Pause' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTourists.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No tourists found</h3>
          <p>
            {searchQuery 
              ? 'No tourists match your search criteria.' 
              : 'No registered tourists available.'
            }
          </p>
          {searchQuery && (
            <button 
              className="action-button primary"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Location History Modal */}
      {showLocationHistory && selectedTourist && (
        <div className="modal-overlay" onClick={() => setShowLocationHistory(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Location History - {selectedTourist.firstName} {selectedTourist.lastName}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLocationHistory(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="location-history">
                {locationHistory.map((location, index) => (
                  <div key={index} className="history-entry">
                    <div className="history-time">
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                    <div className="history-details">
                      <div className="history-coordinates">
                        📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                      {location.address && (
                        <div className="history-address">🏠 {location.address}</div>
                      )}
                    </div>
                    <button
                      className="history-map-button"
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