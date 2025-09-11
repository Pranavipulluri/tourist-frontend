import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Alert, Location, IoTDevice } from '../../services/api';
import { LocationTracker } from './LocationTracker';
import { EmergencyPanel } from './EmergencyPanel';
import { AlertsList } from './AlertsList';
import { DeviceStatus } from './DeviceStatus';
import { DigitalID } from './DigitalID';
import './Dashboard.css';

export const TouristDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [device, setDevice] = useState<IoTDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [locationData, alertsData, deviceData] = await Promise.allSettled([
        apiService.getCurrentLocation(),
        apiService.getMyAlerts('ACTIVE', 5),
        apiService.getMyDevice(),
      ]);

      if (locationData.status === 'fulfilled') {
        setCurrentLocation(locationData.value);
      }

      if (alertsData.status === 'fulfilled') {
        setRecentAlerts(alertsData.value.alerts);
      }

      if (deviceData.status === 'fulfilled') {
        setDevice(deviceData.value);
      }

    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (location: Location) => {
    setCurrentLocation(location);
  };

  const handleAlertCreated = (alert: Alert) => {
    setRecentAlerts(prev => [alert, ...prev.slice(0, 4)]);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <span className="spinner large"></span>
          <p>Loading your safety dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>Your safety is our priority. Stay connected, stay safe.</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={loadDashboardData} className="retry-button">
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Emergency Panel - Most Important */}
        <div className="dashboard-card emergency-card">
          <EmergencyPanel 
            currentLocation={currentLocation}
            onAlertCreated={handleAlertCreated}
          />
        </div>

        {/* Location Tracker */}
        <div className="dashboard-card location-card">
          <LocationTracker 
            currentLocation={currentLocation}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>

        {/* Device Status */}
        <div className="dashboard-card device-card">
          <DeviceStatus 
            device={device}
            onDeviceUpdate={setDevice}
          />
        </div>

        {/* Digital ID */}
        <div className="dashboard-card id-card">
          <DigitalID />
        </div>

        {/* Recent Alerts */}
        <div className="dashboard-card alerts-card">
          <AlertsList 
            alerts={recentAlerts}
            onAlertsUpdate={setRecentAlerts}
          />
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card stats-card">
          <div className="stats-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Location Updates</span>
              <span className="stat-value">
                {currentLocation ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Alerts</span>
              <span className="stat-value">
                {recentAlerts.filter(a => a.status === 'ACTIVE').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Device Status</span>
              <span className="stat-value">
                {device?.isActive ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};