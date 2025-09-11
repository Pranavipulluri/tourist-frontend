export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationData {
  id: string;
  touristId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: string;
  createdAt: string;
}

export interface GeofenceArea {
  id: string;
  name: string;
  type: 'SAFE_ZONE' | 'WARNING_ZONE' | 'RESTRICTED_ZONE';
  coordinates: LocationCoordinates[];
  radius?: number;
  isActive: boolean;
}
