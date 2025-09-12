const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration for PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tourist_safety',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  
  // SSL configuration for production
  ...(process.env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: false
    }
  })
};

// Create connection pool
const pool = new Pool(dbConfig);

// Database initialization function
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection established');
    
    // Check if PostGIS extension exists
    const postgisCheck = await client.query(`
      SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis');
    `);
    
    if (!postgisCheck.rows[0].exists) {
      console.log('📍 Installing PostGIS extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ PostGIS extension installed');
    }
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Executing database schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        try {
          await client.query(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.warn('⚠️ Schema statement warning:', error.message);
          }
        }
      }
      
      console.log('✅ Database schema initialized');
    } else {
      console.log('⚠️ Schema file not found, skipping schema initialization');
    }
    
    // Insert default data
    await insertDefaultData(client);
    
    client.release();
    console.log('🎉 Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Insert default/sample data
async function insertDefaultData(client) {
  try {
    console.log('📊 Inserting default data...');
    
    // Check if we already have data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('📊 Data already exists, skipping default data insertion');
      return;
    }
    
    // Insert sample user
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_verified, role)
      VALUES (
        'user_1',
        'tourist@example.com',
        '$2b$10$example_hash',
        'Tourist',
        'User',
        '+1234567890',
        true,
        'tourist'
      ) ON CONFLICT (id) DO NOTHING;
    `);
    
    // Insert emergency contacts
    await client.query(`
      INSERT INTO emergency_contacts (country_code, service_type, number, description)
      VALUES 
        ('IN', 'police', '100', 'India Police Emergency'),
        ('IN', 'ambulance', '108', 'India Ambulance Service'),
        ('IN', 'fire', '101', 'India Fire Department'),
        ('IN', 'tourist_helpline', '1363', 'India Tourism Helpline'),
        ('US', 'emergency', '911', 'US Emergency Services'),
        ('UK', 'emergency', '999', 'UK Emergency Services'),
        ('FR', 'emergency', '112', 'France Emergency Services'),
        ('DE', 'emergency', '112', 'Germany Emergency Services'),
        ('JP', 'police', '110', 'Japan Police'),
        ('AU', 'emergency', '000', 'Australia Emergency')
      ON CONFLICT (country_code, service_type) DO NOTHING;
    `);
    
    // Insert sample safe zones
    await client.query(`
      INSERT INTO safe_zones (name, description, coordinates, safety_score, zone_type)
      VALUES 
        ('Khan Market', 'Popular shopping area with good security', ST_GeomFromText('POINT(77.2296 28.5738)', 4326), 8.5, 'commercial'),
        ('India Gate', 'Major tourist attraction with police presence', ST_GeomFromText('POINT(77.2295 28.6129)', 4326), 9.0, 'tourist'),
        ('Connaught Place', 'Central business district', ST_GeomFromText('POINT(77.2203 28.6304)', 4326), 7.5, 'commercial'),
        ('Red Fort', 'Historical monument with security', ST_GeomFromText('POINT(77.2410 28.6562)', 4326), 8.8, 'tourist')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('✅ Default data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
    // Don't throw error here as it's not critical for basic functionality
  }
}

// Query helper function with error handling
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.log('🐌 Slow query executed:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('❌ Database query error:', { text, params, error: error.message });
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
  process.exit(0);
});

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  healthCheck
};