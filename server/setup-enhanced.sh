#!/bin/bash

# ========================================
# ENHANCED TOURIST SAFETY BACKEND SETUP
# Real API Integration Setup Script
# ========================================

echo "🚀 Starting Enhanced Tourist Safety Backend Setup..."
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if version is >= 18
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js version should be >= 18.0.0. Current: $NODE_VERSION"
        print_warning "Consider upgrading: https://nodejs.org/"
    fi
else
    print_error "Node.js not found. Please install Node.js >= 18.0.0"
    print_error "Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
print_status "Checking npm installation..."
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check if PostgreSQL is installed
print_status "Checking PostgreSQL installation..."
if command -v psql > /dev/null 2>&1; then
    POSTGRES_VERSION=$(psql --version)
    print_success "PostgreSQL found: $POSTGRES_VERSION"
else
    print_warning "PostgreSQL not found. Please install PostgreSQL >= 12"
    print_warning "Download from: https://www.postgresql.org/download/"
    print_warning "Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p migrations
mkdir -p seeds
mkdir -p scripts
mkdir -p middleware
mkdir -p utils
mkdir -p test
print_success "Directories created"

# Copy environment file
print_status "Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Environment file created from example"
        print_warning "Please edit .env file with your real API keys!"
    else
        print_warning ".env.example not found. Creating basic .env file..."
        cat > .env << EOL
# Basic configuration - REPLACE WITH YOUR REAL API KEYS
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/tourist_safety
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024

# REPLACE THESE WITH YOUR REAL API KEYS
GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
OPENWEATHER_API_KEY=your_openweather_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EOL
        print_success "Basic .env file created"
    fi
else
    print_success "Environment file already exists"
fi

# Database setup
print_status "Setting up database..."
if command -v psql > /dev/null 2>&1; then
    # Try to create database
    print_status "Creating PostgreSQL database..."
    
    # Check if database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw tourist_safety; then
        print_success "Database 'tourist_safety' already exists"
    else
        if createdb -U postgres tourist_safety 2>/dev/null; then
            print_success "Database 'tourist_safety' created"
        else
            print_warning "Could not create database automatically"
            print_warning "Please create database manually:"
            print_warning "  sudo -u postgres createdb tourist_safety"
            print_warning "  Or: CREATE DATABASE tourist_safety;"
        fi
    fi
    
    # Enable PostGIS extension
    print_status "Enabling PostGIS extension..."
    if psql -U postgres -d tourist_safety -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null; then
        print_success "PostGIS extension enabled"
    else
        print_warning "Could not enable PostGIS extension automatically"
        print_warning "Please enable manually: CREATE EXTENSION postgis;"
    fi
else
    print_warning "PostgreSQL not available. Skipping database setup."
fi

# Create database migration script
print_status "Creating database schema..."
cat > migrations/001_initial_schema.sql << 'EOL'
-- Tourist Safety System Database Schema
-- Enhanced version with real API integration support

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(100),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- IoT devices
CREATE TABLE IF NOT EXISTS iot_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    device_name VARCHAR(255),
    capabilities JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    paired_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    battery_level INTEGER,
    firmware_version VARCHAR(50)
);

-- Location tracking with PostGIS
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    geom GEOMETRY(POINT, 4326),
    timestamp TIMESTAMP DEFAULT NOW(),
    address TEXT,
    is_safe_zone BOOLEAN DEFAULT TRUE
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_user_time ON locations(user_id, timestamp);

-- Emergency alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    risk_score DOUBLE PRECISION DEFAULT 0,
    confidence DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    resolution_notes TEXT
);

