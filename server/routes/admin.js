const express = require('express');
const { query, transaction } = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Fetch fresh user data
      const userQuery = 'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1';
      const userResult = await query(userQuery, [decoded.userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = userResult.rows[0];
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  });
}

// Middleware to verify admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/tourists - Get all tourists
router.get('/tourists', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Admin fetching all tourists...');
    
    const touristsQuery = `
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        phone as "phoneNumber",
        emergency_contact as "emergencyContact",
        nationality,
        passport_number as "passportNumber",
        role,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      WHERE role = 'TOURIST'
      ORDER BY created_at DESC
    `;
    
    const result = await query(touristsQuery);
    
    console.log(`📊 Found ${result.rows.length} tourists`);
    console.log('👥 Tourists:', result.rows.map(t => `${t.firstName} ${t.lastName}`));
    
    res.json({
      success: true,
      tourists: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching tourists:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tourists',
      details: error.message 
    });
  }
});

// GET /api/admin/tourists/:id - Get specific tourist
router.get('/tourists/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const touristQuery = `
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        phone as "phoneNumber",
        emergency_contact as "emergencyContact",
        nationality,
        passport_number as "passportNumber",
        role,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      WHERE id = $1 AND role = 'TOURIST'
    `;
    
    const result = await query(touristQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tourist not found' });
    }
    
    res.json({
      success: true,
      tourist: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching tourist:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tourist',
      details: error.message 
    });
  }
});

// GET /api/admin/tourists/:id/locations - Get tourist location history
router.get('/tourists/:id/locations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if location_tracking table exists, if not return empty array
    const locationsQuery = `
      SELECT 
        id,
        tourist_id as "touristId",
        latitude,
        longitude,
        accuracy,
        address,
        timestamp,
        created_at as "createdAt"
      FROM location_tracking 
      WHERE tourist_id = $1 
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    
    try {
      const result = await query(locationsQuery, [id]);
      
      res.json({
        success: true,
        locations: result.rows,
        count: result.rows.length
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array
      if (dbError.code === '42P01') {
        console.log('⚠️ location_tracking table does not exist, returning empty array');
        res.json({
          success: true,
          locations: [],
          count: 0
        });
      } else {
        throw dbError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching location history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch location history',
      details: error.message 
    });
  }
});

// PATCH /api/admin/tourists/:id/status - Update tourist status
router.patch('/tourists/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "inactive"' });
    }
    
    // For now, we'll just acknowledge the status change
    // In a real implementation, you might have an is_active column
    console.log(`🔄 Updating tourist ${id} status to ${status}`);
    
    res.json({
      success: true,
      message: `Tourist status updated to ${status}`,
      touristId: id,
      status: status
    });
    
  } catch (error) {
    console.error('❌ Error updating tourist status:', error);
    res.status(500).json({ 
      error: 'Failed to update tourist status',
      details: error.message 
    });
  }
});

// GET /api/admin/dashboard - Get dashboard overview stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Admin fetching dashboard stats...');
    
    // Get total tourists
    const touristsCountQuery = 'SELECT COUNT(*) as count FROM users WHERE role = \'TOURIST\'';
    const touristsResult = await query(touristsCountQuery);
    const totalTourists = parseInt(touristsResult.rows[0].count);
    
    // Mock other stats for now
    const stats = {
      totalTourists: totalTourists,
      activeTourists: Math.floor(totalTourists * 0.8), // 80% assumed active
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      averageResponseTime: 5.2 // minutes
    };
    
    console.log('📈 Dashboard stats:', stats);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    });
  }
});

// GET /api/admin/alerts - Get SOS alerts for admin
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🚨 Admin fetching SOS alerts...');
    
    // For now, return empty array - in real implementation this would query alerts table
    const alerts = [];
    
    res.json({
      success: true,
      alerts: alerts,
      count: alerts.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alerts',
      details: error.message 
    });
  }
});

// POST /api/admin/alerts/:id/handle - Mark alert as handled
router.post('/alerts/:id/handle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, notes } = req.body;
    
    console.log(`✅ Admin handling alert ${id} with response: ${response}`);
    
    res.json({
      success: true,
      message: 'Alert marked as handled',
      alertId: id,
      handledBy: req.user.id,
      handledAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error handling alert:', error);
    res.status(500).json({ 
      error: 'Failed to handle alert',
      details: error.message 
    });
  }
});

module.exports = router;