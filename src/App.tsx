import React, { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AlertsHistory } from './components/Alerts/AlertsHistory';
import APITest from './components/APITest';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { TouristDashboard } from './components/Dashboard/TouristDashboard';
import { LocationHistory } from './components/Location/LocationHistory';
import { ProfilePage } from './components/Profile/ProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { websocketService } from './services/websocket';

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
      {/* Remove ProfessionalHeader for mobile-first design */}
      <div className="app-content mobile-content">
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
              {(() => {
                console.log('🚦 ROUTING DEBUG: Current user:', user);
                console.log('🚦 ROUTING DEBUG: User role:', user?.role);
                console.log('🚦 ROUTING DEBUG: Is user role ADMIN?', user?.role === 'ADMIN');
                console.log('🚦 ROUTING DEBUG: Is user role TOURIST?', user?.role === 'TOURIST');
                console.log('🚦 ROUTING DEBUG: Rendering:', user?.role === 'ADMIN' ? 'AdminDashboard' : 'TouristDashboard');
                
                if (user?.role === 'ADMIN') {
                  console.log('🛡️ ADMIN ROUTE: Loading Admin Dashboard for user:', user?.firstName, user?.lastName);
                  return <AdminDashboard />;
                } else {
                  console.log('🎒 TOURIST ROUTE: Loading Tourist Dashboard for user:', user?.firstName, user?.lastName);
                  return <TouristDashboard />;
                }
              })()}
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
        <Route
          path="/api-test"
          element={<APITest />}
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
    </div>
  );
};

// Main App with Providers
const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;