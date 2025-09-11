interface EmergencyPanelProps {
  currentLocation: Location | null;
  onAlertCreated: (alert: Alert) => void;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({ 
  currentLocation, 
  onAlertCreated 
}) => {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSOSPress = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const location = currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      } : undefined;

      const alert = await apiService.triggerSOS(location);
      setIsSOSActive(true);
      setCountdown(300); // 5 minutes
      onAlertCreated(alert);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

    } catch (error) {
      console.error('SOS trigger failed:', error);
      alert('Failed to send SOS alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePanicPress = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const alert = await apiService.triggerPanic('Panic button pressed');
      onAlertCreated(alert);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

    } catch (error) {
      console.error('Panic trigger failed:', error);
      alert('Failed to send panic alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-panel">
      <div className="emergency-header">
        <h3>🚨 Emergency Controls</h3>
        <p>Tap for immediate assistance</p>
      </div>

      <div className="emergency-buttons">
        <button
          className={`sos-button ${isSOSActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleSOSPress}
          disabled={loading}
        >
          <div className="button-content">
            <span className="button-icon">🆘</span>
            <span className="button-text">
              {loading ? 'Sending...' : isSOSActive ? 'SOS ACTIVE' : 'SOS'}
            </span>
            {countdown > 0 && (
              <span className="countdown">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
            )}
          </div>
          {isSOSActive && <div className="pulse-ring"></div>}
        </button>

        <button
          className={`panic-button ${loading ? 'loading' : ''}`}
          onClick={handlePanicPress}
          disabled={loading}
        >
          <div className="button-content">
            <span className="button-icon">🚨</span>
            <span className="button-text">
              {loading ? 'Sending...' : 'PANIC'}
            </span>
          </div>
        </button>
      </div>

      <div className="emergency-info">
        <div className="info-item">
          <span className="info-icon">📍</span>
          <span className="info-text">
            {currentLocation 
              ? `Location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
              : 'Location: Not available'
            }
          </span>
        </div>
        <div className="info-item">
          <span className="info-icon">📞</span>
          <span className="info-text">Emergency services will be notified</span>
        </div>
      </div>
    </div>
  );
};