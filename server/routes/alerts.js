const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// All alert routes require authentication
router.use(authenticateToken);

// Create new alert
router.post('/create',
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').trim().isLength({ min: 1, max: 1000 }),
    body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('alertType').isIn(['crime', 'accident', 'weather', 'traffic', 'emergency', 'safety']),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('radius').optional().isFloat({ min: 50, max: 10000 })
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

      const { title, description, severity, alertType, latitude, longitude, radius = 500 } = req.body;
      const userId = req.user.id;

      // Generate alert ID
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await query(`
        INSERT INTO alerts (id, user_id, title, description, severity, alert_type, location, radius, status)
        VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText('POINT($8 $7)', 4326), $9, 'ACTIVE')
        RETURNING id, title, description, severity, alert_type, radius, status, created_at
      `, [alertId, userId, title, description, severity, alertType, latitude, longitude, radius]);

      const newAlert = result.rows[0];

      // Emit real-time alert to nearby users
      const io = req.app.get('io');
      if (io) {
        // Find users within the alert radius
        const nearbyUsers = await query(`
          SELECT DISTINCT u.id
          FROM users u
          WHERE u.current_location IS NOT NULL
            AND ST_DWithin(
              u.current_location::geography,
              ST_GeomFromText('POINT($2 $1)', 4326)::geography,
              $3
            )
            AND u.id != $4
        `, [latitude, longitude, radius, userId]);

        // Send alert to nearby users
        nearbyUsers.rows.forEach(user => {
          io.to(`user_${user.id}`).emit('nearby_alert', {
            id: newAlert.id,
            title: newAlert.title,
            description: newAlert.description,
            severity: newAlert.severity,
            type: newAlert.alert_type,
            distance: 'nearby',
            timestamp: newAlert.created_at
          });
        });

        // Send to emergency services if critical
        if (severity === 'CRITICAL') {
          io.to('emergency_services').emit('critical_alert', {
            alert: newAlert,
            location: { latitude, longitude },
            reporter: req.user
          });
        }
      }

      res.status(201).json({
        message: 'Alert created successfully',
        alert: {
          id: newAlert.id,
          title: newAlert.title,
          description: newAlert.description,
          severity: newAlert.severity,
          type: newAlert.alert_type,
          radius: newAlert.radius,
          status: newAlert.status,
          createdAt: newAlert.created_at
        }
      });

    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  }
);

// Get nearby alerts
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.severity,
        a.alert_type,
        a.radius,
        a.status,
        a.created_at,
        ST_X(a.location) as longitude,
        ST_Y(a.location) as latitude,
        ST_Distance(
          a.location::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography
        ) as distance,
        u.first_name as reporter_name
      FROM alerts a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'ACTIVE'
        AND ST_DWithin(
          a.location::geography,
          ST_GeomFromText('POINT($2 $1)', 4326)::geography,
          $3
        )
      ORDER BY 
        CASE a.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        distance
      LIMIT $4
    `, [latitude, longitude, radius, limit]);

    const alerts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      type: row.alert_type,
      radius: row.radius,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      distance: Math.round(row.distance),
      reporterName: row.reporter_name,
      createdAt: row.created_at
    }));

    res.json({
      alerts,
      searchParams: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      }
    });

  } catch (error) {
    console.error('Get nearby alerts error:', error);
    res.status(500).json({ error: 'Failed to get nearby alerts' });
  }
});

// Get user's alerts
router.get('/my-alerts', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'ACTIVE', limit = 50 } = req.query;

    const result = await query(`
      SELECT 
        id,
        title,
        description,
        severity,
        alert_type,
        radius,
        status,
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        created_at,
        updated_at
      FROM alerts
      WHERE user_id = $1
        AND ($2 = 'ALL' OR status = $2)
      ORDER BY created_at DESC
      LIMIT $3
    `, [userId, status, limit]);

    const alerts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      type: row.alert_type,
      radius: row.radius,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ alerts });

  } catch (error) {
    console.error('Get user alerts error:', error);
    res.status(500).json({ error: 'Failed to get user alerts' });
  }
});

// Update alert status
router.patch('/:alertId/status',
  [
    body('status').isIn(['ACTIVE', 'RESOLVED', 'EXPIRED'])
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

      const { alertId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const result = await query(`
        UPDATE alerts 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id, status, updated_at
      `, [status, alertId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found or not authorized' });
      }

      const updatedAlert = result.rows[0];

      res.json({
        message: 'Alert status updated successfully',
        alert: {
          id: updatedAlert.id,
          status: updatedAlert.status,
          updatedAt: updatedAlert.updated_at
        }
      });

    } catch (error) {
      console.error('Update alert status error:', error);
      res.status(500).json({ error: 'Failed to update alert status' });
    }
  }
);

// Delete alert
router.delete('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM alerts 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [alertId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found or not authorized' });
    }

    res.json({ message: 'Alert deleted successfully' });

  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;