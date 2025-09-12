// Core Types
export interface Tourist {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emergencyContact?: string;
  nationality?: string;
  passportNumber?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  safetyScore: number;
  emergencyContacts: EmergencyContact[];
  preferences: {
    language: string;
    notifications: boolean;
    locationSharing: boolean;
    emergencyAlerts: boolean;
  };
}

export interface Location {
  id: string;
  touristId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  address?: string;
}

export interface Alert {
  id: string;
  touristId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  source: string;
}

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceType: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER';
  deviceName: string;
  ownerId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'LOW_BATTERY';
  batteryLevel?: number;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface SafetyZone {
  id: string;
  name: string;
  type: 'safe' | 'danger' | 'restricted';
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

// Language Types
export type Language = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja';

export interface TranslationKey {
  [key: string]: string | TranslationKey;
}

export interface Translations {
  [lang: string]: TranslationKey;
}
