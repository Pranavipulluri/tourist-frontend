// Type definitions for alerts
export interface AlertType {
  SOS: 'SOS';
  PANIC: 'PANIC';
  GEOFENCE: 'GEOFENCE';
  SAFETY_CHECK: 'SAFETY_CHECK';
}

export interface AlertStatus {
  ACTIVE: 'ACTIVE';
  ACKNOWLEDGED: 'ACKNOWLEDGED';
  RESOLVED: 'RESOLVED';
}

export interface AlertPriority {
  LOW: 'LOW';
  MEDIUM: 'MEDIUM';
  HIGH: 'HIGH';
  CRITICAL: 'CRITICAL';
}
