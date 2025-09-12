const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// All location routes require authentication
router.use(authenticateToken);

// Update user location
router.post('/update',
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('accuracy').optional().isFloat({ min: 0 }),
    body('altitude').optional().isFloat(),
    body('speed').optional().isFloat({ min: 0 }),
    body('heading').optional().isFloat({ min: 0, max: 360 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { latitude, longitude, accuracy, altitude, speed, heading } = req.body;
      const userId = req.user.id;

      // Use transaction for atomic location update
      const result = await transaction(async (client) => {
        // Insert new location record
        const locationResult = await client.query(`
          INSERT INTO user_locations (user_id, coordinates, accuracy, altitude, speed, heading, recorded_at)
          VALUES ($1, ST_GeomFromText('POINT($2 $3)', 4326), $4, $5, $6, $7, CURRENT_TIMESTAMP)
          RETURNING id, coordinates, accuracy, altitude, speed, heading, recorded_at
        `, [userId, longitude, latitude, accuracy, altitude, speed, heading]);

        // Update user's current location
        await client.query(`
          UPDATE users 
          SET current_location = ST_GeomFromText('POINT($1 $2)', 4326),
              location_updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [longitude, latitude, userId]);

        return locationResult.rows[0];
      });

      // Check for nearby alerts and safe zones
      const nearbyData = await checkNearbyData(latitude, longitude);

      // Emit real-time location update via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('location_updated', {
          location: { latitude, longitude },
          nearbyAlerts: nearbyData.alerts,
          safeZones: nearbyData.safeZones,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        message: 'Location updated successfully',
        location: {
          id: result.id,
          latitude,
          longitude,
          accuracy,
          altitude,
          speed,
          heading,
          recordedAt: result.recorded_at
        },
        nearby: nearbyData
      });

    } catch (error) {
      console.error('Location update error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
);

// Get current location
router.get('/current', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        ST_X(current_location) as longitude,
        ST_Y(current_location) as latitude,
        location_updated_at
      FROM users 
      WHERE id = $1 AND current_location IS NOT NULL
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current location found' });
    }

    const location = result.rows[0];

    res.json({
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.location_updated_at
      }
    });

  } catch (error) {
    console.error('Get current location error:', error);
    res.status(500).json({ error: 'Failed to get current location' });
  }
});

// Get location history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(`
      SELECT 
        id,
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        accuracy,
        altitude,
        speed,
        heading,
        recorded_at
      FROM user_locations 
      WHERE user_id = $1
      ORDER BY recorded_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const locations = result.rows.map(row => ({
      id: row.id,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      altitude: row.altitude,
      speed: row.speed,
      heading: row.heading,
      recordedAt: row.recorded_at
    }));

    res.json({
      locations,
      pagination: {
        limit,
        offset,
        total: locations.length
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
});

// Get nearby safe zones
router.get('/safe-zones', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // Default 5km radius

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const result = await query(`
      SELECT 
        id,
        name,
        description,
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        safety_score,
        zone_type,
        ST_Distance(
          coordinates::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography
        ) as distance
      FROM safe_zones
      WHERE ST_DWithin(
        coordinates::geography,
        ST_GeomFromText('POINT($2 $1)', 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 20
    `, [latitude, longitude, radius]);

    const safeZones = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      safetyScore: row.safety_score,
      zoneType: row.zone_type,
      distance: Math.round(row.distance)
    }));

    res.json({
      safeZones,
      searchParams: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      }
    });

  } catch (error) {
    console.error('Get safe zones error:', error);
    res.status(500).json({ error: 'Failed to get safe zones' });
  }
});

// Get area safety score
router.get('/safety-score', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Calculate safety score based on various factors
    const safetyData = await calculateAreaSafetyScore(latitude, longitude);

    res.json({
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      safetyScore: safetyData.overallScore,
      factors: safetyData.factors,
      recommendations: safetyData.recommendations
    });

  } catch (error) {
    console.error('Get safety score error:', error);
    res.status(500).json({ error: 'Failed to calculate safety score' });
  }
});

