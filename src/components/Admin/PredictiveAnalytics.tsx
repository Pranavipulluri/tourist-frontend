import React, { useEffect, useState } from 'react';
import './PredictiveAnalytics.css';

interface PredictiveAlert {
  id: string;
  timestamp: string;
  location: {
    name: string;
    coordinates: [number, number];
    zone: string;
  };
  riskType: 'CROWD_SURGE' | 'WEATHER_RISK' | 'CRIMINAL_ACTIVITY' | 'INFRASTRUCTURE_FAILURE' | 'HEALTH_EMERGENCY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  affectedArea: number; // radius in meters
  estimatedAffectedTourists: number;
  timeToOccurrence: string; // e.g., "2 hours", "30 minutes"
  mitigationSuggestions: string[];
  dataSource: 'HISTORICAL_PATTERN' | 'WEATHER_API' | 'CROWD_DENSITY' | 'POLICE_INTEL' | 'SOCIAL_MEDIA';
  relatedFactors: string[];
}

interface HotspotPrediction {
  id: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  currentRiskLevel: number; // 0-100
  predictedRiskLevel: number; // 0-100 for next 24h
  riskTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  factors: {
    name: string;
    impact: number; // -100 to +100
    confidence: number; // 0-100
  }[];
  historicalIncidents: number;
  touristDensity: number;
  lastUpdated: string;
}

interface WeatherRisk {
  id: string;
  location: string;
  condition: 'HEAVY_RAIN' | 'EXTREME_HEAT' | 'FOG' | 'STORM' | 'FLOODING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startTime: string;
  endTime: string;
  affectedRadius: number;
  touristImpact: string;
  recommendations: string[];
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    visibility: number;
  };
}

interface CrowdDensityPrediction {
  id: string;
  location: string;
  currentDensity: number; // people per sq meter
  predictedPeakDensity: number;
  peakTime: string;
  crowdType: 'TOURIST_GROUP' | 'LOCAL_EVENT' | 'FESTIVAL' | 'PROTEST' | 'EMERGENCY_EVACUATION';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  historicalComparison: number; // percentage compared to historical average
}

