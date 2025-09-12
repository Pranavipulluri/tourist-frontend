import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DashboardStats } from '../../services/api';
import { websocketService } from '../../services/websocket';
import './Admin.css';
import { AlertsHeatmap } from './AlertsHeatmap';
import { AlertsManagement } from './AlertsManagement';
import { ComplianceLogs } from './ComplianceLogs';
import { FIRReview } from './FIRReview';
import { LiveFeed } from './LiveFeed';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { ResourceManagement } from './ResourceManagement';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { SMSLogs } from './SMSLogs';
import { SOSManagement } from './SOSManagement';
import { StatisticsPanel } from './StatisticsPanel';
import { TouristMonitoring } from './TouristMonitoring';
import { TouristsList } from './TouristsList';
import { ZoneManagement } from './ZoneManagement';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'tourists' | 'alerts' | 'sos' | 'analytics' | 'zones' | 'monitoring'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Setup WebSocket listeners for real-time updates
    websocketService.on('new_alert', handleNewAlert);

    return () => {
      websocketService.off('new_alert');
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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
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
      {/* Modern Header Section */}
      <div className="admin-header">
        <div className="admin-title">Tourist Safety Control Center</div>
        <div className="admin-subtitle">Monitor and manage tourist safety across all locations</div>
        
        <div className="header-actions">
          <div className="admin-info">
            <span className="admin-welcome">Welcome, {user?.firstName || 'Admin'}</span>
            <span className="admin-role">System Administrator</span>
          </div>
          <button className="action-btn danger" onClick={handleLogout}>
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Slim Alert Banner */}
      {error && (
        <div className="alert-banner">
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">{error}</span>
          <button onClick={loadDashboardData} className="action-btn">
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>📊</span> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'tourists' ? 'active' : ''}`}
          onClick={() => setActiveTab('tourists')}
        >
          <span>👥</span> Tourists
        </button>
        <button
          className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <span>🎯</span> Live Monitoring
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <span>🚨</span> Alerts
        </button>
        <button
          className={`tab-button ${activeTab === 'sos' ? 'active' : ''}`}
          onClick={() => setActiveTab('sos')}
        >
          <span>🆘</span> Emergency
        </button>
        <button
          className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          <span>🗺️</span> Zones
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span>�</span> Analytics
        </button>
      </div>

      {/* Main Content Area */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Dashboard Statistics Cards */}
            {stats && (
              <div className="admin-stats">
                <div className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number">{stats.totalTourists}</div>
                      <div className="stat-label">Total Tourists</div>
                      <div className="stat-trend trend-up">
                        ↗ {stats.activeTourists} active
                      </div>
                    </div>
                    <div className="stat-icon">👥</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number">{stats.activeAlerts}</div>
                      <div className="stat-label">Active Alerts</div>
                      <div className="stat-trend">
                        {stats.totalAlerts} total
                      </div>
                    </div>
                    <div className="stat-icon">🚨</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number">{stats.resolvedAlerts}</div>
                      <div className="stat-label">Resolved</div>
                      <div className="stat-trend trend-up">
                        ↗ {Math.round((stats.resolvedAlerts / Math.max(stats.totalAlerts, 1)) * 100)}% rate
                      </div>
                    </div>
                    <div className="stat-icon">✅</div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Sections */}
            <div className="admin-sections">
              <div className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">�</span>
                  Live Activity Feed
                </h3>
                <div className="section-content">
                  <LiveFeed />
                </div>
              </div>

              <div className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">🗺️</span>
                  Alerts Heatmap
                </h3>
                <div className="section-content">
                  <AlertsHeatmap />
                </div>
              </div>

              <div className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">⚡</span>
                  Quick Actions
                </h3>
                <div className="section-content">
                  <p>Quickly access common administrative tasks and emergency functions.</p>
                  <div className="quick-actions">
                    <button className="action-btn" onClick={() => setActiveTab('tourists')}>
                      <span>👥</span> View All Tourists
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('alerts')}>
                      <span>🚨</span> Manage Alerts
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('sos')}>
                      <span>🆘</span> Emergency Console
                    </button>
                    <button className="action-btn secondary" onClick={loadDashboardData}>
                      <span>🔄</span> Refresh Data
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">📊</span>
                  System Health
                </h3>
                <div className="section-content">
                  <p>Monitor system performance and status indicators.</p>
                  <div className="quick-actions">
                    <button className="action-btn secondary" onClick={() => setActiveTab('analytics')}>
                      <span>📈</span> View Analytics
                    </button>
                    <button className="action-btn secondary" onClick={() => setActiveTab('zones')}>
                      <span>🗺️</span> Zone Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tourists' && (
          <div className="admin-section">
            <TouristsList />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="admin-section">
            <TouristMonitoring />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="admin-section">
            <AlertsManagement />
          </div>
        )}

        {activeTab === 'sos' && (
          <div className="admin-section">
            <SOSManagement />
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="admin-section">
            <ZoneManagement />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="admin-section">
            <StatisticsPanel />
          </div>
        )}
      </div>
    </div>
  );
};