-- Emergency notifications log
CREATE TABLE IF NOT EXISTS emergency_notifications (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES emergency_alerts(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES emergency_contacts(id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    error_message TEXT
);

-- Emergency responses
CREATE TABLE IF NOT EXISTS emergency_responses (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES emergency_alerts(id) ON DELETE CASCADE,
    responder_type VARCHAR(100),
    status VARCHAR(50),
    response_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Weather history
CREATE TABLE IF NOT EXISTS weather_history (
    id SERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    temperature DOUBLE PRECISION,
    condition VARCHAR(100),
    humidity INTEGER,
    wind_speed DOUBLE PRECISION,
    visibility DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    risk_score DOUBLE PRECISION,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Safety zones (geofencing)
CREATE TABLE IF NOT EXISTS safety_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'safe', 'danger', 'neutral'
    description TEXT,
    geom GEOMETRY(POLYGON, 4326),
    radius DOUBLE PRECISION, -- for circular zones
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency detections
CREATE TABLE IF NOT EXISTS emergency_detections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sensor_data JSONB,
    location_data JSONB,
    analysis_data JSONB,
    risk_data JSONB,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(100),
    user_id INTEGER REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_time ON emergency_alerts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weather_history_location_time ON weather_history(latitude, longitude, recorded_at);
CREATE INDEX IF NOT EXISTS idx_safety_zones_geom ON safety_zones USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_emergency_detections_user_time ON emergency_detections(user_id, detected_at);

-- Insert sample safety zones
INSERT INTO safety_zones (name, type, description, geom, created_at) VALUES
('City Center Safe Zone', 'safe', 'Well-lit and patrolled city center area', 
 ST_GeomFromText('POLYGON((77.2090 28.6139, 77.2190 28.6139, 77.2190 28.6239, 77.2090 28.6239, 77.2090 28.6139))', 4326),
 NOW()),
('Construction Danger Zone', 'danger', 'Active construction site - avoid this area',
 ST_GeomFromText('POLYGON((77.2150 28.6150, 77.2170 28.6150, 77.2170 28.6170, 77.2150 28.6170, 77.2150 28.6150))', 4326),
 NOW());

EOL

# Run database migration
if command -v psql > /dev/null 2>&1; then
    print_status "Running database migration..."
    if psql -U postgres -d tourist_safety -f migrations/001_initial_schema.sql 2>/dev/null; then
        print_success "Database schema created successfully"
    else
        print_warning "Could not run migration automatically"
        print_warning "Please run manually: psql -U postgres -d tourist_safety -f migrations/001_initial_schema.sql"
    fi
fi

# Create startup scripts
print_status "Creating startup scripts..."

# Development startup script
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Tourist Safety Backend (Development Mode)"
echo "====================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your API keys."
    exit 1
fi

# Start the development server
npm run dev
EOL

# Production startup script
cat > start-prod.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Tourist Safety Backend (Production Mode)"
echo "===================================================="

# Set production environment
export NODE_ENV=production

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please configure your production environment variables."
    exit 1
fi

# Start with PM2
npm run pm2:start
EOL

chmod +x start-dev.sh
chmod +x start-prod.sh
print_success "Startup scripts created"

# Create health check script
cat > health-check.sh << 'EOL'
#!/bin/bash
echo "🏥 Health Check for Tourist Safety Backend"
echo "=========================================="

# Check if server is running
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Server is healthy"
    curl -s http://localhost:5000/api/health | python3 -m json.tool
else
    echo "❌ Server is not responding"
    exit 1
fi
EOL

chmod +x health-check.sh
print_success "Health check script created"

# Create API key setup reminder
cat > setup-api-keys.md << 'EOL'
# 🔑 API Keys Setup Guide

## Required API Keys for Full Functionality

### 1. Google Maps API Key (Already Provided)
- **Status**: ✅ Already configured
- **Key**: `AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A`
- **Services**: Geocoding, Places, Maps

### 2. OpenWeather API Key (Required)
- **Get from**: https://openweathermap.org/api
- **Free tier**: 1,000 calls/day
- **Variable**: `OPENWEATHER_API_KEY`
- **Services**: Weather data, forecasts, alerts

### 3. Twilio SMS Service (Optional but Recommended)
- **Get from**: https://www.twilio.com/
- **Free trial**: $15 credit
- **Variables**: 
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- **Services**: Emergency SMS alerts

### 4. Email Service (Optional)
- **Gmail SMTP**: Use App Password
- **Variables**:
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
- **Services**: Email notifications

## Setup Instructions

1. Copy `.env.example` to `.env`
2. Replace placeholder values with your real API keys
3. Test each service individually
4. Monitor API usage and upgrade plans as needed

## Testing Your Setup

```bash
# Test weather API
curl "http://localhost:5000/api/weather/current/28.6139/77.2090"

# Test health endpoint
curl "http://localhost:5000/api/health"

# Check all configured services
npm run health
```

## Production Considerations

- Use environment variables instead of .env file
- Set up API key rotation
- Monitor API usage and costs
- Configure rate limiting appropriately
- Set up proper SSL/TLS certificates
EOL

print_success "API keys setup guide created"

# Final setup summary
echo ""
echo "======================================================"
print_success "Enhanced Tourist Safety Backend Setup Complete!"
echo "======================================================"
echo ""
print_status "📁 Project Structure:"
echo "   ├── enhanced-server.js       (Main server with real APIs)"
echo "   ├── server.js               (Original server)"
echo "   ├── routes/                 (Enhanced API routes)"
echo "   ├── .env                    (Environment configuration)"
echo "   ├── migrations/             (Database schema)"
echo "   ├── logs/                   (Application logs)"
echo "   └── start-dev.sh           (Development startup)"
echo ""
print_status "🔧 Next Steps:"
echo "   1. Edit .env file with your real API keys"
echo "   2. Ensure PostgreSQL is running"
echo "   3. Run: ./start-dev.sh"
echo "   4. Test: ./health-check.sh"
echo "   5. Read: setup-api-keys.md"
echo ""
print_warning "⚠️  Important:"
echo "   - Configure your real API keys in .env"
echo "   - Set up PostgreSQL database"
echo "   - Test all services before production"
echo ""
print_status "🚀 Start Development Server:"
echo "   ./start-dev.sh"
echo ""
print_status "🏥 Check Server Health:"
echo "   ./health-check.sh"
echo ""
print_status "📚 Documentation:"
echo "   - API Integration: REAL_API_INTEGRATION.md"
echo "   - API Keys Setup: setup-api-keys.md"
echo "   - Environment: .env.example"
echo ""
print_success "Happy coding! 🎉"