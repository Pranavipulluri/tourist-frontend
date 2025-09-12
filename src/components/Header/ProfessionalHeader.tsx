import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import './ProfessionalHeader.css';

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

interface ProfessionalHeaderProps {
  user?: User;
  onLogout?: () => void;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ 
  user, 
  onLogout 
}) => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t.common.goodMorning || 'Good Morning';
    if (hour < 17) return t.common.goodAfternoon || 'Good Afternoon';
    return t.common.goodEvening || 'Good Evening';
  };

  return (
    <header className="professional-header">
      {/* Emergency Alert Strip */}
      <div className="emergency-strip">
        <div className="emergency-content">
          <span className="emergency-icon">🚨</span>
          <span className="emergency-text">
            {t.emergency?.helpline || 'Emergency Helpline'}: 
            <strong> 100 (Police) | 108 (Ambulance) | 101 (Fire)</strong>
          </span>
          <div className="emergency-actions">
            <button className="emergency-btn quick-call">
              📞 {t.emergency?.quickCall || 'Quick Call'}
            </button>
            <div className="safety-status">
              <span className="status-indicator safe"></span>
              <span>{t.dashboard?.safe || 'Safe Zone'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="header-main">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">🛡️</span>
              <div className="logo-text">
                <h1>{t.common?.appName || 'Tourist Safety'}</h1>
                <span className="tagline">{t.common?.tagline || 'Your Safety, Our Priority'}</span>
              </div>
            </div>
          </div>

          <nav className="main-navigation">
            <button className="nav-item active">
              🏠 {t.dashboard?.overview || 'Dashboard'}
            </button>
            <button className="nav-item">
              🗺️ {t.common?.map || 'Map'}
            </button>
            <button className="nav-item">
              🛡️ {t.safety?.safety || 'Safety'}
            </button>
            <button className="nav-item">
              🚨 {t.emergency?.emergency || 'Emergency'}
            </button>
          </nav>
        </div>

        <div className="header-center">
          <div className="time-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="header-right">
          <div className="header-controls">
            <LanguageSelector />
            
            <div className="notifications">
              <button className="notification-btn">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">3</span>
              </button>
            </div>

            <div className="user-section">
              <div className="user-info">
                <div className="greeting">{getGreeting()}</div>
                <div className="user-name">
                  {user ? `${user.firstName} ${user.lastName}` : 'Tourist User'}
                </div>
              </div>
              
              <div className="user-menu">
                <button 
                  className="user-avatar"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User Avatar" />
                  ) : (
                    <div className="default-avatar">
                      {user?.firstName?.charAt(0) || '👤'}
                    </div>
                  )}
                </button>

                {isMenuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="user-details">
                        <strong>{user?.firstName} {user?.lastName}</strong>
                        <small>{user?.email}</small>
                      </div>
                    </div>
                    <div className="dropdown-menu">
                      <button className="menu-item">
                        👤 {t.common?.profile || 'Profile'}
                      </button>
                      <button className="menu-item">
                        ⚙️ {t.common?.settings || 'Settings'}
                      </button>
                      <button className="menu-item">
                        📊 {t.common?.analytics || 'Analytics'}
                      </button>
                      <button className="menu-item">
                        🆘 {t.emergency?.contacts || 'Emergency Contacts'}
                      </button>
                      <div className="menu-divider"></div>
                      <button className="menu-item logout" onClick={onLogout}>
                        🚪 {t.common?.logout || 'Logout'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Strip */}
      <div className="location-strip">
        <div className="location-content">
          <div className="current-location">
            <span className="location-icon">📍</span>
            <span className="location-text">
              <strong>{t.dashboard?.currentLocation || 'Current Location'}:</strong> 
              Khan Market, New Delhi, India
            </span>
            <span className="location-accuracy">±5m</span>
          </div>

          <div className="weather-info">
            <span className="weather-icon">🌤️</span>
            <span className="temperature">28°C</span>
            <span className="weather-desc">Partly Cloudy</span>
          </div>

          <div className="safety-metrics">
            <div className="metric">
              <span className="metric-label">{t.dashboard?.safetyScore || 'Safety'}:</span>
              <span className="metric-value safe">8.5/10</span>
            </div>
            <div className="metric">
              <span className="metric-label">{t.common?.crowd || 'Crowd'}:</span>
              <span className="metric-value moderate">Moderate</span>
            </div>
            <div className="metric">
              <span className="metric-label">{t.common?.police || 'Police'}:</span>
              <span className="metric-value good">Nearby</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};