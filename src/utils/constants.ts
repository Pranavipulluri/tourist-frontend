export const API_ENDPOINTS = {
  AUTH: '/auth',
  TOURISTS: '/tourists',
  LOCATIONS: '/locations',
  ALERTS: '/alerts',
  IOT: '/iot',
  DASHBOARD: '/dashboard',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const ALERT_TYPES = {
  SOS: 'SOS',
  PANIC: 'PANIC',
  GEOFENCE: 'GEOFENCE',
  SAFETY_CHECK: 'SAFETY_CHECK',
} as const;
