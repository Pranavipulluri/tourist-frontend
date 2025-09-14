import L from 'leaflet';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  Download,
  Eye,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap
} from 'react-leaflet';
import io, { Socket } from 'socket.io-client';
import './LiveMonitoring.css';

// Types
interface Tourist {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EMERGENCY' | 'WARNING';
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
  };
  digitalId?: string;
  emergencyContacts?: string[];
}

interface Alert {
  id: string;
  type: 'SOS' | 'PANIC' | 'GEOFENCE_VIOLATION' | 'MEDICAL' | 'WEATHER' | 'SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  touristId: string;
  tourist?: Tourist;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  timestamp: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  responseTime?: number;
}

interface GeofenceViolation {
  id: string;
  touristId: string;
  tourist?: Tourist;
  geofenceId: string;
  geofenceName: string;
  violationType: 'ENTRY' | 'EXIT';
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface DashboardStats {
  totalTourists: number;
  activeTourists: number;
  activeAlerts: number;
  criticalAlerts: number;
  avgResponseTime: number;
  geofenceViolations: number;
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

interface LiveData {
  tourists: Tourist[];
  alerts: Alert[];
  violations: GeofenceViolation[];
  stats: DashboardStats;
  lastUpdate: string;
}

// Custom Map Component for real-time updates
const LiveMap: React.FC<{
  tourists: Tourist[];
  alerts: Alert[];
  violations: GeofenceViolation[];
  onTouristClick: (tourist: Tourist) => void;
  onAlertClick: (alert: Alert) => void;
}> = ({ tourists, alerts, violations, onTouristClick, onAlertClick }) => {
  const map = useMap();

  // Custom icons
  const touristIcon = (status: Tourist['status']) => {
    const color = {
      ACTIVE: '#10B981',
      INACTIVE: '#6B7280',
      EMERGENCY: '#EF4444',
      WARNING: '#F59E0B'
    }[status];

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  const alertIcon = (severity: Alert['severity']) => {
    const color = {
      LOW: '#10B981',
      MEDIUM: '#F59E0B',
      HIGH: '#F97316',
      CRITICAL: '#EF4444'
    }[severity];

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
      className: 'alert-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <>
      {/* Tourist Markers */}
      {tourists.map((tourist) => 
        tourist.lastLocation && (
          <Marker
            key={tourist.id}
            position={[tourist.lastLocation.latitude, tourist.lastLocation.longitude]}
            icon={touristIcon(tourist.status)}
            eventHandlers={{
              click: () => onTouristClick(tourist)
            }}
          >
            <Popup>
              <div className="popup-content">
                <h4>{tourist.name}</h4>
                <p><strong>Status:</strong> {tourist.status}</p>
                <p><strong>Phone:</strong> {tourist.phone}</p>
                <p><strong>Last Update:</strong> {new Date(tourist.lastLocation.timestamp).toLocaleTimeString()}</p>
                {tourist.lastLocation.accuracy && (
                  <p><strong>Accuracy:</strong> ±{tourist.lastLocation.accuracy}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      )}

      {/* Alert Markers */}
      {alerts.filter(alert => alert.status === 'ACTIVE').map((alert) => (
        <Marker
          key={alert.id}
          position={[alert.location.latitude, alert.location.longitude]}
          icon={alertIcon(alert.severity)}
          eventHandlers={{
            click: () => onAlertClick(alert)
          }}
        >
          <Popup>
            <div className="popup-content">
              <h4>🚨 {alert.type}</h4>
              <p><strong>Severity:</strong> {alert.severity}</p>
              <p><strong>Message:</strong> {alert.message}</p>
              <p><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</p>
              {alert.tourist && (
                <p><strong>Tourist:</strong> {alert.tourist.name}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Geofence Violation Circles */}
      {violations.map((violation) => (
        <Circle
          key={violation.id}
          center={[violation.location.latitude, violation.location.longitude]}
          radius={100}
          pathOptions={{
            color: violation.severity === 'HIGH' ? '#EF4444' : violation.severity === 'MEDIUM' ? '#F59E0B' : '#10B981',
            fillColor: violation.severity === 'HIGH' ? '#FEE2E2' : violation.severity === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div className="popup-content">
              <h4>⚠️ Geofence Violation</h4>
              <p><strong>Type:</strong> {violation.violationType}</p>
              <p><strong>Zone:</strong> {violation.geofenceName}</p>
              <p><strong>Severity:</strong> {violation.severity}</p>
              <p><strong>Time:</strong> {new Date(violation.timestamp).toLocaleString()}</p>
              {violation.tourist && (
                <p><strong>Tourist:</strong> {violation.tourist.name}</p>
              )}
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, trend, color, onClick }) => (
  <div 
    className={`stats-card ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
    style={{ borderLeft: `4px solid ${color}` }}
  >
    <div className="stats-card-header">
      <div className="stats-icon" style={{ color }}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          <TrendingUp size={16} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div className="stats-value">{value}</div>
    <div className="stats-title">{title}</div>
  </div>
);

// Alert Item Component
const AlertItem: React.FC<{
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onCall: (phone: string) => void;
}> = ({ alert, onAcknowledge, onResolve, onCall }) => {
  const getSeverityColor = (severity: Alert['severity']) => {
    const colors = {
      LOW: '#10B981',
      MEDIUM: '#F59E0B',
      HIGH: '#F97316',
      CRITICAL: '#EF4444'
    };
    return colors[severity];
  };

  const getTypeIcon = (type: Alert['type']) => {
    const icons = {
      SOS: '🆘',
      PANIC: '😰',
      GEOFENCE_VIOLATION: '⚠️',
      MEDICAL: '🏥',
      WEATHER: '🌦️',
      SECURITY: '🔒'
    };
    return icons[type] || '⚠️';
  };

  return (
    <div className="alert-item" style={{ borderLeft: `4px solid ${getSeverityColor(alert.severity)}` }}>
      <div className="alert-header">
        <div className="alert-type">
          <span className="alert-icon">{getTypeIcon(alert.type)}</span>
          <span className="alert-type-text">{alert.type}</span>
          <span className={`alert-severity ${alert.severity.toLowerCase()}`}>
            {alert.severity}
          </span>
        </div>
        <div className="alert-timestamp">
          <Clock size={14} />
          {new Date(alert.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      <div className="alert-message">{alert.message}</div>
      
      {alert.tourist && (
        <div className="alert-tourist">
          <Users size={14} />
          <span>{alert.tourist.name}</span>
          <span className="tourist-phone">{alert.tourist.phone}</span>
        </div>
      )}

      <div className="alert-location">
        <MapPin size={14} />
        <span>{alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}</span>
      </div>

      <div className="alert-actions">
        {alert.status === 'ACTIVE' && (
          <>
            <button 
              className="btn-acknowledge"
              onClick={() => onAcknowledge(alert.id)}
            >
              <Eye size={16} />
              Acknowledge
            </button>
            <button 
              className="btn-resolve"
              onClick={() => onResolve(alert.id)}
            >
              <Shield size={16} />
              Resolve
            </button>
          </>
        )}
        {alert.tourist?.phone && (
          <button 
            className="btn-call"
            onClick={() => onCall(alert.tourist!.phone)}
          >
            <Phone size={16} />
            Call
          </button>
        )}
      </div>
    </div>
  );
};

// Main Live Monitoring Component
const LiveMonitoring: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveData>({
    tourists: [],
    alerts: [],
    violations: [],
    stats: {
      totalTourists: 0,
      activeTourists: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      avgResponseTime: 0,
      geofenceViolations: 0,
      systemHealth: 'HEALTHY'
    },
    lastUpdate: new Date().toISOString()
  });

  const [isConnected, setIsConnected] = useState(false);
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EMERGENCY'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
      socket.emit('join-room', 'admin-live-monitoring');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for real-time updates
    socket.on('dashboard-stats', (stats: DashboardStats) => {
      setLiveData(prev => ({
        ...prev,
        stats,
        lastUpdate: new Date().toISOString()
      }));
    });

    socket.on('tourist-location-update', (tourist: Tourist) => {
      setLiveData(prev => ({
        ...prev,
        tourists: prev.tourists.map(t => 
          t.id === tourist.id ? { ...t, ...tourist } : t
        ),
        lastUpdate: new Date().toISOString()
      }));
    });

    socket.on('new-alert', (alert: Alert) => {
      setLiveData(prev => ({
        ...prev,
        alerts: [alert, ...prev.alerts.slice(0, 99)], // Keep last 100 alerts
        lastUpdate: new Date().toISOString()
      }));

      // Play alert sound for critical alerts
      if (alert.severity === 'CRITICAL' && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`${alert.type} Alert`, {
          body: alert.message,
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('alert-updated', (alert: Alert) => {
      setLiveData(prev => ({
        ...prev,
        alerts: prev.alerts.map(a => a.id === alert.id ? alert : a),
        lastUpdate: new Date().toISOString()
      }));
    });

    socket.on('geofence-violation', (violation: GeofenceViolation) => {
      setLiveData(prev => ({
        ...prev,
        violations: [violation, ...prev.violations.slice(0, 49)], // Keep last 50 violations
        lastUpdate: new Date().toISOString()
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch initial data
  const fetchLiveData = useCallback(async () => {
    try {
      const [touristsRes, alertsRes, statsRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/tourists'),
        fetch('http://localhost:3001/api/alerts?limit=50'),
        fetch('http://localhost:3001/api/admin/dashboard/overview')
      ]);

      const [tourists, alerts, stats] = await Promise.all([
        touristsRes.json(),
        alertsRes.json(),
        statsRes.json()
      ]);

      setLiveData({
        tourists: Array.isArray(tourists.data) ? tourists.data : Array.isArray(tourists) ? tourists : [],
        alerts: Array.isArray(alerts.data) ? alerts.data : Array.isArray(alerts) ? alerts : [],
        violations: [], // Will be populated by WebSocket
        stats: stats.data || stats || {
          totalTourists: 0,
          activeTourists: 0,
          activeAlerts: 0,
          criticalAlerts: 0,
          avgResponseTime: 0,
          geofenceViolations: 0,
          systemHealth: 'HEALTHY'
        },
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLiveData]);

  // Filter tourists based on status
  const filteredTourists = Array.isArray(liveData.tourists) ? liveData.tourists.filter(tourist => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return tourist.status === 'ACTIVE';
    if (filterStatus === 'EMERGENCY') return tourist.status === 'EMERGENCY' || tourist.status === 'WARNING';
    return true;
  }) : [];

  // Handle alert actions
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`http://localhost:3001/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch(`http://localhost:3001/api/alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleCallTourist = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleExportData = () => {
    const data = {
      exportTime: new Date().toISOString(),
      tourists: liveData.tourists,
      alerts: liveData.alerts,
      violations: liveData.violations,
      stats: liveData.stats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="live-monitoring">
      {/* Audio for alert notifications */}
      <audio
        ref={audioRef}
        preload="auto"
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBC+Wzvny"
      />

      <div className="live-monitoring-header">
        <div className="header-left">
          <h1>
            <Activity size={28} />
            Live Monitoring Dashboard
          </h1>
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            <span className="last-update">
              Last update: {new Date(liveData.lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className={`btn-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={16} />
            Auto Refresh
          </button>
          <button className="btn-export" onClick={handleExportData}>
            <Download size={16} />
            Export Data
          </button>
          <button 
            className={`btn-analytics ${showAnalytics ? 'active' : ''}`}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 size={16} />
            Analytics
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatsCard
          title="Total Tourists"
          value={liveData.stats.totalTourists}
          icon={<Users size={24} />}
          color="#3B82F6"
        />
        <StatsCard
          title="Active Tourists"
          value={liveData.stats.activeTourists}
          icon={<Activity size={24} />}
          color="#10B981"
        />
        <StatsCard
          title="Active Alerts"
          value={liveData.stats.activeAlerts}
          icon={<Bell size={24} />}
          color="#F59E0B"
        />
        <StatsCard
          title="Critical Alerts"
          value={liveData.stats.criticalAlerts}
          icon={<AlertTriangle size={24} />}
          color="#EF4444"
        />
        <StatsCard
          title="Avg Response Time"
          value={`${liveData.stats.avgResponseTime}min`}
          icon={<Clock size={24} />}
          color="#8B5CF6"
        />
        <StatsCard
          title="Geofence Violations"
          value={liveData.stats.geofenceViolations}
          icon={<Shield size={24} />}
          color="#F97316"
        />
      </div>

      <div className="monitoring-content">
        {/* Live Map */}
        <div className="map-section">
          <div className="map-header">
            <h2>
              <MapPin size={20} />
              Live Location Tracking
            </h2>
            <div className="map-filters">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="ALL">All Tourists</option>
                <option value="ACTIVE">Active Only</option>
                <option value="EMERGENCY">Emergency Only</option>
              </select>
            </div>
          </div>
          
          <div className="map-container">
            <MapContainer
              center={[28.6139, 77.2090]} // Default to Delhi
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LiveMap
                tourists={filteredTourists}
                alerts={Array.isArray(liveData.alerts) ? liveData.alerts.filter(a => a.status === 'ACTIVE') : []}
                violations={Array.isArray(liveData.violations) ? liveData.violations : []}
                onTouristClick={setSelectedTourist}
                onAlertClick={setSelectedAlert}
              />
            </MapContainer>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="alerts-section">
          <div className="alerts-header">
            <h2>
              <Bell size={20} />
              Live Alert Feed
            </h2>
            <div className="alert-summary">
              <span className="active-count">{Array.isArray(liveData.alerts) ? liveData.alerts.filter(a => a.status === 'ACTIVE').length : 0} Active</span>
              <span className="critical-count">{Array.isArray(liveData.alerts) ? liveData.alerts.filter(a => a.severity === 'CRITICAL').length : 0} Critical</span>
            </div>
          </div>

          <div className="alerts-list">
            {!Array.isArray(liveData.alerts) || liveData.alerts.length === 0 ? (
              <div className="no-alerts">
                <Shield size={48} />
                <p>No alerts at this time</p>
                <p>System is monitoring all tourists</p>
              </div>
            ) : (
              (Array.isArray(liveData.alerts) ? liveData.alerts : [])
                .filter(alert => filterStatus === 'ALL' || alert.status === 'ACTIVE')
                .slice(0, 20) // Show latest 20 alerts
                .map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeAlert}
                    onResolve={handleResolveAlert}
                    onCall={handleCallTourist}
                  />
                ))
            )}
          </div>
        </div>
      </div>

      {/* Tourist Details Modal */}
      {selectedTourist && (
        <div className="modal-overlay" onClick={() => setSelectedTourist(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tourist Details</h3>
              <button onClick={() => setSelectedTourist(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="tourist-info">
                <h4>{selectedTourist.name}</h4>
                <p><strong>Email:</strong> {selectedTourist.email}</p>
                <p><strong>Phone:</strong> {selectedTourist.phone}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedTourist.status.toLowerCase()}`}>
                    {selectedTourist.status}
                  </span>
                </p>
                {selectedTourist.digitalId && (
                  <p><strong>Digital ID:</strong> {selectedTourist.digitalId}</p>
                )}
              </div>
              
              {selectedTourist.lastLocation && (
                <div className="location-info">
                  <h5>Last Known Location</h5>
                  <p><strong>Coordinates:</strong> {selectedTourist.lastLocation.latitude.toFixed(6)}, {selectedTourist.lastLocation.longitude.toFixed(6)}</p>
                  <p><strong>Timestamp:</strong> {new Date(selectedTourist.lastLocation.timestamp).toLocaleString()}</p>
                  {selectedTourist.lastLocation.accuracy && (
                    <p><strong>Accuracy:</strong> ±{selectedTourist.lastLocation.accuracy}m</p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-call" onClick={() => handleCallTourist(selectedTourist.phone)}>
                  <Phone size={16} />
                  Call Tourist
                </button>
                <button className="btn-message">
                  <MessageSquare size={16} />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alert Details</h3>
              <button onClick={() => setSelectedAlert(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-details">
                <h4>{selectedAlert.type} Alert</h4>
                <p><strong>Severity:</strong> 
                  <span className={`severity-badge ${selectedAlert.severity.toLowerCase()}`}>
                    {selectedAlert.severity}
                  </span>
                </p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedAlert.status.toLowerCase()}`}>
                    {selectedAlert.status}
                  </span>
                </p>
                <p><strong>Message:</strong> {selectedAlert.message}</p>
                <p><strong>Time:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}</p>
                <p><strong>Location:</strong> {selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}</p>
                
                {selectedAlert.tourist && (
                  <div className="alert-tourist-info">
                    <h5>Tourist Information</h5>
                    <p><strong>Name:</strong> {selectedAlert.tourist.name}</p>
                    <p><strong>Phone:</strong> {selectedAlert.tourist.phone}</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedAlert.status === 'ACTIVE' && (
                  <>
                    <button 
                      className="btn-acknowledge"
                      onClick={() => {
                        handleAcknowledgeAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                    >
                      <Eye size={16} />
                      Acknowledge
                    </button>
                    <button 
                      className="btn-resolve"
                      onClick={() => {
                        handleResolveAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                    >
                      <Shield size={16} />
                      Resolve
                    </button>
                  </>
                )}
                {selectedAlert.tourist?.phone && (
                  <button 
                    className="btn-call"
                    onClick={() => handleCallTourist(selectedAlert.tourist!.phone)}
                  >
                    <Phone size={16} />
                    Call Tourist
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;