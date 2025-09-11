import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocket';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(websocketService.getConnectionState());

  const handleLogout = async () => {
    await logout();
    websocketService.disconnect();
    navigate('/login');
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#2ecc71';
      case 'connecting': return '#f39c12';
      case 'disconnected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">🛡️ Tourist Safety</h1>
        <div className="connection-status">
          <span 
            className="status-dot"
            style={{ backgroundColor: getConnectionStatusColor(connectionStatus) }}
          ></span>
          <span className="status-text">{connectionStatus}</span>
        </div>
      </div>

      <nav className="header-nav">
        <button onClick={() => navigate('/dashboard')} className="nav-button">
          Dashboard
        </button>
        <button onClick={() => navigate('/location-history')} className="nav-button">
          Locations
        </button>
        <button onClick={() => navigate('/alerts-history')} className="nav-button">
          Alerts
        </button>
        <button onClick={() => navigate('/profile')} className="nav-button">
          Profile
        </button>
      </nav>

      <div className="header-right">
        <div className="user-menu">
          <button 
            className="user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="user-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <button 
                onClick={() => navigate('/profile')}
                className="dropdown-item"
              >
                Profile Settings
              </button>
              <button 
                onClick={handleLogout}
                className="dropdown-item logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};