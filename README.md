# Tourist Safety Frontend

A modern React TypeScript application for the Tourist Safety Monitoring & Incident Response System.

## Features

- **Real-time Location Tracking** - GPS-based location monitoring with geofencing
- **Emergency Alerts** - SOS and panic button functionality with instant notifications
- **Digital ID System** - Blockchain-based secure digital identity with QR codes
- **IoT Device Integration** - Support for smartwatches, panic buttons, and GPS trackers
- **Admin Dashboard** - Comprehensive monitoring and management interface
- **WebSocket Integration** - Real-time updates and notifications
- **PWA Support** - Installable progressive web app for mobile devices

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **WebSocket** for real-time updates
- **Responsive CSS** with modern design
- **PWA** capabilities

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running on port 3000

### Installation

1. **Clone and setup:**
```bash
git clone <repository>
cd tourist-safety-frontend
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your backend URL
```

3. **Start development server:**
```bash
npm start
```

The app will open at http://localhost:3001

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Dashboard/       # Tourist dashboard
│   ├── Admin/           # Admin dashboard
│   ├── Profile/         # User profile & settings
│   ├── Location/        # Location history
│   ├── Alerts/          # Alerts management
│   └── Layout/          # Layout components
├── contexts/            # React contexts
├── services/            # API and WebSocket services
├── types/               # TypeScript type definitions
└── App.tsx             # Main app component
```

## Key Components

### Authentication
- Login/Register forms with validation
- JWT token management with auto-refresh
- Protected routes

### Tourist Dashboard
- Emergency controls (SOS/Panic buttons)
- Real-time location tracking
- Device status monitoring
- Digital ID management
- Recent alerts display

### Admin Dashboard
- Live activity feed
- Tourist management
- Alert monitoring and resolution
- Analytics and heatmaps
- Real-time statistics

### Features

#### Emergency System
- **SOS Button**: Triggers critical emergency alert
- **Panic Button**: Quick distress signal
- **Automatic Location**: GPS coordinates included in alerts
- **Real-time Notifications**: Instant WebSocket updates

#### Location Tracking
- **Continuous GPS**: Background location monitoring
- **Geofencing**: Alerts for restricted areas
- **History**: Complete location timeline
- **Accuracy Tracking**: GPS precision monitoring

#### Digital Identity
- **QR Code Generation**: Instant verification
- **Blockchain Security**: Tamper-proof records
- **Tourist Information**: Complete profile data
- **Authority Access**: Quick ID verification

#### IoT Integration
- **Device Pairing**: Simple setup process
- **Battery Monitoring**: Real-time status
- **Multi-device Support**: Various device types
- **Remote Configuration**: OTA updates

## API Integration

The frontend integrates with these backend endpoints:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

### Tourist Management
- `GET /api/v1/tourists/profile` - Get profile
- `PUT /api/v1/tourists/profile` - Update profile
- `POST /api/v1/tourists/digital-id` - Create digital ID

### Location Tracking
- `POST /api/v1/locations/update` - Location update
- `GET /api/v1/locations/history` - Location history

### Emergency Alerts
- `POST /api/v1/alerts/sos` - Trigger SOS
- `POST /api/v1/alerts/panic` - Trigger panic
- `GET /api/v1/alerts/my-alerts` - Get alerts

### IoT Devices
- `POST /api/v1/iot/pair` - Pair device
- `GET /api/v1/iot/my-device` - Get device status

## WebSocket Events

Real-time communication via WebSocket:

```javascript
// Client events
socket.emit('join_tourist_tracking', { touristId });
socket.emit('subscribe_to_alerts');

// Server events
socket.on('location_updated', handleLocationUpdate);
socket.on('new_alert', handleNewAlert);
socket.on('critical_alert', handleCriticalAlert);
```

## Security Features

- **JWT Authentication** with automatic refresh
- **HTTPS Enforcement** in production
- **Input Validation** on all forms
- **XSS Protection** via React
- **CSRF Protection** via SameSite cookies
- **Content Security Policy** headers

## Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
npm install -g serve
serve -s build -l 3001
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3000` |
| `REACT_APP_WS_URL` | WebSocket URL | `ws://localhost:3000` |
| `REACT_APP_ENVIRONMENT` | Environment | `development` |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance

- **Code Splitting** - Lazy loaded routes
- **Service Worker** - PWA caching
- **Image Optimization** - WebP support
- **Bundle Analysis** - Webpack bundle analyzer
- **Lighthouse Score** - 90+ performance

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is proprietary software for the Tourist Safety Monitoring System.

## Support

For technical support or questions:
- Email: support@touristsafety.com
- Documentation: https://docs.touristsafety.com
- Issues: GitHub Issues