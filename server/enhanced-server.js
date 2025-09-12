const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { Pool } = require('pg');
// const nodemailer = require('nodemailer'); // Commented out for now
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection with real PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tourist_safety',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "https://maps.googleapis.com"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Allow more frequent emergency requests
  message: 'Emergency request limit exceeded'
});

app.use('/api/', limiter);
app.use('/api/emergency/', emergencyLimiter);

// Import enhanced route modules
const enhancedLocationRoutes = require('./routes/enhanced-location');
const enhancedWeatherRoutes = require('./routes/enhanced-weather');
const enhancedEmergencyRoutes = require('./routes/enhanced-emergency');
const adminRoutes = require('./routes/admin');
const { router: authRoutes } = require('./routes/auth');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token with your authentication service
    // This is a simplified example - implement your actual token verification
    const decoded = verifyJWTToken(token);
    
    // Get user from database
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// API Routes with real integrations
app.use('/api/location', authenticateToken, enhancedLocationRoutes);
app.use('/api/weather', enhancedWeatherRoutes); // Weather can be public
app.use('/api/emergency', authenticateToken, enhancedEmergencyRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (auth handled within routes)
app.use('/api/auth', authRoutes); // Authentication routes (login, register, etc.)

// Real-time tourist registration with verification
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, emergencyContacts, preferences } = req.body;
    
    console.log(`👤 New tourist registration: ${email}`);
    
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email or phone' });
    }
    
    // Hash password (implement proper password hashing)
    const hashedPassword = await hashPassword(password);
    
    // Create user with real data
    const userQuery = `
      INSERT INTO users (name, email, phone, password, preferences, created_at, last_active)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, email, phone, preferences, created_at
    `;
    
    const userResult = await pool.query(userQuery, [
      name, email, phone, hashedPassword, JSON.stringify(preferences || {})
    ]);
    
    const user = userResult.rows[0];
    
    // Add emergency contacts if provided
    if (emergencyContacts && emergencyContacts.length > 0) {
      for (let i = 0; i < emergencyContacts.length; i++) {
        const contact = emergencyContacts[i];
        await pool.query(
          'INSERT INTO emergency_contacts (user_id, name, phone, email, relationship, priority) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.id, contact.name, contact.phone, contact.email, contact.relationship, i + 1]
        );
      }
    }
    
    // Generate real JWT token
    const token = generateJWTToken({ userId: user.id, email: user.email });
    
    // Send welcome SMS/Email (optional)
    await sendWelcomeNotifications(user);
    
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
        createdAt: user.created_at
      },
      token,
      message: 'Registration successful'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Real-time tourist login with session tracking
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Login attempt: ${email}`);
    
    // Get user from database
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password (implement proper password verification)
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last active timestamp
    await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);
    
    // Generate real JWT token
    const token = generateJWTToken({ userId: user.id, email: user.email });
    
    // Get user's emergency contacts
    const contactsQuery = 'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY priority';
    const contactsResult = await pool.query(contactsQuery, [user.id]);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
        emergencyContacts: contactsResult.rows
      },
      token,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Real device pairing endpoint
app.post('/api/pair-device', authenticateToken, async (req, res) => {
  try {
    const { deviceId, deviceType, deviceName, capabilities } = req.body;
    const userId = req.user.id;
    
    console.log(`📱 Device pairing: ${deviceType} for user ${userId}`);
    
    // Check if device already paired
    const existingDevice = await pool.query(
      'SELECT id FROM iot_devices WHERE device_id = $1',
      [deviceId]
    );
    
    if (existingDevice.rows.length > 0) {
      return res.status(409).json({ error: 'Device already paired' });
    }
    
    // Pair new device with real data
    const deviceQuery = `
      INSERT INTO iot_devices (
        user_id, device_id, device_type, device_name, capabilities, 
        status, paired_at, last_seen
      ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
      RETURNING *
    `;
    
    const deviceResult = await pool.query(deviceQuery, [
      userId, deviceId, deviceType, deviceName, JSON.stringify(capabilities || {})
    ]);
    
    const device = deviceResult.rows[0];
    
    res.json({
      device: {
        id: device.id,
        deviceId: device.device_id,
        deviceType: device.device_type,
        deviceName: device.device_name,
        capabilities: device.capabilities,
        status: device.status,
        pairedAt: device.paired_at
      },
      message: 'Device paired successfully'
    });
    
  } catch (error) {
    console.error('Device pairing error:', error);
    res.status(500).json({ error: 'Device pairing failed' });
  }
});

// Real-time system health check
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await pool.query('SELECT NOW()');
    const dbHealthy = dbCheck.rows.length > 0;
    
    // Check external API connections
    const weatherApiHealthy = !!process.env.OPENWEATHER_API_KEY;
    const mapsApiHealthy = !!process.env.GOOGLE_MAPS_API_KEY;
    const twilioHealthy = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const emailHealthy = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    
    // Get system metrics
    const metrics = await getSystemMetrics();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        weatherApi: weatherApiHealthy ? 'configured' : 'not_configured',
        mapsApi: mapsApiHealthy ? 'configured' : 'not_configured',
        smsService: twilioHealthy ? 'configured' : 'not_configured',
        emailService: emailHealthy ? 'configured' : 'not_configured'
      },
      metrics: metrics,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Determine overall status
    if (!dbHealthy) {
      healthStatus.status = 'unhealthy';
    } else if (!weatherApiHealthy || !mapsApiHealthy) {
      healthStatus.status = 'degraded';
    }
    
    res.json(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==== HELPER FUNCTIONS ====

function verifyJWTToken(token) {
  // Implement actual JWT verification
  // This is a placeholder - use a proper JWT library like jsonwebtoken
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateJWTToken(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
}

async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
}

async function sendWelcomeNotifications(user) {
  try {
    // Send welcome SMS (optional)
    if (process.env.TWILIO_ACCOUNT_SID && user.phone) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Welcome to Tourist Safety System, ${user.name}! Your account is now active. Stay safe on your travels.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });
    }
    
    // Send welcome email (optional) - Commented out for now
    /*
    if (process.env.EMAIL_USER && user.email) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Welcome to Tourist Safety System',
        html: `
          <h2>Welcome ${user.firstName}!</h2>
          <p>Your account has been created successfully.</p>
          <p>Role: ${user.role}</p>
          <p>Please keep your login credentials safe.</p>
        `
      });
    }
    */  } catch (error) {
    console.error('Welcome notifications error:', error);
    // Don't fail registration if notifications fail
  }
}

async function getSystemMetrics() {
  try {
    // Get basic system metrics
    const startTime = process.hrtime();
    const memUsage = process.memoryUsage();
    
    // Database metrics
    const dbMetrics = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM emergency_alerts WHERE created_at > NOW() - INTERVAL '24 hours') as alerts_24h,
        (SELECT COUNT(*) FROM locations WHERE timestamp > NOW() - INTERVAL '1 hour') as active_tracking
    `);
    
    const endTime = process.hrtime(startTime);
    const responseTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
    
    return {
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      database: dbMetrics.rows[0] || {},
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
  } catch (error) {
    console.error('Metrics collection error:', error);
    return {
      uptime: process.uptime(),
      error: 'Unable to collect full metrics'
    };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close database connections
  await pool.end();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  // Close database connections
  await pool.end();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Enhanced Tourist Safety Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'production domains' : 'localhost'}`);
  console.log(`🔧 Database: ${pool.options.connectionString ? 'Connected' : 'Not configured'}`);
  console.log(`🗝️  APIs configured: Weather(${!!process.env.OPENWEATHER_API_KEY}), Maps(${!!process.env.GOOGLE_MAPS_API_KEY}), SMS(${!!process.env.TWILIO_ACCOUNT_SID})`);
});

module.exports = app;