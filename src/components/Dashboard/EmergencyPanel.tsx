import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Location as ApiLocation } from '../../services/api';
import { emergencyResponseService } from '../../services/emergencyResponse';

interface EmergencyPanelProps {
  currentLocation: ApiLocation | null;
  onAlertCreated: (alert: Alert) => void;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({ 
  currentLocation, 
  onAlertCreated 
}) => {
  const { user } = useAuth();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev: number) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSOSPress = async () => {
    if (loading) return;

    if (!user) {
      alert('You must be logged in to send an SOS alert');
      return;
    }

    if (!currentLocation) {
      alert('Location not available. Please wait for GPS to load.');
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        type: 'SOS' as const,
        message: 'Emergency SOS Alert - Immediate assistance needed',
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        severity: 'CRITICAL' as const
      };

      const emergencyAlert = await emergencyResponseService.triggerEmergencyAlert(alertData);
      
      // Convert EmergencyAlert to Alert format for compatibility
      const alert: Alert = {
        id: emergencyAlert.id,
        touristId: emergencyAlert.touristId,
        type: 'SOS',
        severity: emergencyAlert.severity,
        message: emergencyAlert.message,
        status: emergencyAlert.status === 'DISPATCHED' ? 'ACTIVE' : emergencyAlert.status,
        latitude: emergencyAlert.location.latitude,
        longitude: emergencyAlert.location.longitude,
        address: emergencyAlert.location.address,
        createdAt: emergencyAlert.createdAt,
        updatedAt: emergencyAlert.createdAt,
        resolvedAt: emergencyAlert.resolvedAt
      };

      setIsSOSActive(true);
      setCountdown(300); // 5 minutes
      onAlertCreated(alert);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

    } catch (error) {
      console.error('SOS trigger failed:', error);
      alert('Failed to send SOS alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePanicPress = async () => {
    if (loading) return;

    if (!user) {
      alert('You must be logged in to send a panic alert');
      return;
    }

    if (!currentLocation) {
      alert('Location not available. Please wait for GPS to load.');
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        type: 'PANIC' as const,
        message: 'Panic Alert - Tourist in distress',
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        severity: 'HIGH' as const
      };

      const emergencyAlert = await emergencyResponseService.triggerEmergencyAlert(alertData);
      
      // Convert EmergencyAlert to Alert format for compatibility
      const alert: Alert = {
        id: emergencyAlert.id,
        touristId: emergencyAlert.touristId,
        type: 'PANIC',
        severity: emergencyAlert.severity,
        message: emergencyAlert.message,
        status: emergencyAlert.status === 'DISPATCHED' ? 'ACTIVE' : emergencyAlert.status,
        latitude: emergencyAlert.location.latitude,
        longitude: emergencyAlert.location.longitude,
        address: emergencyAlert.location.address,
        createdAt: emergencyAlert.createdAt,
        updatedAt: emergencyAlert.createdAt,
        resolvedAt: emergencyAlert.resolvedAt
      };

      onAlertCreated(alert);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

    } catch (error) {
      console.error('Panic trigger failed:', error);
      alert('Failed to send panic alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-panel">
      <div className="emergency-header">
        <h3>🚨 Emergency Controls</h3>
        <p>Tap for immediate assistance</p>
      </div>

      <div className="emergency-buttons">
        <button
          className={`sos-button ${isSOSActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleSOSPress}
          disabled={loading}
        >
          <div className="button-content">
            <span className="button-icon">🆘</span>
            <span className="button-text">
              {loading ? 'Sending...' : isSOSActive ? 'SOS ACTIVE' : 'SOS'}
            </span>
            {countdown > 0 && (
              <span className="countdown">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
            )}
          </div>
          {isSOSActive && <div className="pulse-ring"></div>}
        </button>

        <button
          className={`panic-button ${loading ? 'loading' : ''}`}
          onClick={handlePanicPress}
          disabled={loading}
        >
          <div className="button-content">
            <span className="button-icon">🚨</span>
            <span className="button-text">
              {loading ? 'Sending...' : 'PANIC'}
            </span>
          </div>
        </button>
      </div>

      <div className="emergency-info">
        <div className="info-item">
          <span className="info-icon">📍</span>
          <span className="info-text">
            {currentLocation 
              ? `Location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
              : 'Location: Not available'
            }
          </span>
        </div>
        <div className="info-item">
          <span className="info-icon">📞</span>
          <span className="info-text">Emergency services will be notified</span>
        </div>
      </div>
    </div>
  );
};