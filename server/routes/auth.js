const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

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
      const result = await query(
        'SELECT id, email, first_name, last_name, phone, role, is_verified, created_at FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'User not found or inactive' });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  });
}

// Register endpoint
router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
    body('phone').optional().isMobilePhone()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName, phone, role = 'tourist' } = req.body;

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert new user
      const result = await query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, phone, role, created_at
      `, [userId, email, passwordHash, firstName, lastName, phone, role]);

      const newUser = result.rows[0];

      // Generate JWT token
      const token = generateToken(newUser);

      // Log successful registration
      console.log('✅ New user registered:', { userId: newUser.id, email: newUser.email });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.created_at
        },
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }
);

// Login endpoint
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const result = await query(`
        SELECT id, email, password_hash, first_name, last_name, phone, role, is_verified, is_active
        FROM users 
        WHERE email = $1
      `, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      // Generate JWT token
      const token = generateToken(user);

      // Log successful login
      console.log('✅ User logged in:', { userId: user.id, email: user.email });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          isVerified: user.is_verified
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        phone: req.user.phone,
        role: req.user.role,
        isVerified: req.user.is_verified,
        createdAt: req.user.created_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', 
  authenticateToken,
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('phone').optional().isMobilePhone()
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

      const { firstName, lastName, phone } = req.body;
      const userId = req.user.id;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCounter = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramCounter}`);
        values.push(firstName);
        paramCounter++;
      }

      if (lastName !== undefined) {
        updates.push(`last_name = $${paramCounter}`);
        values.push(lastName);
        paramCounter++;
      }

      if (phone !== undefined) {
        updates.push(`phone = $${paramCounter}`);
        values.push(phone);
        paramCounter++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Add updated_at and user ID
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const result = await query(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, email, first_name, last_name, phone, role, is_verified, updated_at
      `, values);

      const updatedUser = result.rows[0];

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          role: updatedUser.role,
          isVerified: updatedUser.is_verified,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Logout endpoint (optional - mainly for logging)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly client-side
    // But we can log it for analytics
    console.log('👋 User logged out:', { userId: req.user.id, email: req.user.email });
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role
    }
  });
});

module.exports = { router, authenticateToken };