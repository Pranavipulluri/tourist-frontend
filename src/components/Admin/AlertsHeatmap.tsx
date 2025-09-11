export const AlertsHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapBounds] = useState({
    northEast: { lat: 28.7041, lng: 77.1025 }, // Delhi area bounds
    southWest: { lat: 28.4089, lng: 76.8473 },
  });

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    try {
      const data = await apiService.getAlertHeatmap(mapBounds);
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alerts-heatmap">
      <div className="heatmap-header">
        <h3>🗺️ Alerts Heatmap</h3>
        <button onClick={loadHeatmapData} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="heatmap-loading">
          <span className="spinner"></span>
          Loading map data...
        </div>
      ) : (
        <div className="heatmap-container">
          <div className="map-placeholder">
            <div className="map-info">
              <h4>Alert Distribution</h4>
              <p>{heatmapData.length} alert zones detected</p>
            </div>
            
            <div className="heatmap-legend">
              <div className="legend-item">
                <span className="legend-color high"></span>
                High Activity
              </div>
              <div className="legend-item">
                <span className="legend-color medium"></span>
                Medium Activity
              </div>
              <div className="legend-item">
                <span className="legend-color low"></span>
                Low Activity
              </div>
            </div>

            <div className="heatmap-stats">
              {heatmapData.slice(0, 5).map((point, index) => (
                <div key={index} className="stat-row">
                  <span className="location">
                    📍 {point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}
                  </span>
                  <span className="count">{point.alertCount} alerts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};