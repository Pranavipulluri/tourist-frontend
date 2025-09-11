import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tourist, AuthTokens } from '../services/api';
import { apiService } from '../services/api';

interface AuthContextType {
  user: Tourist | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: Tourist, tokens: AuthTokens) => void;
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
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Token might be expired, let the interceptor handle it
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: Tourist, tokens: AuthTokens) => {
    setUser(userData);
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