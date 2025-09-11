interface LocationTrackerProps {
  currentLocation: Location | null;
  onLocationUpdate: (location: Location) => void;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  currentLocation,
  onLocationUpdate,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    // Start tracking on component mount
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setError('');
    setIsTracking(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000, // 1 minute
    };

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const location = await apiService.updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          onLocationUpdate(location);
        } catch (err) {
          console.error('Failed to update location:', err);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      },
      options
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <div className="location-tracker">
      <div className="tracker-header">
        <h3>📍 Location Tracking</h3>
        <button
          className={`tracking-toggle ${isTracking ? 'active' : ''}`}
          onClick={toggleTracking}
        >
          {isTracking ? 'Stop' : 'Start'}
        </button>
      </div>

      {error && (
        <div className="error-message small">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="location-info">
        {currentLocation ? (
          <>
            <div className="location-status">
              <span className={`status-indicator ${isTracking ? 'active' : 'inactive'}`}></span>
              <span className="status-text">
                {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
              </span>
            </div>
            
            <div className="location-details">
              <div className="detail-row">
                <span className="detail-label">Latitude:</span>
                <span className="detail-value">{currentLocation.latitude.toFixed(6)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Longitude:</span>
                <span className="detail-value">{currentLocation.longitude.toFixed(6)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Accuracy:</span>
                <span className="detail-value">{Math.round(currentLocation.accuracy)}m</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Update:</span>
                <span className="detail-value">
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {currentLocation.address && (
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{currentLocation.address}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-location">
            <span className="no-location-icon">📍</span>
            <span className="no-location-text">
              {isTracking ? 'Getting your location...' : 'Location not available'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};