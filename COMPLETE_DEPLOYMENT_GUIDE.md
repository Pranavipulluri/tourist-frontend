# 🚀 Complete Tourist Safety System Deployment Guide

## 📋 Prerequisites

1. **Node.js** (v18+) - for frontend and backend
2. **PostgreSQL** (v14+) with PostGIS extension
3. **Python** (v3.8+) - for the backend server
4. **API Keys**:
   - Google Maps API key: `AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A`
   - Twilio account (for SMS)
   - SMTP email account

## 🗄️ Database Setup

### 1. Install PostgreSQL with PostGIS
```bash
# Windows (using chocolatey)
choco install postgresql postgis

# Or download from: https://www.postgresql.org/download/
```

### 2. Create Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE tourist_safety;
\c tourist_safety;

-- Enable PostGIS extension
CREATE EXTENSION postgis;
```

### 3. Run Database Schema
```bash
cd d:\hackfinti\tourist-safety-frontend
psql -U postgres -d tourist_safety -f schema.sql
```

## 🖥️ Backend Setup (Port 3001)

### 1. Install Backend Dependencies
```bash
cd d:\hackfinti\tourist-safety-frontend\server
npm install
```

### 2. Environment Configuration
Create `server/.env`:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/tourist_safety
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tourist_safety
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Keys
GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
OPENWEATHER_API_KEY=your_openweather_key

# Twilio Configuration (for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Email Configuration (for email alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:5173

# Emergency Configuration
EMERGENCY_INACTIVITY_THRESHOLD=30  # minutes
EMERGENCY_RESPONSE_TIMEOUT=300     # seconds (5 minutes)
```

### 3. Start Backend Server
```bash
cd d:\hackfinti\tourist-safety-frontend\server
npm run dev
```

**Backend will be available at: http://localhost:3001**

## 🌐 Frontend Setup (Port 5173)

### 1. Install Frontend Dependencies
```bash
cd d:\hackfinti\tourist-safety-frontend
npm install
```

