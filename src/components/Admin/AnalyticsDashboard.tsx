import {
    Activity,
    AlertTriangle,
    BarChart3,
    Clock,
    Download,
    MapPin,
    PieChart as PieChartIcon,
    Shield,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import './AnalyticsDashboard.css';

// Types
interface TrendData {
  date: string;
  tourists: number;
  alerts: number;
  violations: number;
  responseTime: number;
}

interface AlertTypeData {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface LocationHeatmapData {
  latitude: number;
  longitude: number;
  intensity: number;
  alertCount: number;
}

interface HourlyPattern {
  hour: number;
  alerts: number;
  tourists: number;
  violations: number;
}

interface ResponseTimeData {
  date: string;
  averageTime: number;
  target: number;
}

interface AnalyticsData {
  trends: TrendData[];
  alertTypes: AlertTypeData[];
  hourlyPatterns: HourlyPattern[];
  responseTimeTrends: ResponseTimeData[];
  locationHeatmap: LocationHeatmapData[];
  totalStats: {
    totalAlerts: number;
    avgResponseTime: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    alertGrowth: number;
    responseTimeImprovement: number;
  };
}

// Analytics Dashboard Component
const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    trends: [],
    alertTypes: [],
    hourlyPatterns: [],
    responseTimeTrends: [],
    locationHeatmap: [],
    totalStats: {
      totalAlerts: 0,
      avgResponseTime: 0,
      criticalAlerts: 0,
      resolvedAlerts: 0,
      alertGrowth: 0,
      responseTimeImprovement: 0
    }
  });

  const [dateRange, setDateRange] = useState('7d'); // 1d, 7d, 30d, 90d
  const [selectedMetric, setSelectedMetric] = useState('alerts');
  const [loading, setLoading] = useState(true);

  // Colors for charts
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6'
  };

  const alertTypeColors = [
    '#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#F97316'
  ];

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API calls for now - replace with actual API endpoints
      const mockData: AnalyticsData = {
        trends: generateTrendData(),
        alertTypes: generateAlertTypeData(),
        hourlyPatterns: generateHourlyPatterns(),
        responseTimeTrends: generateResponseTimeData(),
        locationHeatmap: generateLocationHeatmap(),
        totalStats: {
          totalAlerts: 1247,
          avgResponseTime: 3.2,
          criticalAlerts: 89,
          resolvedAlerts: 1158,
          alertGrowth: 12.5,
          responseTimeImprovement: -8.3
        }
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data (replace with real API calls)
  const generateTrendData = (): TrendData[] => {
    const data = [];
    const days = dateRange === '1d' ? 24 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: dateRange === '1d' ? date.toLocaleTimeString() : date.toLocaleDateString(),
        tourists: Math.floor(Math.random() * 500) + 800,
        alerts: Math.floor(Math.random() * 50) + 10,
        violations: Math.floor(Math.random() * 20) + 5,
        responseTime: Math.random() * 5 + 2
      });
    }
    return data;
  };

  const generateAlertTypeData = (): AlertTypeData[] => [
    { type: 'SOS', count: 45, percentage: 36, color: colors.danger },
    { type: 'Geofence Violation', count: 32, percentage: 26, color: colors.warning },
    { type: 'Medical Emergency', count: 18, percentage: 14, color: colors.info },
    { type: 'Security Alert', count: 15, percentage: 12, color: colors.purple },
    { type: 'Weather Warning', count: 10, percentage: 8, color: colors.primary },
    { type: 'Panic Button', count: 5, percentage: 4, color: colors.success }
  ];

  const generateHourlyPatterns = (): HourlyPattern[] => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour,
        alerts: Math.floor(Math.random() * 20) + (hour >= 8 && hour <= 20 ? 10 : 2),
        tourists: Math.floor(Math.random() * 100) + (hour >= 6 && hour <= 22 ? 150 : 50),
        violations: Math.floor(Math.random() * 10) + (hour >= 10 && hour <= 18 ? 5 : 1)
      });
    }
    return data;
  };

  const generateResponseTimeData = (): ResponseTimeData[] => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString(),
        averageTime: Math.random() * 3 + 2,
        target: 5
      });
    }
    return data;
  };

  const generateLocationHeatmap = (): LocationHeatmapData[] => [
    { latitude: 28.6139, longitude: 77.2090, intensity: 85, alertCount: 12 },
    { latitude: 28.6129, longitude: 77.2295, intensity: 70, alertCount: 8 },
    { latitude: 28.6289, longitude: 77.2065, intensity: 90, alertCount: 15 },
    { latitude: 28.6169, longitude: 77.2100, intensity: 60, alertCount: 6 },
    { latitude: 28.6200, longitude: 77.2150, intensity: 75, alertCount: 10 }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Export data function
  const exportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      dateRange,
      analyticsData
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>
            <BarChart3 size={28} />
            Analytics Dashboard
          </h1>
          <p>Real-time insights and historical trends</p>
        </div>

        <div className="header-controls">
          <div className="date-range-selector">
            <label>Time Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <button className="export-btn" onClick={exportData}>
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card">
          <div className="metric-icon" style={{ color: colors.primary }}>
            <AlertTriangle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalStats.totalAlerts.toLocaleString()}</div>
            <div className="metric-label">Total Alerts</div>
            <div className={`metric-change ${analyticsData.totalStats.alertGrowth >= 0 ? 'positive' : 'negative'}`}>
              {analyticsData.totalStats.alertGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(analyticsData.totalStats.alertGrowth)}% vs last period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: colors.success }}>
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalStats.avgResponseTime.toFixed(1)}min</div>
            <div className="metric-label">Avg Response Time</div>
            <div className={`metric-change ${analyticsData.totalStats.responseTimeImprovement < 0 ? 'positive' : 'negative'}`}>
              {analyticsData.totalStats.responseTimeImprovement < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {Math.abs(analyticsData.totalStats.responseTimeImprovement)}% vs last period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: colors.danger }}>
            <Shield size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalStats.criticalAlerts}</div>
            <div className="metric-label">Critical Alerts</div>
            <div className="metric-subtitle">
              {analyticsData.totalStats.resolvedAlerts} resolved
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ color: colors.info }}>
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {((analyticsData.totalStats.resolvedAlerts / analyticsData.totalStats.totalAlerts) * 100).toFixed(1)}%
            </div>
            <div className="metric-label">Resolution Rate</div>
            <div className="metric-subtitle">
              Performance indicator
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Trends Chart */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3>
              <TrendingUp size={20} />
              Trends Overview
            </h3>
            <div className="metric-selector">
              <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                <option value="alerts">Alerts</option>
                <option value="tourists">Active Tourists</option>
                <option value="violations">Violations</option>
                <option value="responseTime">Response Time</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }} 
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={colors.primary}
                fill={`${colors.primary}20`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Types Distribution */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>
              <PieChartIcon size={20} />
              Alert Types Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.alertTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.type}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.alertTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={alertTypeColors[index % alertTypeColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Patterns */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3>
              <Clock size={20} />
              Hourly Activity Patterns
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.hourlyPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="alerts" fill={colors.danger} name="Alerts" />
              <Bar dataKey="violations" fill={colors.warning} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Trend */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>
              <Activity size={20} />
              Response Time Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.responseTimeTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageTime" 
                stroke={colors.primary} 
                strokeWidth={2} 
                name="Average Response Time"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={colors.danger} 
                strokeDasharray="5 5" 
                name="Target (5 min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Hotspots */}
      <div className="location-analysis">
        <div className="chart-header">
          <h3>
            <MapPin size={20} />
            Alert Hotspots Analysis
          </h3>
        </div>
        <div className="hotspots-grid">
          {analyticsData.locationHeatmap.map((location, index) => (
            <div key={index} className="hotspot-card">
              <div className="hotspot-intensity" style={{ 
                background: `linear-gradient(135deg, ${colors.danger}${Math.round(location.intensity)}%, transparent)` 
              }}>
                <div className="intensity-value">{location.intensity}%</div>
              </div>
              <div className="hotspot-details">
                <div className="coordinates">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
                <div className="alert-count">{location.alertCount} alerts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;