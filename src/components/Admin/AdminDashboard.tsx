import React, { useEffect, useState } from 'react';
import { apiService, DashboardStats } from '../../services/api';
import { websocketService } from '../../services/websocket';
import './Admin.css';
import { AlertsHeatmap } from './AlertsHeatmap';
import { AlertsManagement } from './AlertsManagement';
import { LiveFeed } from './LiveFeed';
import { StatisticsPanel } from './StatisticsPanel';
import { TouristsList } from './TouristsList';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'tourists' | 'alerts' | 'analytics'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Setup WebSocket listeners for real-time updates
    websocketService.on('new_alert', handleNewAlert);
    websocketService.on('location_updated', handleLocationUpdate);

    return () => {
      websocketService.off('new_alert');
      websocketService.off('location_updated');
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await apiService.getDashboardOverview();
      setStats(statsData);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Admin dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAlert = (alert: any) => {
    // Update stats when new alert comes in
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        totalAlerts: prev.totalAlerts + 1,
        activeAlerts: prev.activeAlerts + 1,
      } : prev);
    }
  };

  const handleLocationUpdate = (data: any) => {
    console.log('Location updated:', data);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">
          <span className="spinner large"></span>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Tourist Safety Control Center</h1>
        <p>Monitor and manage tourist safety across all locations</p>
        
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

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'tourists' ? 'active' : ''}`}
          onClick={() => setActiveTab('tourists')}
        >
          👥 Tourists
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {stats && (
              <div className="stats-overview">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{stats.totalTourists}</h3>
                    <p>Total Tourists</p>
                    <span className="stat-subtitle">
                      {stats.activeTourists} currently active
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🚨</div>
                  <div className="stat-content">
                    <h3>{stats.activeAlerts}</h3>
                    <p>Active Alerts</p>
                    <span className="stat-subtitle">
                      {stats.totalAlerts} total alerts
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{stats.resolvedAlerts}</h3>
                    <p>Resolved Alerts</p>
                    <span className="stat-subtitle">
                      {Math.round((stats.resolvedAlerts / Math.max(stats.totalAlerts, 1)) * 100)}% resolution rate
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <h3>{Math.round(stats.averageResponseTime)}m</h3>
                    <p>Avg Response Time</p>
                    <span className="stat-subtitle">
                      Last 24 hours
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="overview-grid">
              <div className="overview-card">
                <LiveFeed />
              </div>
              <div className="overview-card">
                <AlertsHeatmap />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tourists' && (
          <div className="tourists-tab">
            <TouristsList />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-tab">
            <AlertsManagement />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <StatisticsPanel />
          </div>
        )}
      </div>
    </div>
  );
};