const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// All device routes require authentication
router.use(authenticateToken);

// Register IoT device
router.post('/register',
  [
    body('deviceId').trim().isLength({ min: 1 }),
    body('deviceType').isIn(['wearable', 'phone', 'tracker', 'sensor']),
    body('deviceName').trim().isLength({ min: 1, max: 100 })
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

      const { deviceId, deviceType, deviceName } = req.body;
      const userId = req.user.id;

      // Check if device already exists
      const existingDevice = await query(
        'SELECT id FROM iot_devices WHERE device_id = $1',
        [deviceId]
      );

      if (existingDevice.rows.length > 0) {
        return res.status(409).json({ error: 'Device already registered' });
      }

      const result = await query(`
        INSERT INTO iot_devices (user_id, device_id, device_type, device_name, status, last_seen)
        VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
        RETURNING id, device_id, device_type, device_name, status, created_at
      `, [userId, deviceId, deviceType, deviceName]);

      const newDevice = result.rows[0];

      res.status(201).json({
        message: 'Device registered successfully',
        device: {
          id: newDevice.id,
          deviceId: newDevice.device_id,
          deviceType: newDevice.device_type,
          deviceName: newDevice.device_name,
          status: newDevice.status,
          createdAt: newDevice.created_at
        }
      });

    } catch (error) {
      console.error('Device registration error:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  }
);

// Get user's devices
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        id,
        device_id,
        device_type,
        device_name,
        status,
        battery_level,
        last_seen,
        created_at
      FROM iot_devices
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    const devices = result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      deviceType: row.device_type,
      deviceName: row.device_name,
      status: row.status,
      batteryLevel: row.battery_level,
      lastSeen: row.last_seen,
      createdAt: row.created_at
    }));

    res.json({ devices });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Update device status
router.patch('/:deviceId/status',
  [
    body('status').isIn(['active', 'inactive', 'emergency']),
    body('batteryLevel').optional().isFloat({ min: 0, max: 100 }),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 })
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

      const { deviceId } = req.params;
      const { status, batteryLevel, latitude, longitude } = req.body;
      const userId = req.user.id;

      // Build update query dynamically
      const updates = ['last_seen = CURRENT_TIMESTAMP'];
      const values = [];
      let paramCounter = 1;

      if (status !== undefined) {
        updates.push(`status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      if (batteryLevel !== undefined) {
        updates.push(`battery_level = $${paramCounter}`);
        values.push(batteryLevel);
        paramCounter++;
      }

      // Add user and device ID for WHERE clause
      values.push(deviceId, userId);

      const result = await query(`
        UPDATE iot_devices 
        SET ${updates.join(', ')}
        WHERE device_id = $${paramCounter} AND user_id = $${paramCounter + 1}
        RETURNING id, device_id, status, battery_level, last_seen
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const updatedDevice = result.rows[0];

      // If location provided, update user location
      if (latitude && longitude) {
        await query(`
          UPDATE users 
          SET current_location = ST_GeomFromText('POINT($1 $2)', 4326),
              location_updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [longitude, latitude, userId]);
      }

      // Check for emergency status or low battery
      if (status === 'emergency' || (batteryLevel && batteryLevel <= 10)) {
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${userId}`).emit('device_alert', {
            deviceId: updatedDevice.device_id,
            type: status === 'emergency' ? 'emergency' : 'low_battery',
            message: status === 'emergency' ? 'Device emergency activated' : 'Device battery critically low',
            timestamp: new Date().toISOString()
          });
        }
      }

      res.json({
        message: 'Device status updated successfully',
        device: {
          id: updatedDevice.id,
          deviceId: updatedDevice.device_id,
          status: updatedDevice.status,
          batteryLevel: updatedDevice.battery_level,
          lastSeen: updatedDevice.last_seen
        }
      });

    } catch (error) {
      console.error('Update device status error:', error);
      res.status(500).json({ error: 'Failed to update device status' });
    }
  }
);

// Get device data/readings
router.get('/:deviceId/data', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;
    const { limit = 100, hours = 24 } = req.query;

    // Get device readings/sensor data
    const result = await query(`
      SELECT 
        d.device_name,
        d.device_type,
        d.status,
        d.battery_level,
        d.last_seen
      FROM iot_devices d
      WHERE d.device_id = $1 AND d.user_id = $2
    `, [deviceId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = result.rows[0];

    // Get location history for this device (if available)
    const locationHistory = await query(`
      SELECT 
        ST_X(coordinates) as longitude,
        ST_Y(coordinates) as latitude,
        accuracy,
        recorded_at
      FROM user_locations
      WHERE user_id = $1
        AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
      ORDER BY recorded_at DESC
      LIMIT $2
    `, [userId, limit]);

    const locations = locationHistory.rows.map(row => ({
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      timestamp: row.recorded_at
    }));

    res.json({
      device: {
        deviceId,
        name: device.device_name,
        type: device.device_type,
        status: device.status,
        batteryLevel: device.battery_level,
        lastSeen: device.last_seen
      },
      data: {
        locationHistory: locations,
        summary: {
          totalLocations: locations.length,
          timeRange: `${hours} hours`,
          lastUpdate: device.last_seen
        }
      }
    });

  } catch (error) {
    console.error('Get device data error:', error);
    res.status(500).json({ error: 'Failed to get device data' });
  }
});

// Send command to device
router.post('/:deviceId/command',
  [
    body('command').isIn(['locate', 'emergency', 'check_in', 'silent_alarm']),
    body('parameters').optional().isObject()
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

      const { deviceId } = req.params;
      const { command, parameters = {} } = req.body;
      const userId = req.user.id;

      // Verify device ownership
      const deviceResult = await query(
        'SELECT id FROM iot_devices WHERE device_id = $1 AND user_id = $2',
        [deviceId, userId]
      );

      if (deviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Log the command
      await query(`
        INSERT INTO device_commands (device_id, user_id, command, parameters, status)
        VALUES ($1, $2, $3, $4, 'sent')
      `, [deviceId, userId, command, JSON.stringify(parameters)]);

      // Emit command via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`device_${deviceId}`).emit('device_command', {
          command,
          parameters,
          timestamp: new Date().toISOString(),
          userId
        });
      }

      res.json({
        message: 'Command sent successfully',
        command: {
          deviceId,
          command,
          parameters,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Send device command error:', error);
      res.status(500).json({ error: 'Failed to send command' });
    }
  }
);

// Delete device
router.delete('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM iot_devices 
      WHERE device_id = $1 AND user_id = $2
      RETURNING id
    `, [deviceId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

module.exports = router;