export const PredictiveAnalytics: React.FC = () => {
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [hotspotPredictions, setHotspotPredictions] = useState<HotspotPrediction[]>([]);
  const [weatherRisks, setWeatherRisks] = useState<WeatherRisk[]>([]);
  const [crowdPredictions, setCrowdPredictions] = useState<CrowdDensityPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'hotspots' | 'weather' | 'crowds' | 'insights'>('alerts');
  const [timeRange, setTimeRange] = useState('24h');
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  useEffect(() => {
    loadPredictiveData();
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(loadPredictiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange, confidenceThreshold]);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive predictive analytics data
      const mockAlerts: PredictiveAlert[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Red Fort Area',
            coordinates: [28.6562, 77.2410],
            zone: 'TOURIST_HIGH'
          },
          riskType: 'CROWD_SURGE',
          severity: 'HIGH',
          confidence: 87,
          affectedArea: 500,
          estimatedAffectedTourists: 350,
          timeToOccurrence: '2 hours',
          mitigationSuggestions: [
            'Deploy additional crowd control personnel',
            'Set up temporary barriers at entry points',
            'Send crowd diversion alerts to nearby tourists',
            'Coordinate with metro authorities for crowd management'
          ],
          dataSource: 'CROWD_DENSITY',
          relatedFactors: ['Weekend peak hours', 'Tourist season', 'Clear weather forecast']
        },
        {
          id: '2',
          timestamp: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          location: {
            name: 'India Gate Surroundings',
            coordinates: [28.6129, 77.2295],
            zone: 'TOURIST_MEDIUM'
          },
          riskType: 'WEATHER_RISK',
          severity: 'MEDIUM',
          confidence: 92,
          affectedArea: 1000,
          estimatedAffectedTourists: 200,
          timeToOccurrence: '30 minutes',
          mitigationSuggestions: [
            'Issue weather warning alerts to tourists in area',
            'Activate emergency shelter protocols',
            'Alert food vendors to secure equipment',
            'Increase patrol frequency'
          ],
          dataSource: 'WEATHER_API',
          relatedFactors: ['Incoming thunderstorm', 'High humidity', 'Temperature drop expected']
        },
        {
          id: '3',
          timestamp: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          location: {
            name: 'Chandni Chowk Market',
            coordinates: [28.6506, 77.2334],
            zone: 'SENSITIVE'
          },
          riskType: 'CRIMINAL_ACTIVITY',
          severity: 'MEDIUM',
          confidence: 75,
          affectedArea: 300,
          estimatedAffectedTourists: 150,
          timeToOccurrence: '4 hours',
          mitigationSuggestions: [
            'Increase police patrol in the area',
            'Deploy plainclothes officers',
            'Send safety awareness alerts to tourists',
            'Coordinate with local shop owners for surveillance'
          ],
          dataSource: 'POLICE_INTEL',
          relatedFactors: ['Historical pattern analysis', 'Recent criminal reports', 'Evening peak hours']
        }
      ];

      const mockHotspots: HotspotPrediction[] = [
        {
          id: '1',
          location: {
            name: 'Red Fort Complex',
            coordinates: [28.6562, 77.2410]
          },
          currentRiskLevel: 45,
          predictedRiskLevel: 78,
          riskTrend: 'INCREASING',
          factors: [
            { name: 'Tourist Density', impact: +35, confidence: 90 },
            { name: 'Weather Conditions', impact: +15, confidence: 85 },
            { name: 'Historical Incidents', impact: +10, confidence: 80 },
            { name: 'Local Events', impact: +18, confidence: 75 }
          ],
          historicalIncidents: 12,
          touristDensity: 3.2,
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          location: {
            name: 'Connaught Place',
            coordinates: [28.6315, 77.2167]
          },
          currentRiskLevel: 62,
          predictedRiskLevel: 48,
          riskTrend: 'DECREASING',
          factors: [
            { name: 'Police Presence', impact: -20, confidence: 95 },
            { name: 'CCTV Coverage', impact: -15, confidence: 90 },
            { name: 'Tourist Flow', impact: +8, confidence: 85 },
            { name: 'Infrastructure', impact: -5, confidence: 80 }
          ],
          historicalIncidents: 18,
          touristDensity: 2.8,
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          location: {
            name: 'Lotus Temple Area',
            coordinates: [28.5535, 77.2588]
          },
          currentRiskLevel: 25,
          predictedRiskLevel: 30,
          riskTrend: 'STABLE',
          factors: [
            { name: 'Peaceful Environment', impact: -10, confidence: 95 },
            { name: 'Tourist Education', impact: -5, confidence: 85 },
            { name: 'Distance from City', impact: +8, confidence: 80 },
            { name: 'Limited Transport', impact: +2, confidence: 70 }
          ],
          historicalIncidents: 3,
          touristDensity: 1.5,
          lastUpdated: new Date().toISOString()
        }
      ];

      const mockWeatherRisks: WeatherRisk[] = [
        {
          id: '1',
          location: 'Central Delhi Tourist Circuit',
          condition: 'HEAVY_RAIN',
          severity: 'HIGH',
          startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          affectedRadius: 5000,
          touristImpact: 'Outdoor tourist activities may be severely affected. Risk of flooding in low-lying areas.',
          recommendations: [
            'Move tourists to covered areas',
            'Cancel outdoor tours and activities',
            'Monitor flood-prone tourist areas',
            'Activate emergency response teams'
          ],
          weatherData: {
            temperature: 28,
            humidity: 95,
            windSpeed: 45,
            precipitation: 85,
            visibility: 2
          }
        },
        {
          id: '2',
          location: 'South Delhi Heritage Sites',
          condition: 'EXTREME_HEAT',
          severity: 'MEDIUM',
          startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          affectedRadius: 8000,
          touristImpact: 'Heat exhaustion risk for tourists, especially elderly and children.',
          recommendations: [
            'Issue heat wave alerts to tourists',
            'Ensure availability of cooling centers',
            'Promote hydration awareness',
            'Adjust tour timings to avoid peak heat'
          ],
          weatherData: {
            temperature: 44,
            humidity: 30,
            windSpeed: 12,
            precipitation: 0,
            visibility: 8
          }
        }
      ];

      const mockCrowdPredictions: CrowdDensityPrediction[] = [
        {
          id: '1',
          location: 'Red Fort Main Entrance',
          currentDensity: 2.1,
          predictedPeakDensity: 4.8,
          peakTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          crowdType: 'TOURIST_GROUP',
          riskLevel: 'HIGH',
          recommendedActions: [
            'Implement crowd flow control',
            'Open additional entry/exit points',
            'Deploy crowd management personnel',
            'Send crowd alerts to incoming tourists'
          ],
          historicalComparison: 145
        },
        {
          id: '2',
          location: 'India Gate Central Lawn',
          currentDensity: 1.5,
          predictedPeakDensity: 3.2,
          peakTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          crowdType: 'LOCAL_EVENT',
          riskLevel: 'MEDIUM',
          recommendedActions: [
            'Monitor crowd behavior',
            'Coordinate with event organizers',
            'Ensure emergency vehicle access',
            'Brief security personnel'
          ],
          historicalComparison: 120
        }
      ];

      setPredictiveAlerts(mockAlerts);
      setHotspotPredictions(mockHotspots);
      setWeatherRisks(mockWeatherRisks);
      setCrowdPredictions(mockCrowdPredictions);
    } catch (err: any) {
      setError('Failed to load predictive analytics data');
      console.error('Predictive analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getRiskTypeIcon = (riskType: PredictiveAlert['riskType']) => {
    switch (riskType) {
      case 'CROWD_SURGE': return '👥';
      case 'WEATHER_RISK': return '🌦️';
      case 'CRIMINAL_ACTIVITY': return '🚨';
      case 'INFRASTRUCTURE_FAILURE': return '🏗️';
      case 'HEALTH_EMERGENCY': return '🏥';
      default: return '⚠️';
    }
  };

  const getTrendColor = (trend: HotspotPrediction['riskTrend']) => {
    switch (trend) {
      case 'INCREASING': return '#F44336';
      case 'DECREASING': return '#4CAF50';
      case 'STABLE': return '#FF9800';
      default: return '#757575';
    }
  };

  const filteredAlerts = predictiveAlerts.filter(alert => {
    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
    const matchesConfidence = alert.confidence >= confidenceThreshold;
    return matchesSeverity && matchesConfidence;
  });

  if (loading) {
    return (
      <div className="predictive-analytics">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading AI predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-analytics">
      <div className="analytics-header">
        <h2>🔮 AI-Powered Predictive Analytics</h2>
        <p>Advanced AI predictions for proactive tourist safety management</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="analytics-stats">
        <div className="stats-cards">
          <div className="stat-card urgent">
            <h4>Active Alerts</h4>
            <span className="stat-value">{filteredAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length}</span>
            <small>Requiring immediate attention</small>
          </div>
          <div className="stat-card">
            <h4>High-Risk Hotspots</h4>
            <span className="stat-value">{hotspotPredictions.filter(h => h.predictedRiskLevel > 70).length}</span>
            <small>Next 24 hours</small>
          </div>
          <div className="stat-card">
            <h4>Weather Risks</h4>
            <span className="stat-value">{weatherRisks.filter(w => w.severity === 'HIGH' || w.severity === 'CRITICAL').length}</span>
            <small>Severe conditions expected</small>
          </div>
          <div className="stat-card">
            <h4>Crowd Risks</h4>
            <span className="stat-value">{crowdPredictions.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length}</span>
            <small>High density areas</small>
          </div>
        </div>
      </div>

      <div className="analytics-controls">
        <div className="controls-section">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="control-select"
          >
            <option value="1h">Next Hour</option>
            <option value="6h">Next 6 Hours</option>
            <option value="24h">Next 24 Hours</option>
            <option value="72h">Next 3 Days</option>
          </select>

          <div className="confidence-control">
            <label>Confidence Threshold: {confidenceThreshold}%</label>
            <input
              type="range"
              min="50"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="confidence-slider"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="control-select"
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Predictive Alerts ({filteredAlerts.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'hotspots' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotspots')}
        >
          🗺️ Risk Hotspots ({hotspotPredictions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          🌤️ Weather Risks ({weatherRisks.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'crowds' ? 'active' : ''}`}
          onClick={() => setActiveTab('crowds')}
        >
          👥 Crowd Predictions ({crowdPredictions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 AI Insights
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div className="alerts-content">
          <div className="alerts-grid">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.severity.toLowerCase()}`}>
                <div className="alert-header">
                  <div className="alert-type">
                    <span className="type-icon">{getRiskTypeIcon(alert.riskType)}</span>
                    <h4>{alert.riskType.replace('_', ' ')}</h4>
                  </div>
                  <div className="alert-meta">
                    <span 
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity}
                    </span>
                    <span className="confidence">
                      {alert.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div className="alert-location">
                  <h5>📍 {alert.location.name}</h5>
                  <p>Zone: {alert.location.zone}</p>
                </div>

                <div className="alert-timeline">
                  <div className="timeline-item">
                    <span className="timeline-label">Time to occurrence:</span>
                    <span className="timeline-value">{alert.timeToOccurrence}</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">Affected area:</span>
                    <span className="timeline-value">{alert.affectedArea}m radius</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">Estimated tourists:</span>
                    <span className="timeline-value">{alert.estimatedAffectedTourists}</span>
                  </div>
                </div>

                <div className="alert-factors">
                  <h6>Related Factors:</h6>
                  <div className="factors-list">
                    {alert.relatedFactors.map((factor, index) => (
                      <span key={index} className="factor-tag">{factor}</span>
                    ))}
                  </div>
                </div>

                <div className="mitigation-suggestions">
                  <h6>🛡️ Recommended Actions:</h6>
                  <ul>
                    {alert.mitigationSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>

                <div className="alert-source">
                  <small>Data Source: {alert.dataSource.replace('_', ' ')}</small>
                </div>

                <div className="alert-actions">
                  <button className="action-btn primary">🚨 Deploy Response</button>
                  <button className="action-btn secondary">📢 Send Alerts</button>
                  <button className="action-btn">📊 View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'hotspots' && (
        <div className="hotspots-content">
          <div className="hotspots-map-placeholder">
            <h3>🗺️ Interactive Risk Heatmap</h3>
            <p>Real-time visualization of predicted risk levels across tourist areas</p>
            <div className="map-controls">
              <button className="map-btn">🔄 Refresh Data</button>
              <button className="map-btn">📊 Show Historical</button>
              <button className="map-btn">🎯 Focus High Risk</button>
            </div>
          </div>

          <div className="hotspots-grid">
            {hotspotPredictions.map(hotspot => (
              <div key={hotspot.id} className="hotspot-card">
                <div className="hotspot-header">
                  <h4>{hotspot.location.name}</h4>
                  <div className="risk-indicators">
                    <div className="risk-level">
                      <span className="risk-label">Current Risk</span>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill current"
                          style={{ width: `${hotspot.currentRiskLevel}%` }}
                        ></div>
                        <span className="risk-value">{hotspot.currentRiskLevel}%</span>
                      </div>
                    </div>
                    <div className="risk-level">
                      <span className="risk-label">Predicted Risk (24h)</span>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill predicted"
                          style={{ width: `${hotspot.predictedRiskLevel}%` }}
                        ></div>
                        <span className="risk-value">{hotspot.predictedRiskLevel}%</span>
                      </div>
                    </div>
                  </div>
                  <span 
                    className="trend-indicator"
                    style={{ color: getTrendColor(hotspot.riskTrend) }}
                  >
                    {hotspot.riskTrend === 'INCREASING' ? '↗️' : 
                     hotspot.riskTrend === 'DECREASING' ? '↘️' : '➡️'} 
                    {hotspot.riskTrend}
                  </span>
                </div>

                <div className="hotspot-stats">
                  <div className="stat-item">
                    <span className="stat-label">Historical Incidents</span>
                    <span className="stat-value">{hotspot.historicalIncidents}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tourist Density</span>
                    <span className="stat-value">{hotspot.touristDensity}/m²</span>
                  </div>
                </div>

                <div className="risk-factors">
                  <h6>Risk Factors Analysis:</h6>
                  {hotspot.factors.map((factor, index) => (
                    <div key={index} className="factor-item">
                      <div className="factor-header">
                        <span className="factor-name">{factor.name}</span>
                        <span className={`factor-impact ${factor.impact > 0 ? 'positive' : 'negative'}`}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact}%
                        </span>
                      </div>
                      <div className="factor-confidence">
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ width: `${factor.confidence}%` }}
                          ></div>
                        </div>
                        <span className="confidence-text">{factor.confidence}% confidence</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hotspot-actions">
                  <button className="action-btn primary">🎯 Focus Monitoring</button>
                  <button className="action-btn secondary">📍 View on Map</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'weather' && (
        <div className="weather-risks-content">
          <div className="weather-overview">
            <h3>🌤️ Weather Risk Assessment</h3>
            <p>AI-powered weather impact analysis for tourist safety</p>
          </div>

          <div className="weather-risks-grid">
            {weatherRisks.map(risk => (
              <div key={risk.id} className={`weather-risk-card ${risk.severity.toLowerCase()}`}>
                <div className="risk-header">
                  <div className="condition-info">
                    <h4>{risk.condition.replace('_', ' ')}</h4>
                    <span className="location">{risk.location}</span>
                  </div>
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(risk.severity) }}
                  >
                    {risk.severity}
                  </span>
                </div>

                <div className="weather-timeline">
                  <div className="timeline-item">
                    <span className="timeline-label">Start Time:</span>
                    <span className="timeline-value">
                      {new Date(risk.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">End Time:</span>
                    <span className="timeline-value">
                      {new Date(risk.endTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-label">Affected Radius:</span>
                    <span className="timeline-value">{risk.affectedRadius}m</span>
                  </div>
                </div>

                <div className="weather-data">
                  <h6>Weather Conditions:</h6>
                  <div className="weather-metrics">
                    <div className="metric">
                      <span className="metric-label">Temperature</span>
                      <span className="metric-value">{risk.weatherData.temperature}°C</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Humidity</span>
                      <span className="metric-value">{risk.weatherData.humidity}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Wind Speed</span>
                      <span className="metric-value">{risk.weatherData.windSpeed} km/h</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Precipitation</span>
                      <span className="metric-value">{risk.weatherData.precipitation}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Visibility</span>
                      <span className="metric-value">{risk.weatherData.visibility} km</span>
                    </div>
                  </div>
                </div>

                <div className="tourist-impact">
                  <h6>Tourist Impact:</h6>
                  <p>{risk.touristImpact}</p>
                </div>

                <div className="weather-recommendations">
                  <h6>🛡️ Recommended Actions:</h6>
                  <ul>
                    {risk.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>

                <div className="weather-actions">
                  <button className="action-btn primary">🚨 Activate Protocol</button>
                  <button className="action-btn secondary">📢 Send Weather Alert</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'crowds' && (
        <div className="crowd-predictions-content">
          <div className="crowd-overview">
            <h3>👥 Crowd Density Predictions</h3>
            <p>AI-powered crowd analysis and surge predictions</p>
          </div>

          <div className="crowd-predictions-grid">
            {crowdPredictions.map(prediction => (
              <div key={prediction.id} className={`crowd-prediction-card ${prediction.riskLevel.toLowerCase()}`}>
                <div className="prediction-header">
                  <h4>{prediction.location}</h4>
                  <span 
                    className="risk-badge"
                    style={{ backgroundColor: getSeverityColor(prediction.riskLevel) }}
                  >
                    {prediction.riskLevel} RISK
                  </span>
                </div>

                <div className="crowd-metrics">
                  <div className="density-comparison">
                    <div className="density-item">
                      <span className="density-label">Current Density</span>
                      <span className="density-value">{prediction.currentDensity} people/m²</span>
                    </div>
                    <div className="density-item">
                      <span className="density-label">Predicted Peak</span>
                      <span className="density-value">{prediction.predictedPeakDensity} people/m²</span>
                    </div>
                    <div className="density-item">
                      <span className="density-label">Peak Time</span>
                      <span className="density-value">
                        {new Date(prediction.peakTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="crowd-analysis">
                  <div className="crowd-type">
                    <span className="type-label">Crowd Type:</span>
                    <span className="type-value">{prediction.crowdType.replace('_', ' ')}</span>
                  </div>
                  <div className="historical-comparison">
                    <span className="comparison-label">vs Historical Average:</span>
                    <span className={`comparison-value ${prediction.historicalComparison > 100 ? 'above' : 'below'}`}>
                      {prediction.historicalComparison}%
                    </span>
                  </div>
                </div>

                <div className="density-visualization">
                  <h6>Density Forecast:</h6>
                  <div className="density-chart">
                    <div className="chart-bar">
                      <div 
                        className="current-bar"
                        style={{ width: `${(prediction.currentDensity / prediction.predictedPeakDensity) * 100}%` }}
                      >
                        Current
                      </div>
                    </div>
                    <div className="chart-bar">
                      <div 
                        className="predicted-bar"
                        style={{ width: '100%' }}
                      >
                        Predicted Peak
                      </div>
                    </div>
                  </div>
                </div>

                <div className="crowd-recommendations">
                  <h6>🛡️ Recommended Actions:</h6>
                  <ul>
                    {prediction.recommendedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div className="crowd-actions">
                  <button className="action-btn primary">🚨 Deploy Crowd Control</button>
                  <button className="action-btn secondary">📊 Monitor Live</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="insights-content">
          <div className="insights-header">
            <h3>💡 AI-Generated Insights & Recommendations</h3>
            <p>Advanced analytics and strategic recommendations</p>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <h4>🎯 Strategic Recommendations</h4>
              <ul className="insight-list">
                <li>Deploy 2 additional patrol units to Red Fort area during 14:00-16:00 peak hours</li>
                <li>Implement dynamic pricing for high-risk time slots to distribute tourist flow</li>
                <li>Establish temporary medical stations at predicted crowd surge locations</li>
                <li>Coordinate with metro authorities for increased service during peak tourist hours</li>
              </ul>
            </div>

            <div className="insight-card">
              <h4>📊 Pattern Analysis</h4>
              <div className="pattern-insights">
                <div className="pattern-item">
                  <span className="pattern-label">Tourist Flow Pattern:</span>
                  <span className="pattern-value">Weekend surge +45% higher than weekdays</span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Risk Correlation:</span>
                  <span className="pattern-value">Weather conditions impact incidents by 23%</span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Optimal Patrol Times:</span>
                  <span className="pattern-value">10:00-12:00 and 14:00-18:00 show highest effectiveness</span>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <h4>🔮 Future Predictions</h4>
              <div className="future-predictions">
                <div className="prediction-item">
                  <h5>Next Week Outlook</h5>
                  <p>Expected 30% increase in tourist activity due to favorable weather and holiday season</p>
                </div>
                <div className="prediction-item">
                  <h5>Resource Requirements</h5>
                  <p>Recommend 25% increase in security personnel and emergency medical coverage</p>
                </div>
                <div className="prediction-item">
                  <h5>Risk Mitigation</h5>
                  <p>Proactive measures could reduce potential incidents by up to 40%</p>
                </div>
              </div>
            </div>

            <div className="insight-card">
              <h4>⚡ Real-Time AI Actions</h4>
              <div className="ai-actions">
                <div className="action-item active">
                  <span className="action-status">🟢 ACTIVE</span>
                  <span className="action-description">Auto-routing tourists away from high-risk zones</span>
                </div>
                <div className="action-item active">
                  <span className="action-status">🟢 ACTIVE</span>
                  <span className="action-description">Dynamic alert thresholds based on real-time conditions</span>
                </div>
                <div className="action-item pending">
                  <span className="action-status">🟡 PENDING</span>
                  <span className="action-description">Weather-based tour recommendation adjustments</span>
                </div>
                <div className="action-item">
                  <span className="action-status">🔴 AVAILABLE</span>
                  <span className="action-description">Emergency resource auto-deployment protocol</span>
                </div>
              </div>
            </div>
          </div>

          <div className="model-performance">
            <h4>🤖 AI Model Performance</h4>
            <div className="performance-metrics">
              <div className="metric-card">
                <h5>Prediction Accuracy</h5>
                <span className="metric-value">87.3%</span>
                <small>Last 30 days</small>
              </div>
              <div className="metric-card">
                <h5>False Positive Rate</h5>
                <span className="metric-value">8.2%</span>
                <small>Within acceptable range</small>
              </div>
              <div className="metric-card">
                <h5>Response Time</h5>
                <span className="metric-value">2.3 min</span>
                <small>Average prediction generation</small>
              </div>
              <div className="metric-card">
                <h5>Data Sources</h5>
                <span className="metric-value">12</span>
                <small>Active integrations</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
