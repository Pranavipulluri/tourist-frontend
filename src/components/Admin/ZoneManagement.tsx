import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';

interface Zone {
  id: string;
  name: string;
  type: 'SAFE_ZONE' | 'SENSITIVE_ZONE' | 'RESTRICTED_ZONE' | 'HIGH_RISK_ZONE';
  coordinates: { latitude: number; longitude: number }[];
  radius: number;
  alertMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  riskLevel: number;
  lastIncident?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    reason: string;
    officer: string;
  }>;
}

interface ZoneAlert {
  id: string;
  zoneId: string;
  touristId: string;
  type: 'ENTRY' | 'EXIT' | 'VIOLATION';
  timestamp: string;
  resolved: boolean;
}

export const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'zones' | 'alerts' | 'history'>('zones');
  const [zoneAlerts, setZoneAlerts] = useState<ZoneAlert[]>([]);
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'SAFE_ZONE' as Zone['type'],
    coordinates: [] as { latitude: number; longitude: number }[],
    radius: 100,
    alertMessage: '',
    riskLevel: 1
  });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadZones();
    loadZoneAlerts();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      // Mock zones data for now - replace with actual API call when backend endpoint is ready
      const mockZones: Zone[] = [
        {
          id: '1',
          name: 'India Gate Safe Zone',
          type: 'SAFE_ZONE',
          coordinates: [
            { latitude: 28.6129, longitude: 77.2295 },
            { latitude: 28.6139, longitude: 77.2305 },
            { latitude: 28.6149, longitude: 77.2295 },
            { latitude: 28.6139, longitude: 77.2285 }
          ],
          radius: 500,
          alertMessage: 'You are in a safe zone with security presence',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          riskLevel: 1,
          statusHistory: [
            {
              status: 'CREATED',
              timestamp: new Date().toISOString(),
              reason: 'Tourist safety zone established',
              officer: 'Officer Kumar'
            }
          ]
        },
        {
          id: '2',
          name: 'Old Delhi Market - High Risk',
          type: 'HIGH_RISK_ZONE',
          coordinates: [
            { latitude: 28.6506, longitude: 77.2334 },
            { latitude: 28.6516, longitude: 77.2344 },
            { latitude: 28.6526, longitude: 77.2334 },
            { latitude: 28.6516, longitude: 77.2324 }
          ],
          radius: 200,
          alertMessage: 'High crime area - stay alert and avoid isolated areas',
          isActive: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          riskLevel: 5,
          lastIncident: 'Pickpocket incident reported 2 hours ago',
          statusHistory: [
            {
              status: 'CREATED',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              reason: 'High crime rate area identified',
              officer: 'Officer Singh'
            },
            {
              status: 'RISK_ELEVATED',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              reason: 'Recent incident reported',
              officer: 'Officer Patel'
            }
          ]
        }
      ];
      setZones(mockZones);
    } catch (err: any) {
      setError('Failed to load zones');
      console.error('Zone loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadZoneAlerts = async () => {
    try {
      // Mock zone alerts data
      const mockAlerts: ZoneAlert[] = [
        {
          id: '1',
          zoneId: 'zone1',
          touristId: 'tourist1',
          type: 'ENTRY',
          timestamp: new Date().toISOString(),
          resolved: false
        },
        {
          id: '2',
          zoneId: 'zone2',
          touristId: 'tourist2',
          type: 'VIOLATION',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: true
        }
      ];
      setZoneAlerts(mockAlerts);
    } catch (err) {
      console.error('Failed to load zone alerts:', err);
    }
  };

  const createZone = async () => {
    try {
      if (!newZone.name || newZone.coordinates.length === 0) {
        setError('Please provide zone name and draw coordinates on map');
        return;
      }

      const zoneData = {
        ...newZone,
        isActive: true,
        statusHistory: [{
          status: 'CREATED',
          timestamp: new Date().toISOString(),
          reason: 'Initial zone creation',
          officer: 'Admin User'
        }]
      };

      const response = await apiService.createZone(zoneData);
      setZones([...zones, response]);
      setIsCreating(false);
      setNewZone({
        name: '',
        type: 'SAFE_ZONE',
        coordinates: [],
        radius: 100,
        alertMessage: '',
        riskLevel: 1
      });
    } catch (err: any) {
      setError('Failed to create zone');
      console.error('Zone creation error:', err);
    }
  };

  const updateZoneStatus = async (zoneId: string, status: string, reason: string) => {
    try {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;

      const updatedZone = {
        ...zone,
        statusHistory: [
          ...zone.statusHistory,
          {
            status,
            timestamp: new Date().toISOString(),
            reason,
            officer: 'Admin User'
          }
        ]
      };

      await apiService.updateZone(zoneId, updatedZone);
      setZones(zones.map(z => z.id === zoneId ? updatedZone : z));
    } catch (err) {
      setError('Failed to update zone status');
      console.error('Zone update error:', err);
    }
  };

  const deleteZone = async (zoneId: string) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;

    try {
      await apiService.deleteZone(zoneId);
      setZones(zones.filter(z => z.id !== zoneId));
      setSelectedZone(null);
    } catch (err) {
      setError('Failed to delete zone');
      console.error('Zone deletion error:', err);
    }
  };

  const getZoneTypeColor = (type: Zone['type']) => {
    switch (type) {
      case 'SAFE_ZONE': return '#4CAF50';
      case 'SENSITIVE_ZONE': return '#FF9800';
      case 'RESTRICTED_ZONE': return '#F44336';
      case 'HIGH_RISK_ZONE': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getRiskLevelBadge = (level: number) => {
    if (level <= 2) return <span className="risk-badge low">Low Risk</span>;
    if (level <= 4) return <span className="risk-badge medium">Medium Risk</span>;
    return <span className="risk-badge high">High Risk</span>;
  };

  if (loading) {
    return (
      <div className="zone-management">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading zone management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zone-management">
      <div className="zone-header">
        <h2>🗺️ Zone Management System</h2>
        <p>Define and manage safety zones with real-time monitoring</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="zone-tabs">
        <button
          className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          🗺️ Zone Map
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Zone Alerts ({zoneAlerts.filter(a => !a.resolved).length})
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Status History
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="zones-content">
          <div className="zones-sidebar">
            <div className="zones-actions">
              <button 
                className="create-zone-btn"
                onClick={() => setIsCreating(true)}
              >
                ➕ Create New Zone
              </button>
            </div>

            <div className="zones-list">
              <h3>Active Zones ({zones.length})</h3>
              {zones.map(zone => (
                <div 
                  key={zone.id}
                  className={`zone-item ${selectedZone?.id === zone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="zone-header">
                    <span 
                      className="zone-type-indicator"
                      style={{ backgroundColor: getZoneTypeColor(zone.type) }}
                    ></span>
                    <h4>{zone.name}</h4>
                    {getRiskLevelBadge(zone.riskLevel)}
                  </div>
                  <p className="zone-type">{zone.type.replace('_', ' ')}</p>
                  <p className="zone-status">
                    Status: {zone.isActive ? '✅ Active' : '❌ Inactive'}
                  </p>
                  <div className="zone-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateZoneStatus(zone.id, zone.isActive ? 'DEACTIVATED' : 'ACTIVATED', 
                          zone.isActive ? 'Manual deactivation' : 'Manual activation');
                      }}
                      className="toggle-zone-btn"
                    >
                      {zone.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteZone(zone.id);
                      }}
                      className="delete-zone-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="zones-map">
            <div 
              ref={mapRef}
              className="map-container"
              style={{ height: '600px', backgroundColor: '#f0f0f0', position: 'relative' }}
            >
              <div className="map-placeholder">
                <p>🗺️ Interactive Map Interface</p>
                <p>Google Maps integration for zone drawing and visualization</p>
                {selectedZone && (
                  <div className="selected-zone-info">
                    <h4>{selectedZone.name}</h4>
                    <p>Type: {selectedZone.type.replace('_', ' ')}</p>
                    <p>Radius: {selectedZone.radius}m</p>
                    <p>Risk Level: {selectedZone.riskLevel}/5</p>
                    <p>Last Updated: {new Date(selectedZone.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="zone-alerts">
          <h3>Zone Breach Alerts</h3>
          <div className="alerts-grid">
            {zoneAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.resolved ? 'resolved' : 'active'}`}>
                <div className="alert-header">
                  <span className={`alert-type ${alert.type.toLowerCase()}`}>
                    {alert.type}
                  </span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="alert-content">
                  <p><strong>Zone:</strong> {zones.find(z => z.id === alert.zoneId)?.name || 'Unknown'}</p>
                  <p><strong>Tourist:</strong> {alert.touristId}</p>
                  <p><strong>Status:</strong> {alert.resolved ? '✅ Resolved' : '🔴 Active'}</p>
                </div>
                {!alert.resolved && (
                  <div className="alert-actions">
                    <button 
                      onClick={() => {
                        setZoneAlerts(zoneAlerts.map(a => 
                          a.id === alert.id ? { ...a, resolved: true } : a
                        ));
                      }}
                      className="resolve-alert-btn"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="zone-history">
          <h3>Zone Status History</h3>
          {selectedZone ? (
            <div className="history-content">
              <h4>{selectedZone.name} - Status Timeline</h4>
              <div className="timeline">
                {selectedZone.statusHistory.map((entry, index) => (
                  <div key={index} className="timeline-entry">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-status">{entry.status}</span>
                        <span className="timeline-time">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="timeline-reason">{entry.reason}</p>
                      <p className="timeline-officer">Officer: {entry.officer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="select-zone-message">Select a zone from the map to view its history</p>
          )}
        </div>
      )}

      {isCreating && (
        <div className="create-zone-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Zone</h3>
              <button onClick={() => setIsCreating(false)} className="close-modal">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Zone Name</label>
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  placeholder="Enter zone name"
                />
              </div>
              <div className="form-group">
                <label>Zone Type</label>
                <select
                  value={newZone.type}
                  onChange={(e) => setNewZone({...newZone, type: e.target.value as Zone['type']})}
                >
                  <option value="SAFE_ZONE">Safe Zone</option>
                  <option value="SENSITIVE_ZONE">Sensitive Zone</option>
                  <option value="RESTRICTED_ZONE">Restricted Zone</option>
                  <option value="HIGH_RISK_ZONE">High Risk Zone</option>
                </select>
              </div>
              <div className="form-group">
                <label>Risk Level (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newZone.riskLevel}
                  onChange={(e) => setNewZone({...newZone, riskLevel: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Radius (meters)</label>
                <input
                  type="number"
                  value={newZone.radius}
                  onChange={(e) => setNewZone({...newZone, radius: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Alert Message</label>
                <textarea
                  value={newZone.alertMessage}
                  onChange={(e) => setNewZone({...newZone, alertMessage: e.target.value})}
                  placeholder="Message to show when tourists enter this zone"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsCreating(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={createZone} className="create-btn">
                Create Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};