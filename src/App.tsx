import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { TouristDashboard } from './components/Dashboard/TouristDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ProfilePage } from './components/Profile/ProfilePage';
import { LocationHistory } from './components/Location/LocationHistory';
import { AlertsHistory } from './components/Alerts/AlertsHistory';
import { websocketService } from './services/websocket';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <span className="spinner large"></span>
          <p>Loading Tourist Safety App...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Request notification permission when app loads
    websocketService.requestNotificationPermission();

    // Setup global WebSocket event handlers
    websocketService.on('critical_alert', (alert) => {
      console.log('Critical alert received:', alert);
    });

    websocketService.on('connected', () => {
      console.log('WebSocket connected');
    });

    websocketService.on('disconnected', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      websocketService.off('critical_alert');
      websocketService.off('connected');
      websocketService.off('disconnected');
    };
  }, []);

  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LoginForm />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <RegisterForm />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'ADMIN' ? <AdminDashboard /> : <TouristDashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/location-history"
          element={
            <ProtectedRoute>
              <LocationHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts-history"
          element={
            <ProtectedRoute>
              <AlertsHistory />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="not-found">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/dashboard">Go to Dashboard</a>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

// Main App with Providers
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;