import React, { useEffect, useState } from 'react';
import { EmergencyAlert, emergencyResponseService, TwilioCallSession } from '../../services/emergencyResponse';
import { websocketService } from '../../services/websocket';
import './AdminEmergencyDashboard.css';

interface AdminEmergencyDashboardProps {
  userId: string;
  role: 'admin' | 'emergency_responder';
}

export const AdminEmergencyDashboard: React.FC<AdminEmergencyDashboardProps> = ({ userId, role }) => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [callSession, setCallSession] = useState<TwilioCallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const [responseTime, setResponseTime] = useState<{ [alertId: string]: number }>({});
  const [dashboardStats, setDashboardStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedToday: 0,
    averageResponseTime: 0
  });

  useEffect(() => {
    initializeAdminDashboard();
    setupWebSocketListeners();
    loadDashboardStats();
    
    return () => {
      cleanupListeners();
    };
  }, []);

  const initializeAdminDashboard = async () => {
    try {
      setLoading(true);
      
      // Load all active emergency alerts
      const alerts = await emergencyResponseService.getEmergencyAlerts('ACTIVE');
      setActiveAlerts(alerts);
      
      // Request notification permissions
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize admin dashboard:', error);
      setLoading(false);
    }
  };

  const setupWebSocketListeners = () => {
    // Listen for new emergency alerts
    websocketService.on('emergency_alert_broadcast', (alert: EmergencyAlert) => {
      console.log('🚨 New emergency alert received:', alert);
      
      setActiveAlerts(prev => [alert, ...prev]);
      setNewAlertsCount(prev => prev + 1);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`🚨 Emergency Alert: ${alert.type}`, {
          body: `${alert.message} - ${alert.tourist?.firstName} ${alert.tourist?.lastName}`,
          icon: '/favicon.ico',
          requireInteraction: true,
          tag: `emergency-${alert.id}`
        });
      }
      
      // Play alert sound
      playEmergencySound();
    });

    // Listen for alert updates
    websocketService.on('emergency_alert_status_changed', (updatedAlert: EmergencyAlert) => {
      setActiveAlerts(prev => 
        prev.map(alert => 
          alert.id === updatedAlert.id ? updatedAlert : alert
        )
      );
      
      if (selectedAlert?.id === updatedAlert.id) {
        setSelectedAlert(updatedAlert);
      }
    });

    // Listen for call status updates
    websocketService.on('call_status_update', (callData: TwilioCallSession) => {
      setCallSession(callData);
    });

    // Listen for location updates
    websocketService.on('emergency_location_update', (data: any) => {
      setActiveAlerts(prev =>
        prev.map(alert =>
          alert.id === data.alertId
            ? { ...alert, location: { ...alert.location, ...data.location } }
            : alert
        )
      );
    });
  };

  const cleanupListeners = () => {
    websocketService.off('emergency_alert_broadcast');
    websocketService.off('emergency_alert_status_changed');
    websocketService.off('call_status_update');
    websocketService.off('emergency_location_update');
  };

  const loadDashboardStats = async () => {
    try {
      // This would typically come from an API endpoint
      // For now, we'll calculate from current data
      const stats = {
        totalAlerts: activeAlerts.length,
        activeAlerts: activeAlerts.filter(a => a.status === 'ACTIVE').length,
        resolvedToday: 0, // Would be calculated server-side
        averageResponseTime: 0 // Would be calculated server-side
      };
      
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await emergencyResponseService.acknowledgeEmergencyAlert(alertId, userId);
      
      // Update response time tracking
      const alert = activeAlerts.find(a => a.id === alertId);
      if (alert) {
        const responseTimeMs = Date.now() - new Date(alert.createdAt).getTime();
        setResponseTime(prev => ({ ...prev, [alertId]: responseTimeMs }));
      }
      
      setNewAlertsCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert. Please try again.');
    }
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    try {
      await emergencyResponseService.resolveEmergencyAlert(alertId, resolution, userId);
      
      // Remove from active alerts
      setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(null);
      }
      
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  const initiateCallToTourist = async (emergencyAlert: EmergencyAlert) => {
    try {
      if (!emergencyAlert.tourist?.phone) {
        window.alert('Tourist phone number not available.');
        return;
      }

      const callRequest = {
        touristId: emergencyAlert.touristId,
        adminId: userId,
        reason: 'EMERGENCY_RESPONSE' as const,
        priority: 'CRITICAL' as const,
        alertId: emergencyAlert.id
      };

      const session = await emergencyResponseService.initiateEmergencyCall(callRequest);
      setCallSession(session);
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      window.alert('Failed to initiate call. Please try again.');
    }
  };

  const endCall = async () => {
    try {
      if (callSession) {
        await emergencyResponseService.endEmergencyCall(callSession.sid);
        setCallSession(null);
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const playEmergencySound = () => {
    try {
      const audio = new Audio('/sounds/emergency-alert.mp3');
      audio.volume = 0.8;
      audio.play().catch(error => {
        console.warn('Could not play alert sound:', error);
      });
    } catch (error) {
      console.warn('Alert sound not available:', error);
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 60000) {
      return `${Math.round(ms / 1000)}s`;
    } else {
      return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#059669';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-emergency-loading">
        <div className="loading-spinner"></div>
        <p>Loading Emergency Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-emergency-dashboard">
      {/* Dashboard Header */}
      <div className="admin-emergency-header">
        <div className="header-left">
          <h1>🚨 Emergency Response Center</h1>
          <div className="admin-status">
            <span className="status-dot active"></span>
            <span>Admin {role.toUpperCase()} - {userId}</span>
          </div>
        </div>
        <div className="header-right">
          {newAlertsCount > 0 && (
            <div className="new-alerts-badge">
              {newAlertsCount} New Alert{newAlertsCount !== 1 ? 's' : ''}
            </div>
          )}
          <button 
            className="clear-notifications"
            onClick={() => setNewAlertsCount(0)}
          >
            Clear Notifications
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Alerts</h3>
          <div className="stat-number">{dashboardStats.totalAlerts}</div>
        </div>
        <div className="stat-card">
          <h3>Active Alerts</h3>
          <div className="stat-number critical">{dashboardStats.activeAlerts}</div>
        </div>
        <div className="stat-card">
          <h3>Resolved Today</h3>
          <div className="stat-number success">{dashboardStats.resolvedToday}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Response</h3>
          <div className="stat-number">{dashboardStats.averageResponseTime}s</div>
        </div>
      </div>

      {/* Active Call Status */}
      {callSession && (
        <div className="active-call-status">
          <div className="call-info">
            <span className="call-indicator"></span>
            <strong>Call Status: {callSession.status.toUpperCase()}</strong>
            <span>From: {callSession.from}</span>
            <span>To: {callSession.to}</span>
            {callSession.duration && <span>Duration: {callSession.duration}s</span>}
          </div>
          <button className="end-call-btn" onClick={endCall}>
            📞 End Call
          </button>
        </div>
      )}

      <div className="dashboard-content">
        {/* Active Alerts List */}
        <div className="alerts-section">
          <h2>🚨 Active Emergency Alerts ({activeAlerts.length})</h2>
          
          {activeAlerts.length === 0 ? (
            <div className="no-alerts">
              <p>✅ No active emergency alerts</p>
              <p>All tourists are safe</p>
            </div>
          ) : (
            <div className="alerts-list">
              {activeAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`alert-card ${alert.severity.toLowerCase()} ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="alert-header">
                    <div className="alert-badges">
                      <span className="alert-type">{alert.type}</span>
                      <span 
                        className="alert-severity"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      >
                        {alert.severity}
                      </span>
                      <span className="alert-status">{alert.status}</span>
                    </div>
                    <div className="alert-time">
                      {new Date(alert.createdAt).toLocaleString()}
                      {responseTime[alert.id] && (
                        <span className="response-time">
                          Response: {formatResponseTime(responseTime[alert.id])}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="alert-content">
                    <div className="tourist-info">
                      <strong>Tourist:</strong> {alert.tourist?.firstName} {alert.tourist?.lastName}
                      <span className="tourist-contact">📞 {alert.tourist?.phone}</span>
                    </div>
                    <div className="alert-message">
                      <strong>Message:</strong> {alert.message}
                    </div>
                    <div className="alert-location">
                      <strong>Location:</strong> {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}
                      {alert.location.address && <span> - {alert.location.address}</span>}
                    </div>
                    {alert.firNumber && (
                      <div className="fir-info">
                        <strong>FIR Number:</strong> {alert.firNumber}
                      </div>
                    )}
                  </div>
                  
                  <div className="alert-actions">
                    {alert.status === 'ACTIVE' && (
                      <button 
                        className="acknowledge-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          acknowledgeAlert(alert.id);
                        }}
                      >
                        ✓ Acknowledge
                      </button>
                    )}
                    
                    <button 
                      className="call-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        initiateCallToTourist(alert);
                      }}
                    >
                      📞 Call Tourist
                    </button>
                    
                    <button 
                      className="resolve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const resolution = prompt('Enter resolution details:');
                        if (resolution) {
                          resolveAlert(alert.id, resolution);
                        }
                      }}
                    >
                      ✅ Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Details Panel */}
        {selectedAlert && (
          <div className="alert-details-panel">
            <div className="panel-header">
              <h3>Alert Details</h3>
              <button 
                className="close-panel"
                onClick={() => setSelectedAlert(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="alert-full-details">
              <div className="detail-section">
                <h4>🚨 Emergency Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedAlert.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>Severity:</label>
                    <span style={{ color: getSeverityColor(selectedAlert.severity) }}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{selectedAlert.status}</span>
                  </div>
                  <div className="detail-item">
                    <label>Created:</label>
                    <span>{new Date(selectedAlert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>👤 Tourist Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedAlert.tourist?.firstName} {selectedAlert.tourist?.lastName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedAlert.tourist?.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedAlert.tourist?.email}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>📍 Location Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Coordinates:</label>
                    <span>{selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Accuracy:</label>
                    <span>{selectedAlert.location.accuracy}m</span>
                  </div>
                  {selectedAlert.location.address && (
                    <div className="detail-item">
                      <label>Address:</label>
                      <span>{selectedAlert.location.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="location-actions">
                  <button 
                    className="view-map-btn"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${selectedAlert.location.latitude},${selectedAlert.location.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    🗺️ View on Map
                  </button>
                  
                  <button 
                    className="directions-btn"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedAlert.location.latitude},${selectedAlert.location.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    🧭 Get Directions
                  </button>
                </div>
              </div>

              {selectedAlert.firNumber && (
                <div className="detail-section">
                  <h4>📋 FIR Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>FIR Number:</label>
                      <span>{selectedAlert.firNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>📝 Message</h4>
                <div className="alert-message-full">
                  {selectedAlert.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmergencyDashboard;