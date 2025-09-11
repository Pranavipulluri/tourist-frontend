const AlertsManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      // This would be a new endpoint to get all alerts (admin only)
      const response = await apiService.api.get('/admin/alerts', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await apiService.api.put(`/admin/alerts/${alertId}/resolve`);
      loadAlerts(); // Reload alerts
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ff4444';
      case 'HIGH': return '#ff8800';
      case 'MEDIUM': return '#ffbb00';
      case 'LOW': return '#00bb00';
      default: return '#666666';
    }
  };

  return (
    <div className="alerts-management">
      <div className="alerts-header">
        <h3>🚨 Alert Management</h3>
        <div className="alerts-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </button>
          <button
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-button ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="alerts-loading">
          <span className="spinner"></span>
          Loading alerts...
        </div>
      ) : (
        <div className="alerts-grid">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.status.toLowerCase()}`}>
              <div className="alert-card-header">
                <span className="alert-type">{alert.type}</span>
                <span 
                  className="alert-priority"
                  style={{ color: getPriorityColor(alert.priority) }}
                >
                  {alert.priority}
                </span>
              </div>
              
              <div className="alert-card-content">
                <p className="alert-message">{alert.message}</p>
                <div className="alert-details">
                  <span>Tourist: {alert.touristName}</span>
                  <span>Time: {new Date(alert.createdAt).toLocaleString()}</span>
                  {alert.location && (
                    <span>
                      Location: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {alert.status === 'ACTIVE' && (
                <div className="alert-card-actions">
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="resolve-button"
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};