export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString();
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};
