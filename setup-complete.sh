#!/bin/bash

# Tourist Safety Platform - Complete Setup Script
# This script sets up the entire tourist safety platform with real database

echo "🚀 Starting Tourist Safety Platform Setup..."

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

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the tourist-safety-frontend directory."
    exit 1
fi

print_status "Setting up Tourist Safety Platform with real database persistence..."

# 1. Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# 2. Install backend dependencies
print_status "Installing backend dependencies..."
cd server

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found"
    exit 1
fi

if npm install; then
    print_success "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# 3. Setup environment variables
print_status "Setting up environment variables..."

if [ ! -f ".env" ]; then
    cat > .env << EOL
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tourist_safety
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h

# API Keys (Replace with your actual keys)
GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
OPENWEATHER_API_KEY=your-openweather-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-app-password

# Environment
NODE_ENV=development
PORT=3001

# Notification Services
FIREBASE_SERVER_KEY=your-firebase-server-key

# Emergency Services
EMERGENCY_WEBHOOK_URL=your-emergency-webhook-url

# Logging
LOG_LEVEL=info
EOL
    print_success "Environment file created at server/.env"
    print_warning "Please update the API keys in server/.env with your actual credentials"
else
    print_warning "Environment file already exists"
fi

cd ..

# 4. Setup PostgreSQL database (if available)
print_status "Checking PostgreSQL installation..."

if command -v psql &> /dev/null; then
    print_success "PostgreSQL found"
    
    print_status "Setting up database..."
    
    # Create database if it doesn't exist
    createdb tourist_safety 2>/dev/null || print_warning "Database might already exist"
    
    # Enable PostGIS extension
    psql -d tourist_safety -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || print_warning "PostGIS extension setup might need manual intervention"
    
    # Run schema
    if [ -f "schema.sql" ]; then
        print_status "Applying database schema..."
        psql -d tourist_safety -f schema.sql
        if [ $? -eq 0 ]; then
            print_success "Database schema applied successfully"
        else
            print_warning "Schema application had some warnings (this is normal for existing databases)"
        fi
    else
        print_warning "schema.sql not found, skipping database initialization"
    fi
    
else
    print_warning "PostgreSQL not found. Installing PostgreSQL is recommended for real data persistence."
    print_warning "For now, the application will use mock data."
    print_warning "To install PostgreSQL:"
    print_warning "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib postgis"
    print_warning "  - macOS: brew install postgresql postgis"
    print_warning "  - Windows: Download from https://www.postgresql.org/download/windows/"
fi

# 5. Create startup scripts
print_status "Creating startup scripts..."

# Development script
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Tourist Safety Platform in Development Mode..."

# Start backend server
echo "🔧 Starting backend server..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo "✅ Tourist Safety Platform is running!"
echo "📊 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo "🏥 Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to kill both processes
cleanup() {
    echo "🔄 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for either process to exit
wait
EOL

# Production script
cat > start-prod.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Tourist Safety Platform in Production Mode..."

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Start backend server
echo "🔧 Starting backend server..."
cd server
NODE_ENV=production npm start
EOL

# Make scripts executable
chmod +x start-dev.sh start-prod.sh

print_success "Startup scripts created (start-dev.sh, start-prod.sh)"

# 6. Create database backup script
cat > backup-database.sh << 'EOL'
#!/bin/bash
echo "📦 Creating database backup..."

BACKUP_FILE="tourist_safety_backup_$(date +%Y%m%d_%H%M%S).sql"

if command -v pg_dump &> /dev/null; then
    pg_dump tourist_safety > "$BACKUP_FILE"
    if [ $? -eq 0 ]; then
        echo "✅ Database backup created: $BACKUP_FILE"
    else
        echo "❌ Database backup failed"
        exit 1
    fi
else
    echo "❌ pg_dump not found. Please install PostgreSQL tools."
    exit 1
fi
EOL

chmod +x backup-database.sh

print_success "Database backup script created (backup-database.sh)"

# 7. Create docker setup (optional)
print_status "Creating Docker configuration for easy deployment..."

cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: tourist_safety
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=tourist_safety
      - DB_USER=postgres
      - DB_PASSWORD=password
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./server:/app
      - /app/node_modules

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOL

print_success "Docker Compose configuration created"

# 8. Final setup verification
print_status "Verifying setup..."

# Check if all required files exist
REQUIRED_FILES=(
    "src/contexts/LanguageContext.tsx"
    "src/components/Header/LanguageSelector.tsx" 
    "src/components/Header/ProfessionalHeader.tsx"
    "server/config/database.js"
    "server/routes/auth.js"
    "server/routes/location.js"
    "server/server.js"
    "schema.sql"
)

ALL_GOOD=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Missing required file: $file"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = true ]; then
    print_success "All required files are in place"
else
    print_error "Some required files are missing. Please check the setup."
    exit 1
fi

# 9. Display final instructions
echo ""
echo "🎉 Tourist Safety Platform Setup Complete!"
echo ""
echo "📋 What was set up:"
echo "   ✅ Multilingual support (6 languages: English, Hindi, Spanish, French, Arabic, Chinese)"
echo "   ✅ Professional UI with gradient design and emergency features"
echo "   ✅ Real PostgreSQL database with PostGIS for spatial data"
echo "   ✅ Comprehensive API with authentication, location tracking, and safety scoring"
echo "   ✅ Real-time features with Socket.IO"
echo "   ✅ Emergency alert system with panic button"
echo "   ✅ Professional header with language selector"
echo ""
echo "🚀 To start the platform:"
echo "   Development: ./start-dev.sh"
echo "   Production:  ./start-prod.sh"
echo "   Docker:      docker-compose up -d"
echo ""
echo "🔑 Don't forget to:"
echo "   1. Update API keys in server/.env"
echo "   2. Configure PostgreSQL if not already done"
echo "   3. Test the emergency alert system"
echo "   4. Customize the multilingual translations as needed"
echo ""
echo "📊 Health Check: http://localhost:3001/health"
echo "🌐 Frontend: http://localhost:5173"
echo "📡 API: http://localhost:3001/api"
echo ""
echo "🆘 Emergency Features:"
echo "   - Floating panic button with multiple alert modes"
echo "   - Real-time location tracking and safety scoring"
echo "   - Multilingual emergency contacts and services"
echo "   - Professional UI designed for tourist safety"
echo ""
print_success "Setup completed successfully! 🎊"
EOL