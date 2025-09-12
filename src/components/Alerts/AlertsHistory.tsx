import React, { useEffect, useState } from 'react';
import { Alert, apiService } from '../../services/api';
import { Header } from '../Layout/Header';
import './Alerts.css';

export const AlertsHistory: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyAlerts(filter === 'all' ? undefined : filter.toUpperCase(), 100);
      setAlerts(response.alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const updatedAlert = await apiService.acknowledgeAlert(alertId, 'Admin User');
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? updatedAlert : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'SOS': return '🆘';
      case 'PANIC': return '🚨';
      case 'GEOFENCE': return '🚧';
      case 'SAFETY_CHECK': return '📞';
      default: return '⚠️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ff4444';
      case 'HIGH': return '#ff8800';
      case 'MEDIUM': return '#ffbb00';
      case 'LOW': return '#00bb00';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#e74c3c';
      case 'ACKNOWLEDGED': return '#f39c12';
      case 'RESOLVED': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="alerts-history-page">
      <Header />
      
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>🚨 Alerts History</h1>
          <p>View and manage your safety alerts</p>
        </div>

        <div className="alerts-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </button>
          <button
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-button ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>

        <div className="alerts-stats">
          <div className="stat-card">
            <h3>{alerts.filter(a => a.status === 'ACTIVE').length}</h3>
            <p>Active Alerts</p>
          </div>
          <div className="stat-card">
            <h3>{alerts.filter(a => a.status === 'RESOLVED').length}</h3>
            <p>Resolved Alerts</p>
          </div>
          <div className="stat-card">
            <h3>{alerts.length}</h3>
            <p>Total Alerts</p>
          </div>
        </div>

        {loading ? (
          <div className="alerts-loading">
            <span className="spinner large"></span>
            <p>Loading alerts history...</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <span className="no-alerts-icon">✅</span>
                <h3>No alerts found</h3>
                <p>No alerts match your current filter criteria</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`alert-card ${alert.status.toLowerCase()}`}>
                  <div className="alert-header">
                    <div className="alert-type-info">
                      <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                      <div className="alert-type-text">
                        <h4>{alert.type}</h4>
                        <span
                          className="alert-priority"
                          style={{ color: getPriorityColor(alert.severity) }}
                        >
                          {alert.severity} Priority
                        </span>
                      </div>
                    </div>
                    <span 
                      className="alert-status-badge"
                      style={{ backgroundColor: getStatusColor(alert.status) }}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    
                    <div className="alert-timeline">
                      <div className="timeline-item">
                        <span className="timeline-label">Created:</span>
                        <span className="timeline-value">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {alert.acknowledgedAt && (
                        <div className="timeline-item">
                          <span className="timeline-label">Acknowledged:</span>
                          <span className="timeline-value">
                            {new Date(alert.acknowledgedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {alert.resolvedAt && (
                        <div className="timeline-item">
                          <span className="timeline-label">Resolved:</span>
                          <span className="timeline-value">
                            {new Date(alert.resolvedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {(alert.latitude && alert.longitude) && (
                      <div className="alert-location">
                        <span className="location-icon">📍</span>
                        <span className="location-text">
                          {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </span>
                        {alert.address && (
                          <span className="location-address">
                            {alert.address}
                          </span>
                        )}
                        <button
                          className="view-map-button"
                          onClick={() => window.open(`https://maps.google.com/maps?q=${alert.latitude},${alert.longitude}`, '_blank')}
                        >
                          View on Map
                        </button>
                      </div>
                    )}
                  </div>

                  {alert.status === 'ACTIVE' && (
                    <div className="alert-actions">
                      <button
                        className="acknowledge-button"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge Alert
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};