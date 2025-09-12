import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import './ProfessionalHeader.css';

export const ProfessionalHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="professional-header">
      <div className="header-container">
        {/* Logo and Title */}
        <div className="header-brand">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <h1 className="app-title">{t('app.title')}</h1>
          </div>
          <span className="subtitle">Smart Travel Protection</span>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <a href="#dashboard" className="nav-link active">
            <span className="nav-icon">📊</span>
            {t('nav.dashboard')}
          </a>
          <a href="#safety" className="nav-link">
            <span className="nav-icon">🛡️</span>
            {t('nav.safety')}
          </a>
          <a href="#map" className="nav-link">
            <span className="nav-icon">🗺️</span>
            {t('nav.map')}
          </a>
          <a href="#emergency" className="nav-link emergency">
            <span className="nav-icon">🚨</span>
            {t('nav.emergency')}
          </a>
        </nav>

        {/* User Section */}
        <div className="header-user">
          <LanguageSelector />
          
          <div className="user-info">
            <div className="user-avatar">
              <span>{user?.firstName?.charAt(0) || 'U'}</span>
            </div>
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">Tourist</span>
            </div>
          </div>

          <button onClick={logout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Emergency Strip */}
      <div className="emergency-strip">
        <div className="emergency-info">
          <span className="emergency-icon">🆘</span>
          <span className="emergency-text">Emergency: 112 | Tourist Helpline: 1363</span>
          <div className="safety-status">
            <span className="status-indicator safe"></span>
            <span>You are in a safe zone</span>
          </div>
        </div>
      </div>
    </header>
  );
};