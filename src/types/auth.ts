export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'TOURIST' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emergencyContact: string;
  nationality: string;
  passportNumber: string;
}
