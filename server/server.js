const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const { initializeDatabase, healthCheck } = require('./config/database');

// Import route handlers
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const alertRoutes = require('./routes/alerts');
const deviceRoutes = require('./routes/devices');
const emergencyRoutes = require('./routes/emergency');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Emergency endpoints have higher rate limits
const emergencyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Higher limit for emergency endpoints
  message: 'Emergency rate limit exceeded, please contact support.',
});
app.use('/api/emergency/', emergencyLimiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong!',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server with database initialization
async function startServer() {
  try {
    console.log('🚀 Starting Tourist Safety Backend Server...');
    
    // Initialize database
    await initializeDatabase();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
      }
    });
    
    // Setup Socket.IO for real-time features
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-frontend-domain.com'] 
          : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });
    
    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('👤 User connected:', socket.id);
      
      // Join user to their personal room for targeted alerts
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined their room`);
      });
      
      // Handle location updates
      socket.on('location_update', (data) => {
        // Broadcast location update to relevant services
        socket.broadcast.to('location_monitors').emit('user_location_update', {
          userId: data.userId,
          location: data.location,
          timestamp: new Date().toISOString()
        });
      });
      
      // Handle emergency alerts
      socket.on('emergency_alert', (data) => {
        // Broadcast emergency to all connected emergency services
        io.to('emergency_services').emit('new_emergency', {
          userId: data.userId,
          location: data.location,
          type: data.type,
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
      });
      
      socket.on('disconnect', () => {
        console.log('👤 User disconnected:', socket.id);
      });
    });
    
    // Store io instance for use in routes
    app.set('io', io);
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;