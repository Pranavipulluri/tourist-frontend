import React, { useEffect, useState } from 'react';
import { apiService, Tourist } from '../../services/api';
import { websocketService } from '../../services/websocket';

interface SOSAlert {
  id: string;
  touristId: string;
  type: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  tourist?: Tourist | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  responseTime?: number;
  handledBy?: string;
  handledAt?: string;
}

export const SOSManagement: React.FC = () => {
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'handled'>('active');
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSOSAlerts();
    
    // Setup real-time SOS alert notifications
    websocketService.on('sos_alert_created', handleNewSOSAlert);
    websocketService.on('sos_alert_handled', handleSOSAlertHandled);
    
    return () => {
      websocketService.off('sos_alert_created');
      websocketService.off('sos_alert_handled');
    };
  }, []);

  const loadSOSAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🚨 Loading SOS alerts from real database...');
      const alerts = await apiService.getSOSAlertsAdmin();
      console.log('✅ SOS alerts received:', alerts);
      
      // Enhance alerts with tourist and location data
      const enhancedAlerts = await Promise.all(
        alerts.map(async (alert) => {
          try {
            let tourist = null;
            try {
              tourist = await apiService.getTouristById(alert.touristId);
            } catch (touristError) {
              console.warn(`Could not load tourist data for ${alert.touristId}:`, touristError);
            }
            
            const sosAlert: SOSAlert = {
              ...alert,
              tourist,
              location: {
                latitude: alert.latitude || 0,
                longitude: alert.longitude || 0,
                address: alert.address
              },
              responseTime: alert.resolvedAt 
                ? new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime()
                : undefined,
              handledAt: alert.resolvedAt
            };
            return sosAlert;
          } catch (error) {
            console.error(`Error enhancing SOS alert ${alert.id}:`, error);
            return {
              ...alert,
              location: {
                latitude: alert.latitude || 0,
                longitude: alert.longitude || 0,
                address: alert.address
              }
            };
          }
        })
      );
      
      setSOSAlerts(enhancedAlerts);
      console.log('✅ Enhanced SOS alerts loaded:', enhancedAlerts.length);
    } catch (error: any) {
      console.error('Failed to load SOS alerts:', error);
      setError('Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSOSAlert = (alert: SOSAlert) => {
    // Play sound notification
    const audio = new Audio('/sounds/emergency-alert.mp3');
    audio.play().catch(console.error);
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🆘 Emergency SOS Alert!', {
        body: `Tourist ${alert.tourist?.firstName} ${alert.tourist?.lastName} needs immediate help!`,
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: `sos-${alert.id}`
      });
    }
    
    // Add to alerts list
    setSOSAlerts(prev => [alert, ...prev]);
  };

  const handleSOSAlertHandled = (data: { alertId: string; handledBy: string; handledAt: string }) => {
    setSOSAlerts(prev => prev.map(alert => 
      alert.id === data.alertId
        ? {
            ...alert,
            status: 'RESOLVED' as any,
            handledBy: data.handledBy,
            handledAt: data.handledAt,
            responseTime: new Date(data.handledAt).getTime() - new Date(alert.createdAt).getTime()
          }
        : alert
    ));
  };

  const handleMarkAsHandled = async (alert: SOSAlert) => {
    try {
      console.log('🔄 Marking alert as resolved:', alert.id);
      await apiService.resolveAlert(alert.id, 'Admin User');
      
      setSOSAlerts(prev => prev.map(a => 
        a.id === alert.id
          ? {
              ...a,
              status: 'RESOLVED' as any,
              handledBy: 'Admin User',
              handledAt: new Date().toISOString(),
              responseTime: Date.now() - new Date(a.createdAt).getTime()
            }
          : a
      ));
      
      console.log('✅ Alert marked as resolved');
    } catch (error) {
      console.error('❌ Failed to mark alert as handled:', error);
      window.alert('Failed to mark alert as resolved. Please try again.');
    }
  };

  const handleViewDetails = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    setShowDetails(true);
  };

  const handleCallTourist = (phoneNumber?: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const handleDispatchEmergency = (location?: { latitude: number; longitude: number }) => {
    if (location) {
      // In a real system, this would trigger emergency services dispatch
      alert(`Emergency services dispatched to location: ${location.latitude}, ${location.longitude}`);
    }
  };

  const filteredAlerts = sosAlerts.filter(alert => {
    switch (filter) {
      case 'active':
        return alert.status === 'ACTIVE';
      case 'handled':
        return alert.status === 'RESOLVED';
      default:
        return true;
    }
  });

  const getAlertPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      default: return '#16a34a';
    }
  };

  const formatResponseTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="sos-management loading">
        <div className="loading-spinner"></div>
        <p>Loading SOS alerts...</p>
      </div>
    );
  }

  return (
    <div className="sos-management">
      <div className="sos-header">
        <h3>🆘 SOS Emergency Management</h3>
        <div className="sos-stats">
          <div className="stat-card critical">
            <span className="stat-number">{filteredAlerts.filter(a => a.status === 'ACTIVE').length}</span>
            <span className="stat-label">Active Emergencies</span>
          </div>
          <div className="stat-card resolved">
            <span className="stat-number">{filteredAlerts.filter(a => a.status === 'RESOLVED').length}</span>
            <span className="stat-label">Resolved Today</span>
          </div>
          <div className="stat-card avg-response">
            <span className="stat-number">
              {sosAlerts.filter(a => a.responseTime).length > 0 
                ? formatResponseTime(
                    sosAlerts.filter(a => a.responseTime).reduce((sum, a) => sum + (a.responseTime || 0), 0) / 
                    sosAlerts.filter(a => a.responseTime).length
                  )
                : 'N/A'
              }
            </span>
            <span className="stat-label">Avg Response Time</span>
          </div>
        </div>
      </div>

      <div className="sos-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({sosAlerts.filter(a => a.status === 'ACTIVE').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'handled' ? 'active' : ''}`}
            onClick={() => setFilter('handled')}
          >
            Handled
          </button>
        </div>
        <button onClick={loadSOSAlerts} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="sos-alerts-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`sos-alert-card ${alert.status?.toLowerCase()}`}>
            <div className="alert-header">
              <div className="alert-priority" style={{ backgroundColor: getAlertPriorityColor(alert.severity) }}>
                {alert.severity}
              </div>
              <div className="alert-time">
                {new Date(alert.createdAt).toLocaleTimeString()}
              </div>
              <div className={`alert-status ${alert.status?.toLowerCase()}`}>
                {alert.status}
              </div>
            </div>

            <div className="alert-content">
              <div className="tourist-info">
                <h4>
                  {alert.tourist?.firstName} {alert.tourist?.lastName}
                  {alert.status === 'ACTIVE' && <span className="urgent-indicator">🚨 URGENT</span>}
                </h4>
                <p>📞 {alert.tourist?.phoneNumber}</p>
                <p>📧 {alert.tourist?.email}</p>
              </div>

              <div className="alert-details">
                <p className="alert-message">{alert.message}</p>
                {alert.location && (
                  <div className="location-info">
                    <p>📍 Location: {alert.location.latitude?.toFixed(6)}, {alert.location.longitude?.toFixed(6)}</p>
                    {alert.location.address && <p>🏠 Address: {alert.location.address}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="alert-actions">
              <button 
                onClick={() => handleCallTourist(alert.tourist?.phoneNumber)}
                className="action-btn call-btn"
              >
                📞 Call Tourist
              </button>
              
              <button 
                onClick={() => handleDispatchEmergency(alert.location)}
                className="action-btn dispatch-btn"
              >
                🚑 Dispatch Emergency
              </button>
              
              <button 
                onClick={() => handleViewDetails(alert)}
                className="action-btn details-btn"
              >
                📋 View Details
              </button>
              
              {alert.location && (
                <button 
                  onClick={() => window.open(`https://maps.google.com/?q=${alert.location?.latitude},${alert.location?.longitude}`)}
                  className="action-btn map-btn"
                >
                  🗺️ View on Map
                </button>
              )}
              
              {alert.status === 'ACTIVE' && (
                <button 
                  onClick={() => handleMarkAsHandled(alert)}
                  className="action-btn resolve-btn"
                >
                  ✅ Mark Handled
                </button>
              )}
            </div>

            {alert.responseTime && (
              <div className="response-time">
                Response Time: {formatResponseTime(alert.responseTime)}
                {alert.handledBy && <span> • Handled by: {alert.handledBy}</span>}
              </div>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="no-alerts">
            <p>
              {filter === 'active' 
                ? '✅ No active SOS alerts - All clear!' 
                : 'No SOS alerts found.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      {showDetails && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🆘 SOS Alert Details</h3>
              <button onClick={() => setShowDetails(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="alert-details-full">
                <div className="detail-section">
                  <h4>Tourist Information</h4>
                  <p><strong>Name:</strong> {selectedAlert.tourist?.firstName} {selectedAlert.tourist?.lastName}</p>
                  <p><strong>Email:</strong> {selectedAlert.tourist?.email}</p>
                  <p><strong>Phone:</strong> {selectedAlert.tourist?.phoneNumber}</p>
                  <p><strong>Emergency Contact:</strong> {selectedAlert.tourist?.emergencyContact || 'Not provided'}</p>
                </div>

                <div className="detail-section">
                  <h4>Alert Information</h4>
                  <p><strong>Alert ID:</strong> {selectedAlert.id}</p>
                  <p><strong>Type:</strong> {selectedAlert.type}</p>
                  <p><strong>Priority:</strong> {selectedAlert.severity}</p>
                  <p><strong>Status:</strong> {selectedAlert.status}</p>
                  <p><strong>Created At:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  <p><strong>Message:</strong> {selectedAlert.message}</p>
                </div>

                {selectedAlert.location && (
                  <div className="detail-section">
                    <h4>Location Information</h4>
                    <p><strong>Coordinates:</strong> {selectedAlert.location.latitude}, {selectedAlert.location.longitude}</p>
                    {selectedAlert.location.address && (
                      <p><strong>Address:</strong> {selectedAlert.location.address}</p>
                    )}
                    <div className="location-map">
                      <iframe
                        src={`https://maps.google.com/maps?q=${selectedAlert.location.latitude},${selectedAlert.location.longitude}&z=15&output=embed`}
                        width="100%"
                        height="300"
                        style={{ border: 0, borderRadius: '8px' }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>
                )}

                {selectedAlert.handledBy && (
                  <div className="detail-section">
                    <h4>Resolution Information</h4>
                    <p><strong>Handled By:</strong> {selectedAlert.handledBy}</p>
                    <p><strong>Handled At:</strong> {new Date(selectedAlert.handledAt!).toLocaleString()}</p>
                    <p><strong>Response Time:</strong> {selectedAlert.responseTime ? formatResponseTime(selectedAlert.responseTime) : 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};