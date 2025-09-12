import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, AuthTokens, Tourist } from '../services/api';

interface AuthContextType {
  user: Tourist | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: Tourist, tokens?: AuthTokens | null) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Tourist>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Tourist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const userProfile = await apiService.getProfile();
          if (userProfile) {
            setUser(userProfile);
          } else {
            // Profile is null, clear invalid token
            apiService.clearAuthTokens();
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Token is invalid, clear it
          apiService.clearAuthTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: Tourist, tokens?: AuthTokens | null) => {
    console.log('🔐 AUTH DEBUG: Login called with user:', userData);
    console.log('🔐 AUTH DEBUG: User role:', userData.role);
    console.log('🔐 AUTH DEBUG: User ID:', userData.id);
    console.log('🔐 AUTH DEBUG: User email:', userData.email);
    console.log('🔐 AUTH DEBUG: Setting user state...');
    setUser(userData);
    console.log('🔐 AUTH DEBUG: User state set successfully');
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updates: Partial<Tourist>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};