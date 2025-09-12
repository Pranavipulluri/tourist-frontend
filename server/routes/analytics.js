const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Analytics routes require authentication
router.use(authenticateToken);

// Get user safety analytics
router.get('/safety-score', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    // Calculate safety metrics
    const metrics = await calculateSafetyMetrics(userId, days);

    res.json({
      userId,
      timeRange: `${days} days`,
      safetyScore: metrics.overallScore,
      metrics,
      trends: await calculateSafetyTrends(userId, days),
      recommendations: generateSafetyRecommendations(metrics)
    });

  } catch (error) {
    console.error('Safety analytics error:', error);
    res.status(500).json({ error: 'Failed to get safety analytics' });
  }
});

// Get location analytics
router.get('/location-patterns', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Get location patterns
    const patterns = await analyzeLocationPatterns(userId, days);

    res.json({
      userId,
      timeRange: `${days} days`,
      patterns,
      insights: generateLocationInsights(patterns)
    });

  } catch (error) {
    console.error('Location analytics error:', error);
    res.status(500).json({ error: 'Failed to get location analytics' });
  }
});

// Get alert statistics
router.get('/alerts-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const stats = await query(`
      SELECT 
        alert_type,
        severity,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_resolution_time
      FROM alerts
      WHERE user_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY alert_type, severity
      ORDER BY count DESC
    `, [userId]);

    const totalAlerts = await query(`
      SELECT COUNT(*) as total
      FROM alerts
      WHERE user_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `, [userId]);

    res.json({
      userId,
      timeRange: `${days} days`,
      totalAlerts: parseInt(totalAlerts.rows[0]?.total || 0),
      alertsByType: stats.rows,
      summary: generateAlertSummary(stats.rows)
    });

  } catch (error) {
    console.error('Alert statistics error:', error);
    res.status(500).json({ error: 'Failed to get alert statistics' });
  }
});

// Calculate safety metrics
async function calculateSafetyMetrics(userId, days) {
  try {
    // Get location history
    const locations = await query(`
      SELECT 
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        recorded_at
      FROM user_locations
      WHERE user_id = $1
        AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      ORDER BY recorded_at
    `, [userId]);

    // Get alerts in the period
    const alerts = await query(`
      SELECT severity, alert_type, created_at
      FROM alerts
      WHERE user_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `, [userId]);

    // Calculate metrics
    const metrics = {
      locationUpdates: locations.rows.length,
      alertCount: alerts.rows.length,
      criticalAlerts: alerts.rows.filter(a => a.severity === 'CRITICAL').length,
      averageResponseTime: 0,
      safeZoneTime: 0,
      riskScore: 0,
      overallScore: 0
    };

    // Calculate risk score based on alerts
    metrics.riskScore = calculateRiskScore(alerts.rows);
    
    // Calculate time spent in safe zones
    metrics.safeZoneTime = await calculateSafeZoneTime(userId, days);
    
    // Calculate overall safety score (1-10)
    metrics.overallScore = calculateOverallSafetyScore(metrics);

    return metrics;

  } catch (error) {
    console.error('Calculate safety metrics error:', error);
    return {
      locationUpdates: 0,
      alertCount: 0,
      criticalAlerts: 0,
      averageResponseTime: 0,
      safeZoneTime: 0,
      riskScore: 0,
      overallScore: 5.0
    };
  }
}

// Calculate safety trends
async function calculateSafetyTrends(userId, days) {
  try {
    const trends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as alert_count,
        AVG(CASE 
          WHEN severity = 'CRITICAL' THEN 4
          WHEN severity = 'HIGH' THEN 3
          WHEN severity = 'MEDIUM' THEN 2
          WHEN severity = 'LOW' THEN 1
          ELSE 0
        END) as avg_severity
      FROM alerts
      WHERE user_id = $1
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId]);

    return trends.rows.map(row => ({
      date: row.date,
      alertCount: parseInt(row.alert_count),
      averageSeverity: parseFloat(row.avg_severity || 0)
    }));

  } catch (error) {
    console.error('Calculate trends error:', error);
    return [];
  }
}

// Analyze location patterns
async function analyzeLocationPatterns(userId, days) {
  try {
    // Get most visited areas
    const frequentAreas = await query(`
      SELECT 
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        COUNT(*) as visit_count,
        DATE_PART('hour', recorded_at) as hour_of_day
      FROM user_locations
      WHERE user_id = $1
        AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY ST_SnapToGrid(coordinates, 0.001), DATE_PART('hour', recorded_at)
      HAVING COUNT(*) > 2
      ORDER BY visit_count DESC
      LIMIT 20
    `, [userId]);

    // Get movement patterns by time of day
    const timePatterns = await query(`
      SELECT 
        DATE_PART('hour', recorded_at) as hour,
        COUNT(*) as location_updates,
        AVG(speed) as avg_speed
      FROM user_locations
      WHERE user_id = $1
        AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY DATE_PART('hour', recorded_at)
      ORDER BY hour
    `, [userId]);

    return {
      frequentAreas: frequentAreas.rows,
      timePatterns: timePatterns.rows,
      totalLocations: frequentAreas.rows.reduce((sum, area) => sum + parseInt(area.visit_count), 0)
    };

  } catch (error) {
    console.error('Analyze location patterns error:', error);
    return {
      frequentAreas: [],
      timePatterns: [],
      totalLocations: 0
    };
  }
}

// Calculate time spent in safe zones
async function calculateSafeZoneTime(userId, days) {
  try {
    const result = await query(`
      SELECT COUNT(*) as safe_location_count
      FROM user_locations ul
      WHERE ul.user_id = $1
        AND ul.recorded_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
        AND EXISTS (
          SELECT 1 FROM safe_zones sz
          WHERE ST_DWithin(
            ul.coordinates::geography,
            sz.coordinates::geography,
            500
          )
          AND sz.safety_score >= 7.0
        )
    `, [userId]);

    const totalLocations = await query(`
      SELECT COUNT(*) as total_count
      FROM user_locations
      WHERE user_id = $1
        AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `, [userId]);

    const safeCount = parseInt(result.rows[0]?.safe_location_count || 0);
    const totalCount = parseInt(totalLocations.rows[0]?.total_count || 1);

    return (safeCount / totalCount) * 100; // Percentage

  } catch (error) {
    console.error('Calculate safe zone time error:', error);
    return 0;
  }
}

// Calculate risk score
function calculateRiskScore(alerts) {
  if (alerts.length === 0) return 0;

  const severityWeights = {
    'CRITICAL': 4,
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
  };

  const totalWeight = alerts.reduce((sum, alert) => {
    return sum + (severityWeights[alert.severity] || 0);
  }, 0);

  return Math.min(totalWeight / alerts.length, 10); // Scale 0-10
}

// Calculate overall safety score
function calculateOverallSafetyScore(metrics) {
  let score = 10.0; // Start with perfect score

  // Deduct points for alerts
  score -= metrics.criticalAlerts * 2.0;
  score -= metrics.alertCount * 0.5;
  score -= metrics.riskScore * 0.5;

  // Add points for safe zone time
  score += (metrics.safeZoneTime / 100) * 2.0;

  // Add points for regular location updates
  if (metrics.locationUpdates > 50) score += 1.0;

  return Math.max(0, Math.min(10, score));
}

// Generate safety recommendations
function generateSafetyRecommendations(metrics) {
  const recommendations = [];

  if (metrics.overallScore < 5) {
    recommendations.push('Your safety score is below average. Consider reviewing your travel patterns.');
  }

  if (metrics.criticalAlerts > 0) {
    recommendations.push('You have critical alerts. Review emergency procedures and contacts.');
  }

  if (metrics.safeZoneTime < 50) {
    recommendations.push('Spend more time in verified safe zones when possible.');
  }

  if (metrics.locationUpdates < 20) {
    recommendations.push('Enable more frequent location sharing for better safety monitoring.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Your safety patterns look good. Keep up the good practices!');
  }

  return recommendations;
}

// Generate location insights
function generateLocationInsights(patterns) {
  const insights = [];

  if (patterns.frequentAreas.length > 0) {
    insights.push(`You frequently visit ${patterns.frequentAreas.length} different areas.`);
  }

  if (patterns.timePatterns.length > 0) {
    const mostActiveHour = patterns.timePatterns.reduce((max, current) => 
      parseInt(current.location_updates) > parseInt(max.location_updates) ? current : max
    );
    insights.push(`You are most active around ${mostActiveHour.hour}:00.`);
  }

  if (patterns.totalLocations > 100) {
    insights.push('You have good location tracking coverage for safety monitoring.');
  }

  return insights;
}

// Generate alert summary
function generateAlertSummary(alertStats) {
  if (alertStats.length === 0) {
    return {
      mostCommonType: 'None',
      mostCommonSeverity: 'None',
      totalTypes: 0
    };
  }

  const mostCommon = alertStats[0];
  const uniqueTypes = new Set(alertStats.map(stat => stat.alert_type)).size;

  return {
    mostCommonType: mostCommon.alert_type,
    mostCommonSeverity: mostCommon.severity,
    totalTypes: uniqueTypes,
    averageResolutionTime: mostCommon.avg_resolution_time
  };
}

module.exports = router;