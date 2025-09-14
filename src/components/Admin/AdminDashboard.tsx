import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats } from '../../services/api';
import { hybridApiService } from '../../services/hybrid-api';
import { websocketService } from '../../services/websocket';
import './Admin.css';
import { AlertsHeatmap } from './AlertsHeatmap';
import { AlertsManagement } from './AlertsManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import { BlockchainMonitor } from './BlockchainMonitor';
import { ComplianceLogs } from './ComplianceLogs';
import { DigitalIDManager } from './DigitalIDManager';
import { FIRReview } from './FIRReview';
import { LiveFeed } from './LiveFeed';
import LiveMonitoring from './LiveMonitoring';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { ResourceManagement } from './ResourceManagement';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { SMSLogs } from './SMSLogs';
import { SOSManagement } from './SOSManagement';
import { TouristMonitoring } from './TouristMonitoring';
import { TouristsList } from './TouristsList';
import TouristTracking from './TouristTracking';
import { ZoneManagement } from './ZoneManagement';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'live-monitoring' | 'tracking' | 'tourists' | 'alerts' | 'sos' | 'analytics' | 'zones' | 'monitoring' | 'sms' | 'fir' | 'compliance' | 'resources' | 'predictions' | 'sentiment' | 'blockchain' | 'digital-id'
  >('overview');

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
      const data = await hybridApiService.getDashboardOverview();
      setStats(data);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      setError('Failed to load dashboard data. Please check your connection.');
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

  const handleRetry = () => {
    setError('');
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="loading-spinner" />
          <p className="loading-text">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Tourist Safety Control Center</h1>
            <p>Monitor and manage tourist safety across all locations</p>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <div className="admin-welcome">Welcome, {user?.firstName || 'Admin'}</div>
              <div className="admin-role">System Administrator</div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-tabs">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="tab-icon">📊</span>
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'live-monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('live-monitoring')}
          >
            <span className="tab-icon">📡</span>
            Live Monitoring
          </button>
          <button
            className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            <span className="tab-icon">🎯</span>
            Tourist Tracking
          </button>
          <button
            className={`tab-button ${activeTab === 'tourists' ? 'active' : ''}`}
            onClick={() => setActiveTab('tourists')}
          >
            <span className="tab-icon">👥</span>
            Tourists
          </button>
          <button
            className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <span className="tab-icon">👁️</span>
            Basic Monitoring
          </button>
          <button
            className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <span className="tab-icon">🚨</span>
            Alerts
          </button>
          <button
            className={`tab-button ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <span className="tab-icon">🆘</span>
            Emergency
          </button>
          <button
            className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <span className="tab-icon">🗺️</span>
            Zones
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="tab-icon">📈</span>
            Analytics
          </button>
          <button
            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <span className="tab-icon">🚔</span>
            Resources
          </button>
          <button
            className={`tab-button ${activeTab === 'sms' ? 'active' : ''}`}
            onClick={() => setActiveTab('sms')}
          >
            <span className="tab-icon">📱</span>
            SMS
          </button>
          <button
            className={`tab-button ${activeTab === 'fir' ? 'active' : ''}`}
            onClick={() => setActiveTab('fir')}
          >
            <span className="tab-icon">📋</span>
            FIR
          </button>
          <button
            className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            <span className="tab-icon">🔮</span>
            Predictions
          </button>
          <button
            className={`tab-button ${activeTab === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActiveTab('sentiment')}
          >
            <span className="tab-icon">🎭</span>
            Sentiment
          </button>
          <button
            className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            <span className="tab-icon">📝</span>
            Compliance
          </button>
          <button
            className={`tab-button ${activeTab === 'blockchain' ? 'active' : ''}`}
            onClick={() => setActiveTab('blockchain')}
          >
            <span className="tab-icon">🔗</span>
            Blockchain
          </button>
          <button
            className={`tab-button ${activeTab === 'digital-id' ? 'active' : ''}`}
            onClick={() => setActiveTab('digital-id')}
          >
            <span className="tab-icon">🆔</span>
            Digital ID
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Dashboard Statistics */}
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
                    <div className="stat-icon">
                      👥
                    </div>
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
                    <div className="stat-icon">
                      🚨
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number">{stats.resolvedAlerts}</div>
                      <div className="stat-label">Resolved Today</div>
                      <div className="stat-trend trend-up">
                        ↗ {Math.round((stats.resolvedAlerts / Math.max(stats.totalAlerts, 1)) * 100)}% rate
                      </div>
                    </div>
                    <div className="stat-icon">
                      ✅
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number">24/7</div>
                      <div className="stat-label">System Status</div>
                      <div className="stat-trend trend-up">
                        ↗ 99.9% uptime
                      </div>
                    </div>
                    <div className="stat-icon">
                      ⚡
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Sections */}
            <div className="admin-sections">
              <section className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">📡</span>
                  Live Activity Feed
                </h3>
                <div className="section-content">
                  <LiveFeed />
                </div>
              </section>

              <section className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">🗺️</span>
                  Alerts Heatmap
                </h3>
                <div className="section-content">
                  <AlertsHeatmap />
                </div>
              </section>

              <section className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">⚡</span>
                  Quick Actions
                </h3>
                <div className="section-content">
                  <p>Quickly access common administrative tasks and emergency functions.</p>
                  <div className="quick-actions">
                    <button className="action-btn" onClick={() => setActiveTab('tourists')}>
                      <span>👥</span>
                      View All Tourists
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('alerts')}>
                      <span>🚨</span>
                      Manage Alerts
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('sos')}>
                      <span>🆘</span>
                      Emergency Console
                    </button>
                    <button className="action-btn secondary" onClick={loadDashboardData}>
                      <span>🔄</span>
                      Refresh Data
                    </button>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <h3 className="section-title">
                  <span className="section-icon">📊</span>
                  System Health
                </h3>
                <div className="section-content">
                  <p>Monitor system performance and status indicators.</p>
                  <div className="quick-actions">
                    <button className="action-btn secondary" onClick={() => setActiveTab('analytics')}>
                      <span>📈</span>
                      View Analytics
                    </button>
                    <button className="action-btn secondary" onClick={() => setActiveTab('zones')}>
                      <span>🗺️</span>
                      Zone Status
                    </button>
                    <button className="action-btn secondary" onClick={() => setActiveTab('compliance')}>
                      <span>📝</span>
                      Compliance Logs
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'live-monitoring' && <LiveMonitoring />}
        {activeTab === 'tracking' && <TouristTracking />}
        {activeTab === 'tourists' && <TouristsList />}
        {activeTab === 'monitoring' && <TouristMonitoring />}
        {activeTab === 'alerts' && <AlertsManagement />}
        {activeTab === 'sos' && <SOSManagement />}
        {activeTab === 'zones' && <ZoneManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'resources' && <ResourceManagement />}
        {activeTab === 'sms' && <SMSLogs />}
        {activeTab === 'fir' && <FIRReview />}
        {activeTab === 'predictions' && <PredictiveAnalytics />}
        {activeTab === 'sentiment' && <SentimentAnalyzer />}
        {activeTab === 'compliance' && <ComplianceLogs />}
        {activeTab === 'blockchain' && <BlockchainMonitor />}
        {activeTab === 'digital-id' && <DigitalIDManager />}
      </main>
    </div>
  );
};