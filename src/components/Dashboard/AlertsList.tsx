import React, { useState } from 'react';
import { Alert, apiService } from '../../services/api';

interface AlertsListProps {
  alerts: Alert[];
  onAlertsUpdate: (alerts: Alert[]) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, onAlertsUpdate }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAcknowledge = async (alertId: string) => {
    setLoading(alertId);
    try {
      const updatedAlert = await apiService.acknowledgeAlert(alertId);
      onAlertsUpdate(alerts.map(alert => 
        alert.id === alertId ? updatedAlert : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setLoading(null);
    }
  };

  const getAlertIcon = (type: string) => {
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

  return (
    <div className="alerts-list">
      <div className="alerts-header">
        <h3>Recent Alerts</h3>
        <span className="alerts-count">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="no-alerts">
          <span className="no-alerts-icon">✅</span>
          <span className="no-alerts-text">No recent alerts</span>
        </div>
      ) : (
        <div className="alerts-container">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.status.toLowerCase()}`}>
              <div className="alert-header">
                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                <span className="alert-type">{alert.type}</span>
                <span 
                  className="alert-priority"
                  style={{ color: getPriorityColor(alert.priority) }}
                >
                  {alert.priority}
                </span>
              </div>
              
              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <div className="alert-details">
                  <span className="alert-time">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                  {alert.location && (
                    <span className="alert-location">
                      📍 {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {alert.status === 'ACTIVE' && (
                <button
                  className={`acknowledge-button ${loading === alert.id ? 'loading' : ''}`}
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={loading === alert.id}
                >
                  {loading === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};