// Helper function to check nearby data
async function checkNearbyData(latitude, longitude, radius = 1000) {
  try {
    // Get nearby alerts
    const alertsResult = await query(`
      SELECT 
        id,
        title,
        description,
        severity,
        alert_type,
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        ST_Distance(
          location::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography
        ) as distance,
        created_at
      FROM alerts
      WHERE status = 'ACTIVE'
        AND ST_DWithin(
          location::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography,
          $3
        )
      ORDER BY severity DESC, distance
      LIMIT 10
    `, [latitude, longitude, radius]);

    // Get nearby safe zones
    const safeZonesResult = await query(`
      SELECT 
        id,
        name,
        description,
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        safety_score,
        zone_type,
        ST_Distance(
          coordinates::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography
        ) as distance
      FROM safe_zones
      WHERE ST_DWithin(
        coordinates::geography,
        ST_GeomFromText('POINT($2 $1)', 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 5
    `, [latitude, longitude, radius]);

    return {
      alerts: alertsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        severity: row.severity,
        type: row.alert_type,
        latitude: row.latitude,
        longitude: row.longitude,
        distance: Math.round(row.distance),
        createdAt: row.created_at
      })),
      safeZones: safeZonesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        safetyScore: row.safety_score,
        zoneType: row.zone_type,
        distance: Math.round(row.distance)
      }))
    };

  } catch (error) {
    console.error('Check nearby data error:', error);
    return { alerts: [], safeZones: [] };
  }
}

// Helper function to calculate area safety score
async function calculateAreaSafetyScore(latitude, longitude) {
  try {
    const factors = {
      crimeRate: 0,
      policePresence: 0,
      lighting: 0,
      crowdDensity: 0,
      timeOfDay: 0
    };

    // Get crime incidents in the area (last 30 days)
    const crimeResult = await query(`
      SELECT COUNT(*) as crime_count
      FROM alerts
      WHERE alert_type IN ('crime', 'assault', 'theft')
        AND status = 'ACTIVE'
        AND created_at > CURRENT_DATE - INTERVAL '30 days'
        AND ST_DWithin(
          location::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography,
          2000
        )
    `, [latitude, longitude]);

    const crimeCount = parseInt(crimeResult.rows[0].crime_count);
    factors.crimeRate = Math.max(0, 10 - crimeCount); // Lower crime = higher score

    // Check police presence (nearby police stations)
    const policeResult = await query(`
      SELECT COUNT(*) as police_count
      FROM safe_zones
      WHERE zone_type = 'police'
        AND ST_DWithin(
          coordinates::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography,
          1000
        )
    `, [latitude, longitude]);

    factors.policePresence = Math.min(10, parseInt(policeResult.rows[0].police_count) * 3);

    // Time of day factor
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 20) {
      factors.timeOfDay = 9; // Daytime
    } else if (hour >= 21 || hour <= 5) {
      factors.timeOfDay = 4; // Nighttime
    } else {
      factors.timeOfDay = 7; // Twilight
    }

    // Simulate lighting and crowd density (in real implementation, this would come from IoT sensors)
    factors.lighting = Math.random() * 3 + 7; // Random between 7-10
    factors.crowdDensity = Math.random() * 4 + 6; // Random between 6-10

    // Calculate overall score
    const weights = {
      crimeRate: 0.3,
      policePresence: 0.25,
      lighting: 0.2,
      crowdDensity: 0.15,
      timeOfDay: 0.1
    };

    const overallScore = Object.keys(factors).reduce((sum, factor) => {
      return sum + (factors[factor] * weights[factor]);
    }, 0);

    // Generate recommendations
    const recommendations = [];
    if (factors.crimeRate < 6) {
      recommendations.push('High crime area - stay alert and avoid if possible');
    }
    if (factors.policePresence < 5) {
      recommendations.push('Limited police presence - consider traveling with others');
    }
    if (factors.lighting < 6) {
      recommendations.push('Poor lighting - use flashlight and stick to main roads');
    }
    if (factors.timeOfDay < 6) {
      recommendations.push('Late hours - exercise extra caution');
    }

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      factors,
      recommendations
    };

  } catch (error) {
    console.error('Calculate safety score error:', error);
    return {
      overallScore: 5.0,
      factors: {
        crimeRate: 5,
        policePresence: 5,
        lighting: 5,
        crowdDensity: 5,
        timeOfDay: 5
      },
      recommendations: ['Unable to calculate safety score - exercise normal caution']
    };
  }
}

module.exports = router;