import React, { useEffect, useState } from 'react';

interface TouristMonitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  passportNumber?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  riskScore: number;
  activityStatus: 'ACTIVE' | 'INACTIVE' | 'MISSING' | 'EMERGENCY';
  lastSeen: string;
  itinerary?: Array<{
    place: string;
    plannedTime: string;
    visitedTime?: string;
    status: 'PLANNED' | 'VISITED' | 'SKIPPED' | 'DELAYED';
  }>;
  safetyAlerts: number;
  currentZone?: {
    name: string;
    type: 'SAFE_ZONE' | 'SENSITIVE_ZONE' | 'RESTRICTED_ZONE' | 'HIGH_RISK_ZONE';
    riskLevel: number;
  };
  behaviorPatterns: {
    nightMovement: number;
    isolatedAreaVisits: number;
    missedCheckIns: number;
    itineraryDeviation: number;
  };
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  devices: Array<{
    type: string;
    batteryLevel: number;
    lastSync: string;
    isActive: boolean;
  }>;
}

export const TouristMonitoring: React.FC = () => {
  const [tourists, setTourists] = useState<TouristMonitor[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<TouristMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    nationality: 'ALL',
    riskLevel: 'ALL',
    activityStatus: 'ALL',
    zone: 'ALL',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'lastSeen' | 'alerts'>('risk');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  useEffect(() => {
    loadTouristData();
  }, []);

  const loadTouristData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive tourist monitoring data
      const mockTourists: TouristMonitor[] = [
        {
          id: '1',
          firstName: 'Rahul',
          lastName: 'Sharma',
          email: 'rahul@example.com',
          phoneNumber: '+91-9876543210',
          nationality: 'Indian',
          passportNumber: 'A12345678',
          currentLocation: {
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'India Gate, New Delhi',
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          riskScore: 8.5,
          activityStatus: 'EMERGENCY',
          lastSeen: new Date(Date.now() - 300000).toISOString(),
          itinerary: [
            {
              place: 'Red Fort',
              plannedTime: new Date(Date.now() - 7200000).toISOString(),
              visitedTime: new Date(Date.now() - 7200000).toISOString(),
              status: 'VISITED'
            },
            {
              place: 'India Gate',
              plannedTime: new Date(Date.now() - 3600000).toISOString(),
              visitedTime: new Date(Date.now() - 3600000).toISOString(),
              status: 'VISITED'
            },
            {
              place: 'Connaught Place',
              plannedTime: new Date().toISOString(),
              status: 'PLANNED'
            }
          ],
          safetyAlerts: 3,
          currentZone: {
            name: 'India Gate Safe Zone',
            type: 'SAFE_ZONE',
            riskLevel: 2
          },
          behaviorPatterns: {
            nightMovement: 2,
            isolatedAreaVisits: 1,
            missedCheckIns: 0,
            itineraryDeviation: 1
          },
          emergencyContacts: [
            { name: 'Priya Sharma', phone: '+91-9876543211', relation: 'Wife' },
            { name: 'Dr. Kumar', phone: '+91-9876543212', relation: 'Family Doctor' }
          ],
          devices: [
            { type: 'Smartphone', batteryLevel: 35, lastSync: new Date(Date.now() - 300000).toISOString(), isActive: true },
            { type: 'Smartwatch', batteryLevel: 60, lastSync: new Date(Date.now() - 600000).toISOString(), isActive: true }
          ]
        },
        {
          id: '2',
          firstName: 'Priya',
          lastName: 'Patel',
          email: 'priya@example.com',
          phoneNumber: '+91-9876543221',
          nationality: 'Indian',
          currentLocation: {
            latitude: 28.6506,
            longitude: 77.2334,
            address: 'Chandni Chowk, Delhi',
            timestamp: new Date(Date.now() - 1800000).toISOString()
          },
          riskScore: 6.2,
          activityStatus: 'ACTIVE',
          lastSeen: new Date(Date.now() - 1800000).toISOString(),
          itinerary: [
            {
              place: 'Jama Masjid',
              plannedTime: new Date(Date.now() - 3600000).toISOString(),
              visitedTime: new Date(Date.now() - 3600000).toISOString(),
              status: 'VISITED'
            },
            {
              place: 'Chandni Chowk Market',
              plannedTime: new Date(Date.now() - 1800000).toISOString(),
              status: 'DELAYED'
            }
          ],
          safetyAlerts: 1,
          currentZone: {
            name: 'Old Delhi Market',
            type: 'HIGH_RISK_ZONE',
            riskLevel: 5
          },
          behaviorPatterns: {
            nightMovement: 0,
            isolatedAreaVisits: 3,
            missedCheckIns: 1,
            itineraryDeviation: 2
          },
          emergencyContacts: [
            { name: 'Amit Patel', phone: '+91-9876543222', relation: 'Brother' }
          ],
          devices: [
            { type: 'Smartphone', batteryLevel: 80, lastSync: new Date(Date.now() - 1800000).toISOString(), isActive: true }
          ]
        },
        {
          id: '3',
          firstName: 'David',
          lastName: 'Johnson',
          email: 'david@example.com',
          phoneNumber: '+1-555-0123',
          nationality: 'American',
          passportNumber: 'US123456789',
          currentLocation: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Khan Market, New Delhi',
            timestamp: new Date(Date.now() - 900000).toISOString()
          },
          riskScore: 3.1,
          activityStatus: 'ACTIVE',
          lastSeen: new Date(Date.now() - 900000).toISOString(),
          itinerary: [
            {
              place: 'Khan Market',
              plannedTime: new Date(Date.now() - 1800000).toISOString(),
              visitedTime: new Date(Date.now() - 1800000).toISOString(),
              status: 'VISITED'
            },
            {
              place: 'Lodhi Gardens',
              plannedTime: new Date(Date.now() + 1800000).toISOString(),
              status: 'PLANNED'
            }
          ],
          safetyAlerts: 0,
          currentZone: {
            name: 'Khan Market Shopping Area',
            type: 'SAFE_ZONE',
            riskLevel: 1
          },
          behaviorPatterns: {
            nightMovement: 0,
            isolatedAreaVisits: 0,
            missedCheckIns: 0,
            itineraryDeviation: 0
          },
          emergencyContacts: [
            { name: 'Sarah Johnson', phone: '+1-555-0124', relation: 'Wife' },
            { name: 'US Embassy Delhi', phone: '+91-11-2419-8000', relation: 'Embassy' }
          ],
          devices: [
            { type: 'Smartphone', batteryLevel: 95, lastSync: new Date(Date.now() - 900000).toISOString(), isActive: true },
            { type: 'GPS Tracker', batteryLevel: 45, lastSync: new Date(Date.now() - 1200000).toISOString(), isActive: true }
          ]
        }
      ];
      
      setTourists(mockTourists);
    } catch (err: any) {
      setError('Failed to load tourist monitoring data');
      console.error('Tourist monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 3) return '#4CAF50';
    if (score <= 6) return '#FF9800';
    if (score <= 8) return '#F44336';
    return '#9C27B0';
  };

  const getActivityStatusColor = (status: TouristMonitor['activityStatus']) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'INACTIVE': return '#FF9800';
      case 'MISSING': return '#F44336';
      case 'EMERGENCY': return '#9C27B0';
      default: return '#757575';
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesNationality = filters.nationality === 'ALL' || tourist.nationality === filters.nationality;
    const matchesRiskLevel = filters.riskLevel === 'ALL' || 
      (filters.riskLevel === 'LOW' && tourist.riskScore <= 3) ||
      (filters.riskLevel === 'MEDIUM' && tourist.riskScore > 3 && tourist.riskScore <= 6) ||
      (filters.riskLevel === 'HIGH' && tourist.riskScore > 6 && tourist.riskScore <= 8) ||
      (filters.riskLevel === 'CRITICAL' && tourist.riskScore > 8);
    const matchesActivity = filters.activityStatus === 'ALL' || tourist.activityStatus === filters.activityStatus;
    const matchesZone = filters.zone === 'ALL' || tourist.currentZone?.type === filters.zone;
    const matchesSearch = filters.search === '' || 
      `${tourist.firstName} ${tourist.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      tourist.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      tourist.phoneNumber.includes(filters.search);
    
    return matchesNationality && matchesRiskLevel && matchesActivity && matchesZone && matchesSearch;
  });

  const sortedTourists = [...filteredTourists].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'risk':
        return b.riskScore - a.riskScore;
      case 'lastSeen':
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      case 'alerts':
        return b.safetyAlerts - a.safetyAlerts;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="tourist-monitoring">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading tourist monitoring system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tourist-monitoring">
      <div className="monitoring-header">
        <h2>🎯 Live Tourist Monitoring Dashboard</h2>
        <p>Real-time monitoring of tourist activities, risk assessment, and behavioral analysis</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="monitoring-controls">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search tourists..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="search-input"
          />
          
          <select
            value={filters.nationality}
            onChange={(e) => setFilters({...filters, nationality: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All Nationalities</option>
            <option value="Indian">Indian</option>
            <option value="American">American</option>
            <option value="British">British</option>
            <option value="German">German</option>
            <option value="French">French</option>
          </select>

          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk (≤3)</option>
            <option value="MEDIUM">Medium Risk (3-6)</option>
            <option value="HIGH">High Risk (6-8)</option>
            <option value="CRITICAL">Critical Risk (&gt;8)</option>
          </select>

          <select
            value={filters.activityStatus}
            onChange={(e) => setFilters({...filters, activityStatus: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MISSING">Missing</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          <select
            value={filters.zone}
            onChange={(e) => setFilters({...filters, zone: e.target.value})}
            className="filter-select"
          >
            <option value="ALL">All Zones</option>
            <option value="SAFE_ZONE">Safe Zones</option>
            <option value="SENSITIVE_ZONE">Sensitive Zones</option>
            <option value="RESTRICTED_ZONE">Restricted Zones</option>
            <option value="HIGH_RISK_ZONE">High Risk Zones</option>
          </select>
        </div>

        <div className="view-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="risk">Sort by Risk Score</option>
            <option value="name">Sort by Name</option>
            <option value="lastSeen">Sort by Last Seen</option>
            <option value="alerts">Sort by Alerts</option>
          </select>

          <div className="view-mode-buttons">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⚏ Grid
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ List
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </div>

      <div className="monitoring-stats">
        <div className="stats-cards">
          <div className="stat-card">
            <h4>Total Tourists</h4>
            <span className="stat-value">{tourists.length}</span>
          </div>
          <div className="stat-card">
            <h4>Active</h4>
            <span className="stat-value">{tourists.filter(t => t.activityStatus === 'ACTIVE').length}</span>
          </div>
          <div className="stat-card">
            <h4>High Risk</h4>
            <span className="stat-value">{tourists.filter(t => t.riskScore > 6).length}</span>
          </div>
          <div className="stat-card">
            <h4>Emergency</h4>
            <span className="stat-value">{tourists.filter(t => t.activityStatus === 'EMERGENCY').length}</span>
          </div>
        </div>
      </div>

      <div className="monitoring-content">
        {viewMode === 'grid' && (
          <div className="tourists-grid">
            {sortedTourists.map(tourist => (
              <div 
                key={tourist.id}
                className={`tourist-card ${selectedTourist?.id === tourist.id ? 'selected' : ''}`}
                onClick={() => setSelectedTourist(tourist)}
              >
                <div className="tourist-header">
                  <div className="tourist-name">
                    <h4>{tourist.firstName} {tourist.lastName}</h4>
                    <span className="nationality">{tourist.nationality}</span>
                  </div>
                  <div className="tourist-badges">
                    <span 
                      className="risk-score-badge"
                      style={{ backgroundColor: getRiskScoreColor(tourist.riskScore) }}
                    >
                      Risk: {tourist.riskScore.toFixed(1)}
                    </span>
                    <span 
                      className="activity-status-badge"
                      style={{ backgroundColor: getActivityStatusColor(tourist.activityStatus) }}
                    >
                      {tourist.activityStatus}
                    </span>
                  </div>
                </div>

                <div className="tourist-location">
                  <p><strong>Current Location:</strong></p>
                  <p>{tourist.currentLocation?.address || 'Location unknown'}</p>
                  <p className="last-seen">
                    Last seen: {new Date(tourist.lastSeen).toLocaleString()}
                  </p>
                </div>

                <div className="tourist-zone">
                  {tourist.currentZone && (
                    <div className="zone-info">
                      <span className="zone-name">{tourist.currentZone.name}</span>
                      <span className={`zone-type ${tourist.currentZone.type.toLowerCase()}`}>
                        {tourist.currentZone.type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="tourist-alerts">
                  <div className="alerts-count">
                    🚨 {tourist.safetyAlerts} Safety Alerts
                  </div>
                  <div className="device-status">
                    {tourist.devices.map((device, index) => (
                      <span key={index} className="device-badge">
                        {device.type}: {device.batteryLevel}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="behavior-indicators">
                  <div className="behavior-item">
                    <span>🌙 Night Movement: {tourist.behaviorPatterns.nightMovement}</span>
                  </div>
                  <div className="behavior-item">
                    <span>🏚️ Isolated Areas: {tourist.behaviorPatterns.isolatedAreaVisits}</span>
                  </div>
                  <div className="behavior-item">
                    <span>📍 Missed Check-ins: {tourist.behaviorPatterns.missedCheckIns}</span>
                  </div>
                  <div className="behavior-item">
                    <span>🛣️ Route Deviations: {tourist.behaviorPatterns.itineraryDeviation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="tourists-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Nationality</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Last Seen</th>
                  <th>Alerts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTourists.map(tourist => (
                  <tr key={tourist.id} onClick={() => setSelectedTourist(tourist)}>
                    <td>{tourist.firstName} {tourist.lastName}</td>
                    <td>{tourist.nationality}</td>
                    <td>
                      <span 
                        className="risk-score"
                        style={{ color: getRiskScoreColor(tourist.riskScore) }}
                      >
                        {tourist.riskScore.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getActivityStatusColor(tourist.activityStatus) }}
                      >
                        {tourist.activityStatus}
                      </span>
                    </td>
                    <td>{tourist.currentLocation?.address || 'Unknown'}</td>
                    <td>{new Date(tourist.lastSeen).toLocaleString()}</td>
                    <td>{tourist.safetyAlerts}</td>
                    <td>
                      <button className="action-btn">📞 Contact</button>
                      <button className="action-btn">🚨 Alert</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'map' && (
          <div className="tourists-map">
            <div className="map-container" style={{ height: '600px', backgroundColor: '#f0f0f0' }}>
              <div className="map-placeholder">
                <p>🗺️ Interactive Map View</p>
                <p>Real-time tourist locations with risk indicators</p>
                <div className="map-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                    Low Risk
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
                    Medium Risk
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
                    High Risk
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#9C27B0' }}></span>
                    Critical Risk
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTourist && (
        <div className="tourist-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTourist.firstName} {selectedTourist.lastName} - Detailed Profile</h3>
              <button onClick={() => setSelectedTourist(null)} className="close-modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="details-section">
                  <h4>Personal Information</h4>
                  <p><strong>Email:</strong> {selectedTourist.email}</p>
                  <p><strong>Phone:</strong> {selectedTourist.phoneNumber}</p>
                  <p><strong>Nationality:</strong> {selectedTourist.nationality}</p>
                  <p><strong>Passport:</strong> {selectedTourist.passportNumber}</p>
                </div>

                <div className="details-section">
                  <h4>Current Status</h4>
                  <p><strong>Risk Score:</strong> 
                    <span style={{ color: getRiskScoreColor(selectedTourist.riskScore) }}>
                      {selectedTourist.riskScore.toFixed(1)}/10
                    </span>
                  </p>
                  <p><strong>Activity:</strong> {selectedTourist.activityStatus}</p>
                  <p><strong>Safety Alerts:</strong> {selectedTourist.safetyAlerts}</p>
                  <p><strong>Last Seen:</strong> {new Date(selectedTourist.lastSeen).toLocaleString()}</p>
                </div>

                <div className="details-section">
                  <h4>Location Details</h4>
                  {selectedTourist.currentLocation && (
                    <>
                      <p><strong>Address:</strong> {selectedTourist.currentLocation.address}</p>
                      <p><strong>Coordinates:</strong> {selectedTourist.currentLocation.latitude}, {selectedTourist.currentLocation.longitude}</p>
                      <p><strong>Updated:</strong> {new Date(selectedTourist.currentLocation.timestamp).toLocaleString()}</p>
                    </>
                  )}
                  {selectedTourist.currentZone && (
                    <>
                      <p><strong>Current Zone:</strong> {selectedTourist.currentZone.name}</p>
                      <p><strong>Zone Type:</strong> {selectedTourist.currentZone.type.replace('_', ' ')}</p>
                      <p><strong>Zone Risk:</strong> {selectedTourist.currentZone.riskLevel}/5</p>
                    </>
                  )}
                </div>

                <div className="details-section">
                  <h4>Travel Itinerary</h4>
                  {selectedTourist.itinerary?.map((item, index) => (
                    <div key={index} className="itinerary-item">
                      <span className={`status-indicator ${item.status.toLowerCase()}`}></span>
                      <div>
                        <strong>{item.place}</strong>
                        <p>Planned: {new Date(item.plannedTime).toLocaleString()}</p>
                        {item.visitedTime && (
                          <p>Visited: {new Date(item.visitedTime).toLocaleString()}</p>
                        )}
                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="details-section">
                  <h4>Behavior Analysis</h4>
                  <div className="behavior-grid">
                    <div className="behavior-metric">
                      <span className="metric-label">Night Movement</span>
                      <span className="metric-value">{selectedTourist.behaviorPatterns.nightMovement}</span>
                    </div>
                    <div className="behavior-metric">
                      <span className="metric-label">Isolated Area Visits</span>
                      <span className="metric-value">{selectedTourist.behaviorPatterns.isolatedAreaVisits}</span>
                    </div>
                    <div className="behavior-metric">
                      <span className="metric-label">Missed Check-ins</span>
                      <span className="metric-value">{selectedTourist.behaviorPatterns.missedCheckIns}</span>
                    </div>
                    <div className="behavior-metric">
                      <span className="metric-label">Itinerary Deviations</span>
                      <span className="metric-value">{selectedTourist.behaviorPatterns.itineraryDeviation}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>Emergency Contacts</h4>
                  {selectedTourist.emergencyContacts.map((contact, index) => (
                    <div key={index} className="contact-item">
                      <p><strong>{contact.name}</strong> ({contact.relation})</p>
                      <p>{contact.phone}</p>
                    </div>
                  ))}
                </div>

                <div className="details-section">
                  <h4>Connected Devices</h4>
                  {selectedTourist.devices.map((device, index) => (
                    <div key={index} className="device-item">
                      <div className="device-info">
                        <strong>{device.type}</strong>
                        <span className={`device-status ${device.isActive ? 'active' : 'inactive'}`}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="device-details">
                        <span>Battery: {device.batteryLevel}%</span>
                        <span>Last Sync: {new Date(device.lastSync).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="action-btn primary">📞 Call Tourist</button>
              <button className="action-btn">📱 Send SMS</button>
              <button className="action-btn">🚨 Send Alert</button>
              <button className="action-btn">👮 Assign Officer</button>
              <button className="action-btn danger">🚨 Emergency Response</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
