import {
    Activity,
    AlertTriangle,
    Download,
    MapPin,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hybridApiService } from '../../services/hybrid-api';

interface HeatmapData {
  totalAlerts: number;
  hotspots: Array<{
    lat: number;
    lng: number;
    weight: number;
    alertCount: number;
    averageSeverity: string;
    location: string;
    recentAlerts: number;
    severityWeights: {
      critical?: number;
      high?: number;
      medium?: number;
      low?: number;
    };
  }>;
  alertsByType: {
    [key: string]: number;
  };
  alertsBySeverity: {
    [key: string]: number;
  };
  timeSeriesData: Array<{
    timestamp: string;
    count: number;
  }>;
}

export const AlertsHeatmap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock data for demonstration
  const mockHeatmapData: HeatmapData = {
    totalAlerts: 342,
    hotspots: [
      {
        lat: 28.7041,
        lng: 77.1025,
        weight: 0.8,
        alertCount: 15,
        averageSeverity: 'high',
        location: 'Connaught Place',
        recentAlerts: 3,
        severityWeights: { critical: 2, high: 8, medium: 4, low: 1 }
      },
      {
        lat: 28.6139,
        lng: 77.2090,
        weight: 0.6,
        alertCount: 12,
        averageSeverity: 'medium',
        location: 'India Gate',
        recentAlerts: 2,
        severityWeights: { critical: 1, high: 3, medium: 6, low: 2 }
      },
      {
        lat: 28.6562,
        lng: 77.2410,
        weight: 0.9,
        alertCount: 20,
        averageSeverity: 'critical',
        location: 'Red Fort',
        recentAlerts: 5,
        severityWeights: { critical: 5, high: 10, medium: 4, low: 1 }
      }
    ],
    alertsByType: {
      SOS: 45,
      PANIC: 67,
      GEOFENCE: 89,
      SAFETY_CHECK: 34,
      MEDICAL: 23,
      THEFT: 56
    },
    alertsBySeverity: {
      critical: 78,
      high: 134,
      medium: 89,
      low: 41
    },
    timeSeriesData: [
      { timestamp: '2024-01-01T00:00:00Z', count: 12 },
      { timestamp: '2024-01-01T01:00:00Z', count: 8 },
      { timestamp: '2024-01-01T02:00:00Z', count: 15 }
    ]
  };

  const loadGoogleMaps = useCallback(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (mapRef.current) {
          initializeMap();
        }
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 28.7041, lng: 77.1025 },
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    if (heatmapData && window.google.maps.visualization) {
      const heatmapPoints = heatmapData.hotspots.map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        weight: point.weight
      }));

      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapPoints,
        map: map,
        radius: 50,
        opacity: 0.8
      });

      // Add markers for hotspots
      heatmapData.hotspots.forEach(hotspot => {
        const marker = new window.google.maps.Marker({
          position: { lat: hotspot.lat, lng: hotspot.lng },
          map: map,
          title: `${hotspot.location}: ${hotspot.alertCount} alerts`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getSeverityColor(hotspot.averageSeverity),
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3">
              <h3 class="font-bold text-lg">${hotspot.location}</h3>
              <p><strong>Alert Count:</strong> ${hotspot.alertCount}</p>
              <p><strong>Severity:</strong> ${hotspot.averageSeverity}</p>
              <p><strong>Recent Alerts:</strong> ${hotspot.recentAlerts}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    }
  };

  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch real data from Supabase
      const data = await hybridApiService.getHeatmapData();
      
      // Transform the data to match our interface
      const transformedData: HeatmapData = {
        totalAlerts: data.totalAlerts || 0,
        hotspots: data.hotspots?.map((hotspot: any) => ({
          lat: hotspot.latitude,
          lng: hotspot.longitude,
          weight: hotspot.severity || 1,
          alertCount: hotspot.alertCount || 1,
          averageSeverity: hotspot.severity === 4 ? 'CRITICAL' : 
                          hotspot.severity === 3 ? 'HIGH' : 
                          hotspot.severity === 2 ? 'MEDIUM' : 'LOW',
          location: `${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}`,
          recentAlerts: hotspot.alertCount || 1,
          severityWeights: {
            critical: hotspot.severity === 4 ? hotspot.alertCount : 0,
            high: hotspot.severity === 3 ? hotspot.alertCount : 0,
            medium: hotspot.severity === 2 ? hotspot.alertCount : 0,
            low: hotspot.severity === 1 ? hotspot.alertCount : 0,
          }
        })) || [],
        alertsByType: data.alertsByType || {},
        alertsBySeverity: data.alertsBySeverity || {},
        timeSeriesData: [] // Add time series data if available
      };
      
      setHeatmapData(transformedData);
      
    } catch (err) {
      setError('Failed to load heatmap data. Please try again.');
      console.error('Heatmap data fetch error:', err);
      
      // Fallback to mock data on error
      setHeatmapData(mockHeatmapData);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportHeatmapData = () => {
    if (!heatmapData) return;
    
    const dataStr = JSON.stringify(heatmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getSeverityBadgeClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'status-danger';
      case 'high': return 'status-warning';
      case 'medium': return 'status-safe';
      case 'low': return 'status-safe';
      default: return 'status-safe';
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  useEffect(() => {
    if (heatmapData) {
      loadGoogleMaps();
    }
  }, [heatmapData, loadGoogleMaps]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHeatmapData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchHeatmapData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-section">
        <h3 className="section-title">
          <Activity className="section-icon" />
          Real-time Alerts Heatmap
        </h3>
        <div className="section-content">
          <p>Monitor alert distribution patterns and identify hotspots across all locations</p>
          
          <div className="quick-actions">
            <button
              className={`action-btn ${autoRefresh ? 'success' : 'secondary'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={autoRefresh ? 'animate-spin' : ''} size={16} />
              {autoRefresh ? 'Live Mode ON' : 'Enable Auto-Refresh'}
            </button>
            
            <button
              className="action-btn"
              onClick={fetchHeatmapData}
              disabled={loading}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
            
            <button
              className="action-btn secondary"
              onClick={exportHeatmapData}
              disabled={!heatmapData}
            >
              <Download size={16} />
              Export Data
            </button>
          </div>

          {error && (
            <div className="alert-banner">
              <AlertTriangle className="alert-icon" />
              <span className="alert-text">{error}</span>
              <button onClick={fetchHeatmapData} className="action-btn">
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {heatmapData && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <div className="stat-number">{heatmapData.totalAlerts}</div>
                <div className="stat-label">Total Alerts</div>
                <div className="stat-trend trend-up">↗ Last 24h</div>
              </div>
              <div className="stat-icon">🚨</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <div className="stat-number">{heatmapData.hotspots.length}</div>
                <div className="stat-label">Active Hotspots</div>
                <div className="stat-trend">High activity zones</div>
              </div>
              <div className="stat-icon">🗺️</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <div className="stat-number">{heatmapData.alertsByType?.SOS || 0}</div>
                <div className="stat-label">SOS Alerts</div>
                <div className="stat-trend">Emergency calls</div>
              </div>
              <div className="stat-icon">🆘</div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="admin-section">
        <h3 className="section-title">
          <MapPin className="section-icon" />
          Interactive Heatmap
        </h3>
        <div className="section-content">
          {error && (
            <div className="alert-banner">
              <AlertTriangle className="alert-icon" />
              <span className="alert-text">{error}</span>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="w-full h-[500px] rounded-lg border border-gray-200 bg-gray-50"
            style={{ minHeight: '500px' }}
          />
          
          {loading && (
            <div className="loading-spinner">
              <span className="spinner"></span>
              <p>Loading heatmap data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Hotspots List */}
      {heatmapData && heatmapData.hotspots.length > 0 && (
        <div className="admin-section">
          <h3 className="section-title">
            <TrendingUp className="section-icon" />
            Alert Hotspots
          </h3>
          <div className="section-content">
            <div className="admin-stats">
              {heatmapData.hotspots.map((hotspot, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-card-content">
                    <div className="stat-info">
                      <div className="stat-number" style={{ fontSize: '1.5rem', color: '#1f2937' }}>
                        {hotspot.location}
                      </div>
                      <div className="stat-label" style={{ color: '#6b7280' }}>
                        Alert Count: {hotspot.alertCount}
                      </div>
                      <div className="stat-trend" style={{ color: '#374151' }}>
                        Coordinates: {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                      </div>
                      <div className="stat-trend" style={{ color: '#374151' }}>
                        Recent Alerts: {hotspot.recentAlerts}
                      </div>
                    </div>
                    <div className="stat-icon">
                      <span className={`tourist-status ${getSeverityBadgeClass(hotspot.averageSeverity)}`}>
                        {hotspot.averageSeverity}
                      </span>
                    </div>
                  </div>
                  <div className="quick-actions" style={{ marginTop: '16px' }}>
                    <button className="action-btn" style={{ fontSize: '0.875rem' }}>
                      View Details
                    </button>
                    <button className="action-btn secondary" style={{ fontSize: '0.875rem' }}>
                      Track Location
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};