### 2. Environment Configuration
Create `.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDtcXKmULv8nTuOPOyEvXHVd5HGDgKQ81A
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Start Frontend Development Server
```bash
cd d:\hackfinti\tourist-safety-frontend
npm run dev
```

**Frontend will be available at: http://localhost:5173**

## 🚦 Complete System Startup

### Quick Start (Windows Batch)
Run the complete setup with our batch script:
```bash
cd d:\hackfinti\tourist-safety-frontend
.\setup-complete.bat
```

### Manual Step-by-Step:

1. **Start PostgreSQL Database**
   ```bash
   # Windows service
   net start postgresql-x64-14
   ```

2. **Start Backend Server**
   ```bash
   cd d:\hackfinti\tourist-safety-frontend\server
   npm run dev
   ```

3. **Start Frontend** (in new terminal)
   ```bash
   cd d:\hackfinti\tourist-safety-frontend
   npm run dev
   ```

## 📱 System Features Verification

### 1. Maps & Location Testing
- ✅ **Google Maps Integration**: Maps should load with your location
- ✅ **Current Location**: Blue dot showing your position
- ✅ **Geofencing**: Safe zones and danger zones displayed
- ✅ **Location Tracking**: Real-time position updates

### 2. Emergency System Testing
- ✅ **SOS Button**: Triggers immediate emergency alert
- ✅ **Automated Monitoring**: SMS/call when inactive >30 minutes
- ✅ **Danger Zone Alerts**: Notifications when entering unsafe areas
- ✅ **Emergency Contacts**: Auto-notify personal and official contacts

### 3. IoT Device Integration
- ✅ **Device Pairing**: Connect smartwatch/panic button
- ✅ **Battery Monitoring**: Real-time device status
- ✅ **Emergency Commands**: Remote panic button activation

## 🔧 API Endpoints Available

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Location Tracking
- `POST /location/update` - Update user location
- `GET /location/current` - Get current location
- `GET /location/history` - Location history
- `GET /location/safe-zones` - Get safe zones
- `GET /location/safety-score` - Safety score for area

### Emergency Alerts
- `POST /emergency/alert` - Trigger emergency alert
- `POST /emergency/safety-check` - Automated safety check
- `GET /emergency/contacts/:countryCode` - Emergency contacts
- `POST /emergency/personal-contacts` - Add personal contact

### Alerts Management
- `GET /alerts/my-alerts` - User's alerts
- `GET /alerts/nearby` - Nearby alerts
- `POST /alerts` - Create new alert
- `PUT /alerts/:id/acknowledge` - Acknowledge alert

### Device Management
- `POST /devices/register` - Register IoT device
- `GET /devices` - Get user devices
- `POST /devices/:id/command` - Send device command

### Analytics
- `GET /analytics/safety-metrics` - Safety analytics
- `GET /analytics/location-patterns` - Location patterns
- `GET /analytics/risk-assessment` - Risk assessment

## 🔒 Security Features

- **JWT Authentication**: Secure API access
- **Input Validation**: All endpoints validate input
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Frontend-backend communication
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🛡️ Emergency Features

### Automated Safety Monitoring
1. **Inactivity Detection**: Triggers alert if user inactive >30 minutes
2. **Geofencing**: Automatic alerts when entering danger zones
3. **SMS Notifications**: Via Twilio to emergency contacts
4. **Email Alerts**: Backup notification system
5. **Real-time Updates**: Socket.IO for instant alerts

### Manual Emergency Options
1. **SOS Button**: Immediate emergency broadcast
2. **Panic Button**: Send location + distress message
3. **Emergency Contacts**: Quick dial to local services
4. **Share Location**: Send location to trusted contacts

## 🌍 Multi-language Support

The system supports 6 languages:
- 🇺🇸 English
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇮🇳 Hindi
- 🇯🇵 Japanese

## 📊 Real-time Features

- **Live Location Tracking**: Updates every 30 seconds
- **Emergency Broadcasts**: Instant notifications
- **Device Status**: Real-time battery and connectivity
- **Safety Alerts**: Immediate danger zone warnings
- **Activity Monitoring**: Automated inactivity detection

## 🚨 Troubleshooting

### Maps Not Loading
1. Check Google Maps API key in `.env.local`
2. Verify API key has Maps JavaScript API enabled
3. Check browser console for errors
4. Ensure location permissions granted

### Backend Connection Issues
1. Verify backend running on port 3001
2. Check CORS settings in backend
3. Ensure database connection working
4. Check API endpoint URLs in frontend

### Database Issues
1. Verify PostgreSQL running
2. Check PostGIS extension installed
3. Verify database credentials
4. Run schema.sql if tables missing

### Emergency Features Not Working
1. Check Twilio credentials in backend `.env`
2. Verify SMTP email settings
3. Test emergency endpoints manually
4. Check Socket.IO connection

## 📞 Support

If you encounter issues:
1. Check console logs in browser (F12)
2. Check backend server logs
3. Verify all environment variables set
4. Test API endpoints with Postman/curl

## 🎯 Success Criteria

Your system is working correctly when:
- ✅ Maps load with current location
- ✅ Location updates in real-time
- ✅ Emergency alerts trigger SMS/email
- ✅ Geofencing detects zone entry/exit
- ✅ Device pairing and monitoring works
- ✅ Multi-language switching functions
- ✅ All 6 languages display properly
- ✅ Automated safety monitoring active
- ✅ Real-time Socket.IO updates working

**🎉 Congratulations! Your complete Tourist Safety System is now running with:**
- Real-time location tracking and geofencing
- Automated emergency detection and alerts
- SMS/email notifications system
- IoT device integration
- Multi-language support
- Professional safety analytics
- Complete backend API with spatial database queries

The system will automatically send SMS and email alerts when:
- User is inactive for more than 30 minutes
- User enters a danger zone
- Manual emergency button is pressed
- IoT device triggers panic alert