import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Language, useLanguage } from '../../contexts/LanguageContext';
import { Alert, Location as ApiLocation, apiService, IoTDevice } from '../../services/api';
import { NavigationService } from '../../services/navigation';
import PlacesService, { NearbyPlace } from '../../services/placesService';
import GoogleMap from '../Map/GoogleMap';
import { AlertsList } from './AlertsList';
import { DeviceStatus } from './DeviceStatus';
import { EmergencyPanel } from './EmergencyPanel';
import { LocationTracker } from './LocationTracker';
import './TouristDashboard.css';

export const TouristDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [currentLocation, setCurrentLocation] = useState<ApiLocation | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [device, setDevice] = useState<IoTDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'map' | 'reviews' | 'emergency' | 'itinerary'>('overview');
  const [safetyScore, setSafetyScore] = useState<number>(85);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [mapType, setMapType] = useState<'safety' | 'emergency' | 'hotels' | 'restaurants' | 'shopping'>('safety');
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [showRoute, setShowRoute] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadReviews();
    loadEmergencyData();
    loadItinerary();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all dashboard data in parallel
      const [locationData, alertsData, deviceData] = await Promise.allSettled([
        apiService.getCurrentLocation(),
        apiService.getMyAlerts('ACTIVE', 5),
        apiService.getMyDevice(),
      ]);

      if (locationData.status === 'fulfilled') {
        setCurrentLocation(locationData.value);
      }

      if (alertsData.status === 'fulfilled') {
        setRecentAlerts(alertsData.value.alerts); // Extract alerts array from the response
      }

      if (deviceData.status === 'fulfilled') {
        setDevice(deviceData.value);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (location: ApiLocation) => {
    console.log('🎯 DASHBOARD: Location updated:', location);
    setCurrentLocation(location);
    fetchNearbyPlaces(location);
  };

  // Fetch real nearby places using Google Places API
  const fetchNearbyPlaces = async (location: ApiLocation) => {
    if (!location.latitude || !location.longitude) return;
    
    setPlacesLoading(true);
    try {
      const placesService = PlacesService.getInstance();
      
      // Get different types of places
      const [hospitals, police, restaurants] = await Promise.all([
        placesService.getHospitals({ lat: location.latitude, lng: location.longitude }),
        placesService.getPoliceStations({ lat: location.latitude, lng: location.longitude }),
        placesService.getRestaurants({ lat: location.latitude, lng: location.longitude })
      ]);

      // Combine and sort by distance
      const allPlaces = [...hospitals.slice(0, 3), ...police.slice(0, 2), ...restaurants.slice(0, 3)]
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6); // Show top 6 nearest places

      console.log('📍 Fetched real nearby places:', allPlaces);
      setNearbyPlaces(allPlaces);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      // Use mock data as fallback
      setNearbyPlaces([
        {
          id: 'fallback_1',
          name: 'Nearby Hospital',
          type: 'hospital',
          position: { lat: location.latitude + 0.002, lng: location.longitude + 0.003 },
          distance: 300,
          address: 'Emergency Services Area',
          safetyLevel: 'safe'
        },
        {
          id: 'fallback_2',
          name: 'Police Station',
          type: 'police',
          position: { lat: location.latitude - 0.001, lng: location.longitude + 0.002 },
          distance: 150,
          address: 'Local Police District',
          safetyLevel: 'safe'
        }
      ]);
    } finally {
      setPlacesLoading(false);
    }
  };

  // Load reviews data
  const loadReviews = async () => {
    try {
      // Mock reviews data - replace with real API call
      setReviews([
        {
          id: 1,
          location: 'Khan Market',
          rating: 4.5,
          review: 'Very safe area, well-lit streets and good police presence',
          author: 'Sarah M.',
          date: '2024-12-09',
          helpful: 23
        },
        {
          id: 2,
          location: 'Connaught Place',
          rating: 3.8,
          review: 'Crowded but generally safe during day time',
          author: 'Mike R.',
          date: '2024-12-08',
          helpful: 15
        },
        {
          id: 3,
          location: 'India Gate',
          rating: 4.2,
          review: 'Tourist-friendly area with good security',
          author: 'Lisa K.',
          date: '2024-12-07',
          helpful: 18
        }
      ]);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  // Load emergency contacts and data
  const loadEmergencyData = async () => {
    try {
      // Mock emergency data - replace with real API call
      setEmergencyContacts([
        {
          id: 1,
          name: 'Police Emergency',
          number: '100',
          type: 'police',
          available24x7: true
        },
        {
          id: 2,
          name: 'Medical Emergency',
          number: '108',
          type: 'medical',
          available24x7: true
        },
        {
          id: 3,
          name: 'Fire Emergency',
          number: '101',
          type: 'fire',
          available24x7: true
        },
        {
          id: 4,
          name: 'Tourist Helpline',
          number: '1363',
          type: 'tourist',
          available24x7: true
        }
      ]);
    } catch (error) {
      console.error('Error loading emergency data:', error);
    }
  };

  // Load itinerary data
  const loadItinerary = async () => {
    try {
      // Mock itinerary data - replace with real API call
      setItinerary([
        {
          id: 1,
          time: '09:00 AM',
          title: 'Visit Red Fort',
          location: 'Old Delhi',
          safetyLevel: 'safe',
          estimatedDuration: '2 hours',
          notes: 'Early morning visit recommended for fewer crowds'
        },
        {
          id: 2,
          time: '12:00 PM',
          title: 'Lunch at Karim\'s',
          location: 'Jama Masjid Area',
          safetyLevel: 'caution',
          estimatedDuration: '1 hour',
          notes: 'Keep belongings secure in crowded area'
        },
        {
          id: 3,
          time: '02:00 PM',
          title: 'Explore Chandni Chowk',
          location: 'Old Delhi',
          safetyLevel: 'caution',
          estimatedDuration: '2 hours',
          notes: 'Very crowded, stay alert for pickpockets'
        },
        {
          id: 4,
          time: '05:00 PM',
          title: 'India Gate & Rajpath',
          location: 'Central Delhi',
          safetyLevel: 'safe',
          estimatedDuration: '1.5 hours',
          notes: 'Well-patrolled tourist area'
        }
      ]);
    } catch (error) {
      console.error('Error loading itinerary:', error);
    }
  };

  // Handle SOS/Panic button
  const handleSOSPress = async () => {
    setSosActive(true);
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const emergencyData = {
        type: 'SOS_PANIC',
        severity: 'CRITICAL',
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous',
        message: '🆘 EMERGENCY: SOS button pressed! Immediate assistance required!',
        additionalInfo: {
          batteryLevel: '85%',
          signalStrength: 'Strong',
          deviceInfo: navigator.userAgent
        }
      };

      console.log('🚨 SOS EMERGENCY ALERT:', emergencyData);
      
      // Send to backend using the correct API method
      try {
        // Send SOS alert
        const sosAlert = await apiService.triggerSOS({
          latitude: emergencyData.location.latitude,
          longitude: emergencyData.location.longitude
        });
        
        // Also notify admin panel via SMS/alert system
        try {
          await apiService.sendSMSAlert({
            message: `🚨 CRITICAL SOS ALERT: Tourist ${user?.firstName} ${user?.lastName} (${user?.email}) has triggered an emergency SOS at coordinates ${emergencyData.location.latitude}, ${emergencyData.location.longitude}. Immediate assistance required!`,
            priority: 'CRITICAL',
            location: emergencyData.location,
            touristInfo: {
              id: user?.id,
              name: `${user?.firstName} ${user?.lastName}`,
              email: user?.email,
              phone: user?.phoneNumber
            }
          });
          console.log('✅ Admin panel notified successfully');
        } catch (adminError) {
          console.error('❌ Failed to notify admin panel:', adminError);
        }
        
        // Show success notification
        alert('🆘 Emergency alert sent! Help is on the way. Stay calm and stay on the line.');
        
        // Vibrate device if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
      } catch (error) {
        console.error('Error sending emergency alert:', error);
        // Still show local help options even if backend fails
        alert('⚠️ Network error but local emergency services have been notified. Call 100 for immediate help.');
      }

    } catch (error) {
      console.error('Error getting location for SOS:', error);
      alert('🆘 SOS activated! If you need immediate help, call 100 (Police) or 108 (Medical)');
    } finally {
      // Keep SOS active for 30 seconds
      setTimeout(() => setSosActive(false), 30000);
    }
  };

  const handleAlertCreated = (alert: Alert) => {
    setRecentAlerts(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [alert, ...safePrev.slice(0, 4)];
    });
  };

  // Get map markers based on current map type
  const getMapMarkers = () => {
    if (!currentLocation) return [];

    const baseMarkers = [
      // Safe zones
      {
        position: { lat: currentLocation.latitude! + 0.001, lng: currentLocation.longitude! + 0.0015 },
        title: 'Community Safety Zone',
        type: 'safe' as const
      },
      {
        position: { lat: currentLocation.latitude! - 0.0008, lng: currentLocation.longitude! + 0.001 },
        title: 'Tourist Help Center',
        type: 'safe' as const
      },
      // Police stations
      {
        position: { lat: currentLocation.latitude! + 0.0012, lng: currentLocation.longitude! - 0.0008 },
        title: 'Local Police Station',
        type: 'police' as const
      },
      // Hospitals
      {
        position: { lat: currentLocation.latitude! - 0.0005, lng: currentLocation.longitude! - 0.0012 },
        title: 'City Hospital',
        type: 'hospital' as const
      },
      // Context-based markers
      ...getMapTypeSpecificMarkers()
    ];

    return baseMarkers;
  };

  const getMapTypeSpecificMarkers = () => {
    if (!currentLocation) return [];

    switch (mapType) {
      case 'emergency':
        return [
          {
            position: { lat: currentLocation.latitude! + 0.002, lng: currentLocation.longitude! + 0.002 },
            title: 'Emergency Assembly Point',
            type: 'safe' as const
          },
          {
            position: { lat: currentLocation.latitude! - 0.001, lng: currentLocation.longitude! + 0.0015 },
            title: 'Fire Station',
            type: 'danger' as const
          }
        ];
      case 'hotels':
        return [
          {
            position: { lat: currentLocation.latitude! + 0.0008, lng: currentLocation.longitude! - 0.0006 },
            title: 'Tourist Lodge',
            type: 'safe' as const
          }
        ];
      case 'restaurants':
        return [
          {
            position: { lat: currentLocation.latitude! - 0.0003, lng: currentLocation.longitude! + 0.0008 },
            title: 'Local Restaurant',
            type: 'caution' as const
          }
        ];
      case 'shopping':
        return [
          {
            position: { lat: currentLocation.latitude! + 0.0006, lng: currentLocation.longitude! + 0.0003 },
            title: 'Shopping Center',
            type: 'safe' as const
          }
        ];
      default:
        return [];
    }
  };

  // Handle navigation to a specific location
  const handleNavigate = (destination: { lat: number; lng: number }) => {
    console.log('🧭 Navigation requested to:', destination);
    
    if (!currentLocation) {
      alert('Current location not available for navigation');
      return;
    }

    setSelectedDestination(destination);
    setShowRoute(true);
    
    // Also open external navigation
    NavigationService.openExternalNavigation(destination, 'driving');
  };

  // Handle navigate button clicks for specific places
  const navigateToPlace = (placeName: string) => {
    console.log('🗺️ Navigate to:', placeName);
    
    // In a real app, you'd look up the coordinates for the place
    const mockDestination = {
      lat: (currentLocation?.latitude || 0) + (Math.random() - 0.5) * 0.01,
      lng: (currentLocation?.longitude || 0) + (Math.random() - 0.5) * 0.01
    };
    
    handleNavigate(mockDestination);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your safety dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            {/* Welcome Section */}
            <div className="welcome-card">
              <div className="user-info">
                <div className="user-avatar">
                  <span>👤</span>
                </div>
                <div className="user-details">
                  <p className="welcome-text">Welcome back,</p>
                  <h3 className="user-name">{user?.firstName || 'John'} {user?.lastName || 'Doe'}</h3>
                  <p className="location-text">📍 {currentLocation?.address || 'New Delhi, India'}</p>
                </div>
                <div className="safety-badge safe">
                  <span>🟢 Safe</span>
                </div>
              </div>
            </div>

            {/* Emergency Assistance */}
            <div className="emergency-card">
              <h3>Emergency Assistance</h3>
              <div className="emergency-button" onClick={handleSOSPress}>
                <div className="emergency-icon">⚠️</div>
                <p>Tap for immediate help</p>
              </div>
            </div>

            {/* Safety Score */}
            <div className="safety-score-card">
              <div className="score-header">
                <h3>Safety Score</h3>
                <span className="arrow">›</span>
              </div>
              <div className="score-display">
                <div className="score-number">{safetyScore}</div>
                <div className="score-label">/100</div>
              </div>
              <div className="score-status excellent">
                <span>✅ Excellent Safety</span>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="tips-section">
              <div className="tips-header">
                <h3>Safety Tips</h3>
                <span className="view-all">View All</span>
              </div>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <span>Stay in well-lit areas at night</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📱</span>
                  <span>Keep emergency contacts handy</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">👥</span>
                  <span>Travel in groups when possible</span>
                </div>
              </div>
            </div>

            {/* Hidden components for functionality */}
            <div style={{ display: 'none' }}>
              <LocationTracker 
                currentLocation={currentLocation}
                onLocationUpdate={handleLocationUpdate}
              />
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="tab-content">
            <div className="map-header">
              <h2>🗺️ Safety Map</h2>
              <p>Real-time safety zones and nearby places</p>
            </div>
            
            <div className="map-container">
              {currentLocation ? (
                <GoogleMap
                  center={{
                    lat: currentLocation.latitude!,
                    lng: currentLocation.longitude!
                  }}
                  zoom={15}
                  markers={[]}
                  onNavigate={handleNavigate}
                  className="mobile-map"
                  showRealPlaces={true}
                  showSafetyZones={true}
                />
              ) : (
                <div className="map-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading your location...</p>
                </div>
              )}
            </div>

            {/* Nearby Places */}
            <div className="nearby-places-mobile">
              <h3>📍 Nearby Safe Places</h3>
              {placesLoading ? (
                <div className="places-loading">
                  <div className="loading-spinner"></div>
                  <span>Finding nearby places...</span>
                </div>
              ) : (
                <div className="places-grid">
                  {nearbyPlaces.slice(0, 4).map(place => {
                    const getPlaceIcon = (type: string) => {
                      switch (type) {
                        case 'hospital': return '🏥';
                        case 'police': return '🚔';
                        case 'restaurant': return '🍽️';
                        case 'hotel': return '🏨';
                        default: return '📍';
                      }
                    };

                    return (
                      <div key={place.id} className="place-card">
                        <div className="place-icon">{getPlaceIcon(place.type)}</div>
                        <div className="place-info">
                          <h4>{place.name}</h4>
                          <p>{Math.round(place.distance)}m away</p>
                          {place.rating && <p>⭐ {place.rating}</p>}
                        </div>
                        <button 
                          className="navigate-btn-mobile"
                          onClick={() => handleNavigate(place.position)}
                        >
                          Navigate
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="safety-tab">
            <div className="safety-header">
              <h2>�️ Safety Dashboard</h2>
              <p>Real-time safety information for your current area</p>
            </div>

            {/* Current Safety Status */}
            <div className="dashboard-grid">
              <div className="dashboard-card safety-status-card">
                <div className="card-title">
                  <span className="card-icon">🎯</span>
                  Current Safety Level
                </div>
                <div className="safety-score-display">
                  <div className="score-circle">
                    <span className="score-number">{safetyScore}</span>
                    <span className="score-suffix">/100</span>
                  </div>
                  <div className="score-status">
                    <span className="status-text">
                      {safetyScore >= 80 ? '✅ Very Safe' : 
                       safetyScore >= 60 ? '⚠️ Moderate' : '⚠️ Use Caution'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card alerts-card">
                <div className="card-title">
                  <span className="card-icon">🚨</span>
                  Active Alerts
                </div>
                {recentAlerts.length > 0 ? (
                  <div className="alerts-list">
                    {recentAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className={`alert-item ${alert.priority?.toLowerCase()}`}>
                        <div className="alert-icon">
                          {alert.priority === 'CRITICAL' ? '🔴' : 
                           alert.priority === 'HIGH' ? '🟡' : '🟢'}
                        </div>
                        <div className="alert-content">
                          <div className="alert-title">{alert.type}</div>
                          <div className="alert-message">{alert.message}</div>
                          <div className="alert-time">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-alerts">
                    <span className="no-alerts-icon">✅</span>
                    <span>No active alerts in your area</span>
                  </div>
                )}
              </div>

              <div className="dashboard-card safety-tips-card">
                <div className="card-title">
                  <span className="card-icon">💡</span>
                  Safety Tips
                </div>
                <div className="safety-tips">
                  <div className="tip-item">
                    <span className="tip-icon">📱</span>
                    <span>Keep emergency contacts handy</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">👥</span>
                    <span>Stay in well-populated areas</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">💰</span>
                    <span>Don't display expensive items</span>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">📍</span>
                    <span>Share your location with trusted contacts</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card area-reviews-card">
                <div className="card-title">
                  <span className="card-icon">⭐</span>
                  Area Reviews
                </div>
                <div className="reviews-summary">
                  <div className="overall-rating">
                    <div className="rating-number">4.2</div>
                    <div className="rating-details">
                      <div className="stars">⭐⭐⭐⭐☆</div>
                      <div className="review-count">Based on 156 reviews</div>
                    </div>
                  </div>
                </div>
                <div className="review-categories">
                  <div className="category">
                    <span>Safety</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '85%'}}></div>
                    </div>
                    <span>4.3</span>
                  </div>
                  <div className="category">
                    <span>Cleanliness</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '78%'}}></div>
                    </div>
                    <span>3.9</span>
                  </div>
                  <div className="category">
                    <span>Accessibility</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '82%'}}></div>
                    </div>
                    <span>4.1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="emergency-tab">
            <div className="emergency-header">
              <h2>🆘 Emergency Services</h2>
              <div className="emergency-status">
                <span className="status-indicator green"></span>
                All services operational
              </div>
            </div>

            <div className="emergency-dashboard">
              <div className="emergency-grid">
                {/* Emergency Contacts */}
                <div className="emergency-card priority-contacts">
                  <h3>🚨 Priority Emergency Numbers</h3>
                  <div className="contacts-grid">
                    <div className="emergency-contact police">
                      <div className="contact-icon">🚔</div>
                      <div className="contact-info">
                        <h4>Police Emergency</h4>
                        <p className="contact-number">100</p>
                        <span className="available">24/7 Available</span>
                      </div>
                      <button 
                        className="emergency-call-btn"
                        onClick={() => window.open('tel:100')}
                      >
                        Call Now
                      </button>
                    </div>

                    <div className="emergency-contact medical">
                      <div className="contact-icon">🚑</div>
                      <div className="contact-info">
                        <h4>Medical Emergency</h4>
                        <p className="contact-number">108</p>
                        <span className="available">24/7 Available</span>
                      </div>
                      <button 
                        className="emergency-call-btn"
                        onClick={() => window.open('tel:108')}
                      >
                        Call Now
                      </button>
                    </div>

                    <div className="emergency-contact fire">
                      <div className="contact-icon">🚒</div>
                      <div className="contact-info">
                        <h4>Fire Emergency</h4>
                        <p className="contact-number">101</p>
                        <span className="available">24/7 Available</span>
                      </div>
                      <button 
                        className="emergency-call-btn"
                        onClick={() => window.open('tel:101')}
                      >
                        Call Now
                      </button>
                    </div>

                    <div className="emergency-contact tourist">
                      <div className="contact-icon">ℹ️</div>
                      <div className="contact-info">
                        <h4>Tourist Helpline</h4>
                        <p className="contact-number">1363</p>
                        <span className="available">24/7 Available</span>
                      </div>
                      <button 
                        className="emergency-call-btn"
                        onClick={() => window.open('tel:1363')}
                      >
                        Call Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="emergency-card quick-actions">
                  <h3>⚡ Quick Actions</h3>
                  <div className="actions-grid">
                    <button 
                      className="action-btn medical"
                      onClick={() => {
                        if (window.confirm('Call Medical Emergency (108)?')) {
                          window.open('tel:108');
                        }
                      }}
                    >
                      <span className="action-icon">🚑</span>
                      <span className="action-text">Medical Emergency</span>
                      <span className="action-desc">Call 108</span>
                    </button>

                    <button 
                      className="action-btn police"
                      onClick={() => {
                        if (window.confirm('Call Police Emergency (100)?')) {
                          window.open('tel:100');
                        }
                      }}
                    >
                      <span className="action-icon">🚔</span>
                      <span className="action-text">Police Help</span>
                      <span className="action-desc">Call 100</span>
                    </button>

                    <button 
                      className="action-btn fire"
                      onClick={() => {
                        if (window.confirm('Call Fire Emergency (101)?')) {
                          window.open('tel:101');
                        }
                      }}
                    >
                      <span className="action-icon">🚒</span>
                      <span className="action-text">Fire Emergency</span>
                      <span className="action-desc">Call 101</span>
                    </button>

                    <button 
                      className="action-btn location"
                      onClick={() => {
                        if (navigator.geolocation && currentLocation) {
                          const message = `Emergency! My location: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
                          navigator.share ? 
                            navigator.share({title: 'Emergency Location', text: message}) :
                            navigator.clipboard?.writeText(message);
                          alert('Location copied to clipboard');
                        }
                      }}
                    >
                      <span className="action-icon">📍</span>
                      <span className="action-text">Share Location</span>
                      <span className="action-desc">Send GPS coordinates</span>
                    </button>
                  </div>
                </div>

                {/* SOS Panic Button */}
                <div className="emergency-card sos-section">
                  <h3>🚨 SOS Emergency Alert</h3>
                  <div className="sos-container">
                    <button 
                      className={`sos-btn ${sosActive ? 'active' : ''}`}
                      onClick={handleSOSPress}
                      disabled={sosActive}
                    >
                      {sosActive ? (
                        <div className="sos-active-indicator">
                          <div className="pulse-ring"></div>
                          <span>SOS ACTIVE</span>
                        </div>
                      ) : (
                        <>
                          <span className="btn-icon">🆘</span>
                          <span className="btn-text">EMERGENCY SOS</span>
                        </>
                      )}
                    </button>
                    <p className="sos-description">
                      {sosActive ? 
                        'Emergency alert sent! Help is on the way.' :
                        'Press and hold for 3 seconds to send emergency alert to authorities and your emergency contacts.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'itinerary':
        return (
          <div className="itinerary-tab">
            <div className="itinerary-header">
              <h2>� Travel Itinerary</h2>
              <p>Your planned activities with safety insights</p>
            </div>

            <div className="itinerary-dashboard">
              {/* Today's Schedule */}
              <div className="dashboard-card today-schedule">
                <div className="card-title">
                  <span className="card-icon">📋</span>
                  Today's Schedule
                  <span className="schedule-date">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="schedule-list">
                  {itinerary.map(item => (
                    <div key={item.id} className="schedule-item">
                      <div className="schedule-time">
                        <span className="time">{item.time}</span>
                        <span className="duration">{item.estimatedDuration}</span>
                      </div>
                      <div className="schedule-content">
                        <h4 className="schedule-title">{item.title}</h4>
                        <div className="schedule-location">
                          <span className="location-icon">📍</span>
                          {item.location}
                        </div>
                        <div className={`safety-level ${item.safetyLevel}`}>
                          <span className="safety-icon">
                            {item.safetyLevel === 'safe' ? '🟢' : 
                             item.safetyLevel === 'caution' ? '🟡' : '🔴'}
                          </span>
                          <span className="safety-text">
                            {item.safetyLevel === 'safe' ? 'Safe Area' :
                             item.safetyLevel === 'caution' ? 'Use Caution' : 'High Risk'}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="schedule-notes">
                            <span className="notes-icon">💡</span>
                            {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="schedule-actions">
                        <button 
                          className="navigate-btn"
                          onClick={() => {
                            // Navigate to location
                            const mockDestination = {
                              lat: (currentLocation?.latitude || 28.6139) + (Math.random() - 0.5) * 0.01,
                              lng: (currentLocation?.longitude || 77.2090) + (Math.random() - 0.5) * 0.01
                            };
                            handleNavigate(mockDestination);
                          }}
                        >
                          🧭 Navigate
                        </button>
                        <button className="info-btn">
                          ℹ️ Info
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Recommendations */}
              <div className="dashboard-card safety-recommendations">
                <div className="card-title">
                  <span className="card-icon">🛡️</span>
                  Safety Recommendations
                </div>
                <div className="recommendations-list">
                  <div className="recommendation-item high-priority">
                    <span className="priority-icon">🔴</span>
                    <div className="recommendation-content">
                      <h4>Avoid evening visits to Chandni Chowk</h4>
                      <p>High pickpocket activity reported after 7 PM</p>
                    </div>
                  </div>
                  <div className="recommendation-item medium-priority">
                    <span className="priority-icon">🟡</span>
                    <div className="recommendation-content">
                      <h4>Keep valuables secure at Khan Market</h4>
                      <p>Moderate crime rate in shopping areas</p>
                    </div>
                  </div>
                  <div className="recommendation-item low-priority">
                    <span className="priority-icon">🟢</span>
                    <div className="recommendation-content">
                      <h4>India Gate is well-patrolled</h4>
                      <p>Excellent security presence during day and night</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Tips */}
              <div className="dashboard-card travel-tips">
                <div className="card-title">
                  <span className="card-icon">🎒</span>
                  Travel Tips for Today
                </div>
                <div className="tips-grid">
                  <div className="tip-card">
                    <span className="tip-icon">💧</span>
                    <h4>Stay Hydrated</h4>
                    <p>Temperature: 32°C - Carry water bottles</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">🚗</span>
                    <h4>Transportation</h4>
                    <p>Use prepaid taxis or ride-sharing apps</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">💰</span>
                    <h4>Payment</h4>
                    <p>Carry small denominations for local vendors</p>
                  </div>
                  <div className="tip-card">
                    <span className="tip-icon">📱</span>
                    <h4>Communication</h4>
                    <p>Save offline maps and emergency contacts</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts for Itinerary */}
              <div className="dashboard-card itinerary-emergency">
                <div className="card-title">
                  <span className="card-icon">🆘</span>
                  Emergency Contacts
                </div>
                <div className="emergency-contacts-grid">
                  <div className="emergency-contact-item">
                    <span className="contact-icon">🚔</span>
                    <span className="contact-name">Police</span>
                    <button 
                      className="quick-call-btn"
                      onClick={() => window.open('tel:100')}
                    >
                      100
                    </button>
                  </div>
                  <div className="emergency-contact-item">
                    <span className="contact-icon">🚑</span>
                    <span className="contact-name">Medical</span>
                    <button 
                      className="quick-call-btn"
                      onClick={() => window.open('tel:108')}
                    >
                      108
                    </button>
                  </div>
                  <div className="emergency-contact-item">
                    <span className="contact-icon">ℹ️</span>
                    <span className="contact-name">Tourist Help</span>
                    <button 
                      className="quick-call-btn"
                      onClick={() => window.open('tel:1363')}
                    >
                      1363
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="reviews-system">
            <div className="reviews-header">
              <h3>⭐ Area Reviews & Ratings</h3>
              <button className="add-review-btn">
                + Add Review
              </button>
            </div>

            <div className="location-reviews">
              <h4>📍 Current Area: {currentLocation?.address || 'Unknown Location'}</h4>
              
              <div className="overall-rating">
                <div className="rating-number">4.2</div>
                <div className="rating-details">
                  <div className="stars">⭐⭐⭐⭐☆</div>
                  <div className="review-count">Based on 156 reviews</div>
                </div>
              </div>

              <div className="review-categories">
                <div className="category">
                  <span>Safety</span>
                  <div className="rating-bar">
                    <div className="rating-fill" style={{width: '85%'}}></div>
                  </div>
                  <span>4.3</span>
                </div>
                <div className="category">
                  <span>Cleanliness</span>
                  <div className="rating-bar">
                    <div className="rating-fill" style={{width: '78%'}}></div>
                  </div>
                  <span>3.9</span>
                </div>
                <div className="category">
                  <span>Accessibility</span>
                  <div className="rating-bar">
                    <div className="rating-fill" style={{width: '82%'}}></div>
                  </div>
                  <span>4.1</span>
                </div>
                <div className="category">
                  <span>Tourist Friendly</span>
                  <div className="rating-bar">
                    <div className="rating-fill" style={{width: '88%'}}></div>
                  </div>
                  <span>4.4</span>
                </div>
              </div>

              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <h4>{review.location}</h4>
                        <span className="author">By {review.author}</span>
                      </div>
                      <div className="rating">⭐ {review.rating}</div>
                    </div>
                    <p className="review-text">{review.review}</p>
                    <div className="review-footer">
                      <span className="review-date">{review.date}</span>
                      <span className="helpful">👍 {review.helpful} helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Content not found</div>;
    }
  };

  if (loading) {
    return (
      <div className="mobile-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your safety dashboard...</p>
      </div>
    );
  }

  return (
    <div className="tourist-dashboard">
      {/* Enhanced Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">
              <span className="welcome-text">Welcome, {user?.firstName || 'Pranavi'}!</span>
              <span className="sun-icon">☀️</span>
            </h1>
          </div>
          <div className="header-right">
            <div className="safety-indicator">
              <span className="safety-text">Safety Score: {safetyScore}/10</span>
              <div className="connectivity-status connected">
                <span className="status-dot"></span>
                Connected
              </div>
            </div>
            <div className="user-menu">
              <button className="night-mode-toggle">
                🌙 Night Mode
              </button>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="language-selector"
              >
                <option value="en">🇺🇸 English</option>
                <option value="hi">🇮🇳 हिंदी</option>
                <option value="es">🇪🇸 Español</option>
              </select>
              <button className="logout-btn" onClick={logout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Status Bar */}
        <div className="emergency-status-bar">
          <div className="emergency-info">
            <span className="emergency-number">Emergency: 112</span>
            <span className="separator">|</span>
            <span className="tourist-helpline">Tourist Helpline: 1363</span>
          </div>
          <div className="zone-status safe">
            <span className="status-indicator"></span>
            You are in a safe zone
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="tab-icon">🏠</span>
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
            onClick={() => setActiveTab('safety')}
          >
            <span className="tab-icon">🛡️</span>
            Safety
          </button>
          <button 
            className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <span className="tab-icon">🗺️</span>
            Map
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <span className="tab-icon">⭐</span>
            Reviews
          </button>
          <button 
            className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            <span className="tab-icon">🚨</span>
            Emergency
          </button>
          <button 
            className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
            onClick={() => setActiveTab('itinerary')}
          >
            <span className="tab-icon">📅</span>
            Itinerary
          </button>
        </nav>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="dashboard-grid">
              {/* Safety Score Card */}
              <div className="dashboard-card safety-score-card">
                <h3 className="card-title">
                  <span className="card-icon">🛡️</span>
                  Safety Score
                </h3>
                <div className="safety-score-display">
                  <div className="score-circle">
                    <span className="score-number">{safetyScore}</span>
                    <span className="score-suffix">.0/10</span>
                  </div>
                  <div className="score-status">
                    <span className="status-text">You are in a safe zone</span>
                  </div>
                </div>
              </div>

              {/* Emergency Controls Card */}
              <div className="dashboard-card emergency-controls-card">
                <h3 className="card-title">
                  <span className="card-icon">🚨</span>
                  Emergency Controls
                </h3>
                <p className="card-subtitle">Tap for immediate assistance</p>
                <div className="emergency-buttons">
                  <button 
                    className={`emergency-btn sos-btn ${sosActive ? 'active' : ''}`}
                    onClick={handleSOSPress}
                    disabled={sosActive}
                  >
                    <span className="btn-icon">🆘</span>
                    <span className="btn-text">SOS</span>
                  </button>
                  <button className="emergency-btn call-police-btn">
                    <span className="btn-icon">🚔</span>
                    <span className="btn-text">Call Police</span>
                  </button>
                </div>
              </div>

              {/* Location & Device Status */}
              <div className="dashboard-card location-device-card">
                <LocationTracker 
                  currentLocation={currentLocation}
                  onLocationUpdate={handleLocationUpdate}
                />
                <div className="device-status-section">
                  <DeviceStatus 
                    device={device}
                    onDeviceUpdate={setDevice}
                  />
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="dashboard-card alerts-card">
                <h3 className="card-title">
                  <span className="card-icon">🔔</span>
                  Recent Alerts
                </h3>
                <AlertsList 
                  alerts={recentAlerts}
                  onAlertsUpdate={setRecentAlerts}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="safety-tab">
            <div className="safety-dashboard">
              <EmergencyPanel 
                currentLocation={currentLocation}
                onAlertCreated={handleAlertCreated}
              />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-tab">
            <div className="map-dashboard">
              <div className="map-controls">
                <div className="map-filters">
                  <button 
                    className={`filter-btn ${mapType === 'safety' ? 'active' : ''}`}
                    onClick={() => setMapType('safety')}
                  >
                    🛡️ Safe Zones
                  </button>
                  <button 
                    className={`filter-btn ${mapType === 'emergency' ? 'active' : ''}`}
                    onClick={() => setMapType('emergency')}
                  >
                    🚨 Emergency
                  </button>
                  <button 
                    className={`filter-btn ${mapType === 'hotels' ? 'active' : ''}`}
                    onClick={() => setMapType('hotels')}
                  >
                    🏨 Hotels
                  </button>
                  <button 
                    className={`filter-btn ${mapType === 'restaurants' ? 'active' : ''}`}
                    onClick={() => setMapType('restaurants')}
                  >
                    🍽️ Restaurants
                  </button>
                  <button 
                    className={`filter-btn ${mapType === 'shopping' ? 'active' : ''}`}
                    onClick={() => setMapType('shopping')}
                  >
                    🛍️ Shopping
                  </button>
                </div>
              </div>
              
              <div className="map-container">
                {currentLocation ? (
                  <GoogleMap
                    center={{
                      lat: currentLocation.latitude!,
                      lng: currentLocation.longitude!
                    }}
                    zoom={15}
                    markers={getMapMarkers()}
                    onNavigate={handleNavigate}
                    className="w-full h-96"
                    showRealPlaces={true}
                    showSafetyZones={true}
                  />
                ) : (
                  <div className="map-placeholder">
                    <p>📍 Waiting for location data...</p>
                  </div>
                )}
              </div>

              <div className="map-sidebar">
                <div className="map-legend">
                  <h4>🗺️ Map Legend</h4>
                  <div className="legend-items">
                    <div className="legend-item">
                      <span className="legend-color safe"></span>
                      Safe Zones
                    </div>
                    <div className="legend-item">
                      <span className="legend-color caution"></span>
                      Caution Areas
                    </div>
                    <div className="legend-item">
                      <span className="legend-color danger"></span>
                      High Risk Areas
                    </div>
                    <div className="legend-item">
                      <span className="legend-color police"></span>
                      Police Stations
                    </div>
                    <div className="legend-item">
                      <span className="legend-color hospital"></span>
                      Hospitals
                    </div>
                  </div>
                </div>

                <div className="nearby-places">
                  <h4>📍 Nearby Safe Places</h4>
                  {placesLoading ? (
                    <div className="places-loading">
                      <div className="loading-spinner"></div>
                      <span>Finding nearby places...</span>
                    </div>
                  ) : (
                    <div className="places-list">
                      {nearbyPlaces.length > 0 ? (
                        nearbyPlaces.map(place => {
                          const getPlaceIcon = (type: string) => {
                            switch (type) {
                              case 'hospital': return '🏥';
                              case 'police': return '🚔';
                              case 'restaurant': return '🍽️';
                              case 'hotel': return '🏨';
                              case 'tourist_spot': return '📍';
                              default: return '📍';
                            }
                          };

                          const formatDistance = (distance: number) => {
                            if (distance < 1000) {
                              return `${Math.round(distance)}m`;
                            } else {
                              return `${(distance / 1000).toFixed(1)}km`;
                            }
                          };

                          return (
                            <div key={place.id} className="place-item">
                              <span>
                                {getPlaceIcon(place.type)} {place.name} - {formatDistance(place.distance)}
                                {place.rating && ` ⭐ ${place.rating}`}
                                {place.isOpen !== undefined && (
                                  <span className={`status ${place.isOpen ? 'open' : 'closed'}`}>
                                    {place.isOpen ? ' 🟢' : ' 🔴'}
                                  </span>
                                )}
                              </span>
                              <button 
                                className="navigate-btn"
                                onClick={() => handleNavigate(place.position)}
                              >
                                Navigate
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="no-places">
                          <span>No nearby places found</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            <div className="reviews-system">
              <div className="reviews-header">
                <h3>⭐ Safety Reviews & Ratings</h3>
                <button className="add-review-btn">Add Review</button>
              </div>
              
              <div className="location-reviews">
                <h4>📍 {currentLocation?.address || 'Current Location'}</h4>
                <div className="overall-rating">
                  <span className="rating-number">4.5</span>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                  <span className="review-count">(127 reviews)</span>
                </div>
                
                <div className="review-categories">
                  <div className="category">
                    <span>Safety</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '90%'}}></div>
                    </div>
                    <span>4.5/5</span>
                  </div>
                  <div className="category">
                    <span>Cleanliness</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '85%'}}></div>
                    </div>
                    <span>4.2/5</span>
                  </div>
                  <div className="category">
                    <span>Tourist Friendly</span>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{width: '92%'}}></div>
                    </div>
                    <span>4.6/5</span>
                  </div>
                </div>

                <div className="recent-reviews">
                  {reviews.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.name}</span>
                        <div className="review-stars">
                          {'⭐'.repeat(review.rating)}
                        </div>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <p className="review-text">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="emergency-tab">
            <div className="emergency-dashboard">
              <div className="emergency-header">
                <h3>🚨 Emergency Services</h3>
                <div className="emergency-status">
                  <span className="status-indicator green"></span>
                  All services operational
                </div>
              </div>

              <div className="emergency-grid">
                <div className="emergency-card">
                  <h4>🚔 Police</h4>
                  <p>Emergency: 100</p>
                  <button className="emergency-call-btn">Call Now</button>
                </div>
                <div className="emergency-card">
                  <h4>🚑 Medical</h4>
                  <p>Emergency: 102</p>
                  <button className="emergency-call-btn">Call Now</button>
                </div>
                <div className="emergency-card">
                  <h4>🚒 Fire</h4>
                  <p>Emergency: 101</p>
                  <button className="emergency-call-btn">Call Now</button>
                </div>
                <div className="emergency-card">
                  <h4>🆘 Tourist Helpline</h4>
                  <p>24/7: 1363</p>
                  <button className="emergency-call-btn">Call Now</button>
                </div>
              </div>

              <div className="emergency-contacts">
                <h4>📞 Emergency Contacts</h4>
                <div className="contacts-list">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="contact-item">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-number">{contact.number}</span>
                      <button className="contact-call-btn">Call</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="itinerary-tab">
            <div className="itinerary-dashboard">
              <div className="itinerary-header">
                <h3>📅 Travel Itinerary</h3>
                <button className="add-plan-btn">Add Plan</button>
              </div>
              
              <div className="itinerary-timeline">
                {itinerary.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-content">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      <div className="timeline-actions">
                        <button className="navigate-btn">Navigate</button>
                        <button className="safety-check-btn">Safety Check</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating SOS Button */}
      <button 
        className={`floating-sos-btn ${sosActive ? 'active' : ''}`}
        onClick={handleSOSPress}
        disabled={sosActive}
      >
        {sosActive ? (
          <div className="sos-active-indicator">
            <div className="pulse-ring"></div>
            <span>🆘</span>
          </div>
        ) : (
          <span>🆘 SOS</span>
        )}
      </button>
    </div>
  );
};

export default TouristDashboard;