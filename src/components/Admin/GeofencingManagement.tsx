import { Activity, AlertCircle, Eye, EyeOff, MapPin, Plus, Shield, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

interface GeofenceCoordinate {
  latitude: number;
  longitude: number;
}

interface Geofence {
  id: string;
  name: string;
  type: 'safe_zone' | 'restricted_zone';
  coordinates: GeofenceCoordinate[];
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface GeofenceViolation {
  touristId: string;
  touristName: string;
  geofenceId: string;
  geofenceName: string;
  geofenceType: 'safe_zone' | 'restricted_zone';
  violationType: 'ENTERED_RESTRICTED' | 'LEFT_SAFE_ZONE';
  location: { latitude: number; longitude: number };
  timestamp: string;
}

const GeofencingManagement: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [violations, setViolations] = useState<GeofenceViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const geofencePolygonsRef = useRef<Map<string, any>>(new Map());

  // Form state for creating geofences
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    type: 'safe_zone' as 'safe_zone' | 'restricted_zone',
    description: '',
    coordinates: [] as GeofenceCoordinate[]
  });

  useEffect(() => {
    const initComponent = async () => {
      try {
        console.log('🚀 [GeofencingManagement] Component initializing...');
        
        // Load Google Maps first
        await loadGoogleMaps();
        
        // Small delay to ensure DOM is ready and drawing library loads
        setTimeout(() => {
          console.log('🗺️ [GeofencingManagement] Initializing map after delay...');
          initializeMap();
        }, 2000);
        
        // Load geofences independently
        loadGeofences();
        
      } catch (error) {
        console.error('❌ [GeofencingManagement] Component initialization failed:', error);
        setError('Failed to initialize map. You can still manage geofences without the map view.');
      }
    };

    initComponent();

    // Cleanup function to properly dispose of Google Maps resources
    return () => {
      // Clear any global callbacks
      if ((window as any).initGoogleMaps) {
        (window as any).initGoogleMaps = undefined;
      }

      // Clear drawing manager
      if (drawingManagerRef.current) {
        try {
          drawingManagerRef.current.setMap(null);
          drawingManagerRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up drawing manager:', e);
        }
      }

      // Clear map instance
      if (mapInstanceRef.current) {
        try {
          // Clear all overlays
          if (mapInstanceRef.current.overlayMapTypes) {
            mapInstanceRef.current.overlayMapTypes.clear();
          }
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up map instance:', e);
        }
      }

      // Clear the map container content to prevent DOM conflicts
      if (mapRef.current) {
        try {
          mapRef.current.innerHTML = '';
        } catch (e) {
          console.warn('Error clearing map container:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && geofences.length > 0) {
      renderGeofences();
    }
  }, [mapLoaded, geofences]);

    const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🗺️ [GeofencingManagement] Starting Google Maps loading...');
      
      if (window.google && window.google.maps) {
        console.log('✅ [GeofencingManagement] Google Maps already loaded');
        // Even if maps is loaded, check if drawing library is available
        if (window.google.maps.drawing) {
          console.log('✅ [GeofencingManagement] Drawing library already available');
          resolve();
          return;
        } else {
          console.warn('⚠️ [GeofencingManagement] Google Maps loaded but drawing library missing - reloading with libraries');
          // Force reload with libraries
        }
      }

      // Check if API key exists
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ [GeofencingManagement] Google Maps API key not found');
        setError('Google Maps API key not configured. Please check environment variables.');
        reject(new Error('Google Maps API key not found'));
        return;
      }

      // Remove any existing scripts to force fresh load
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      // Clear any existing global objects
      if ((window as any).google) {
        delete (window as any).google;
      }

      // Set loading timeout to 45 seconds
      const timeout = setTimeout(() => {
        console.error('❌ [GeofencingManagement] Google Maps loading timeout after 45 seconds');
        setError('Google Maps loading timeout. Please check your internet connection and API key.');
        reject(new Error('Google Maps loading timeout'));
      }, 45000);

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry&callback=initGoogleMapsCallback_${Date.now()}`;
      script.async = true;
      script.defer = true;

      // Global callback function with unique name
      const callbackName = `initGoogleMapsCallback_${Date.now()}`;
      (window as any)[callbackName] = () => {
        clearTimeout(timeout);
        console.log('✅ [GeofencingManagement] Google Maps core loaded successfully');
        
        // Wait for drawing library to be fully available
        const checkDrawingLibrary = (retries = 0) => {
          const maxRetries = 10;
          if (window.google && window.google.maps && window.google.maps.drawing) {
            console.log('✅ [GeofencingManagement] Drawing library confirmed loaded');
            delete (window as any)[callbackName];
            resolve();
          } else if (retries < maxRetries) {
            console.log(`🔄 [GeofencingManagement] Drawing library not ready, retry ${retries + 1}/${maxRetries}`);
            setTimeout(() => checkDrawingLibrary(retries + 1), 1000);
          } else {
            console.error('❌ [GeofencingManagement] Drawing library failed to load after retries');
            delete (window as any)[callbackName];
            setError('Drawing library failed to load. Map will work but polygon drawing will be unavailable.');
            resolve(); // Resolve anyway so map can load
          }
        };
        
        // Start checking for drawing library
        checkDrawingLibrary();
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ [GeofencingManagement] Google Maps script loading failed:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
        reject(new Error('Google Maps script loading failed'));
      };

      console.log('📡 [GeofencingManagement] Adding Google Maps script to head with drawing library');
      document.head.appendChild(script);
    });
  };

  const initializeMap = () => {
    console.log('🗺️ [GeofencingManagement] Initializing map...');
    
    if (!mapRef.current) {
      console.error('❌ [GeofencingManagement] Map container ref not available');
      setError('Map container not ready');
      return;
    }

    // Check Google Maps core API first
    if (!window.google || !window.google.maps) {
      console.error('❌ [GeofencingManagement] Google Maps core API not available');
      setError('Google Maps core API not loaded yet. Please wait...');
      
      // Retry after a delay
      setTimeout(() => {
        if (window.google && window.google.maps) {
          console.log('🔄 [GeofencingManagement] Retrying map initialization...');
          initializeMap();
        }
      }, 2000);
      return;
    }

    // Check drawing library separately
    const hasDrawingLibrary = !!(window.google.maps.drawing);
    console.log('📚 [GeofencingManagement] Drawing library available:', hasDrawingLibrary);

    try {
      // Clear any existing content in the map container
      mapRef.current.innerHTML = '';
      
      // Create new map instance with safety checks
      if (mapInstanceRef.current) {
        // Clean up existing map instance
        try {
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn('⚠️ [GeofencingManagement] Error clearing existing map:', e);
        }
      }

      console.log('🗺️ [GeofencingManagement] Creating map instance...');
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
        mapTypeId: 'roadmap',
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: true,
        // Add these options to ensure proper tile loading
        gestureHandling: 'auto',
        keyboardShortcuts: true,
        disableDefaultUI: false,
        backgroundColor: '#ffffff',
        // Force map to load properly
        mapId: undefined,
        restriction: {
          latLngBounds: {
            north: 85,
            south: -85,
            west: -180,
            east: 180
          }
        }
      });

      console.log('✅ [GeofencingManagement] Map instance created successfully');

      // Add map event listeners to ensure proper loading
      window.google.maps.event.addListener(mapInstanceRef.current, 'tilesloaded', () => {
        console.log('✅ [GeofencingManagement] Map tiles loaded successfully');
      });

      window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        console.log('✅ [GeofencingManagement] Map is idle and ready');
        
        // Try to setup drawing manager once map is fully ready
        if (hasDrawingLibrary) {
          setTimeout(() => setupDrawingManager(), 500);
        }
      });

      // Map is now ready
      setMapLoaded(true);
      
      console.log('✅ [GeofencingManagement] Map initialization completed successfully');
      
      // Load and render existing geofences
      renderGeofences();
      
    } catch (error) {
      console.error('❌ [GeofencingManagement] Map initialization error:', error);
      setError('Failed to initialize Google Maps. You can still manage geofences without the map view.');
    }
  };

  // Separate function to setup drawing manager
  const setupDrawingManager = () => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps || !window.google.maps.drawing) {
      console.warn('⚠️ [GeofencingManagement] Cannot setup drawing manager - requirements not met');
      return;
    }

    try {
      // Initialize drawing manager with safety checks
      if (drawingManagerRef.current) {
        try {
          drawingManagerRef.current.setMap(null);
          drawingManagerRef.current = null;
        } catch (e) {
          console.warn('⚠️ [GeofencingManagement] Error clearing existing drawing manager:', e);
        }
      }

      console.log('🖊️ [GeofencingManagement] Creating drawing manager...');
      drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: '#1976d2',
          fillOpacity: 0.3,
          strokeColor: '#1976d2',
          strokeWeight: 2,
          clickable: true,
          editable: true
        }
      });

      drawingManagerRef.current.setMap(mapInstanceRef.current);
      console.log('✅ [GeofencingManagement] Drawing manager created successfully');

      // Handle polygon creation
      window.google.maps.event.addListener(drawingManagerRef.current, 'polygoncomplete', (polygon: any) => {
        console.log('🎯 [GeofencingManagement] Polygon completed');
        const coordinates = polygon.getPath().getArray().map((point: any) => ({
          latitude: point.lat(),
          longitude: point.lng()
        }));

        console.log('📍 [GeofencingManagement] Coordinates extracted:', coordinates);
        setNewGeofence(prev => ({
          ...prev,
          coordinates
        }));

        // Remove the polygon from map after getting coordinates
        polygon.setMap(null);
      });
    } catch (error) {
      console.error('❌ [GeofencingManagement] Error setting up drawing manager:', error);
    }
  };

  const loadGeofences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load from real backend API
      const response = await apiService.getGeofences();
      const realGeofences = Array.isArray(response) ? response : [];
      
      // If no geofences exist, create some sample ones
      if (realGeofences.length === 0) {
        console.log('No geofences found, creating sample data...');
        await createSampleGeofences();
        // Reload after creating samples
        const newResponse = await apiService.getGeofences();
        setGeofences(Array.isArray(newResponse) ? newResponse : []);
      } else {
        setGeofences(realGeofences);
      }
      
      await checkViolations(realGeofences.length > 0 ? realGeofences : geofences);
    } catch (err) {
      console.error('Error loading geofences:', err);
      // Fallback to sample data if API fails
      const sampleGeofences = createSampleGeofencesData();
      setGeofences(sampleGeofences);
      setError('Using sample data - check backend connection');
    } finally {
      setLoading(false);
    }
  };

  const createSampleGeofencesData = (): Geofence[] => {
    return [
      {
        id: 'geofence_1',
        name: 'Red Fort Safe Zone',
        type: 'safe_zone',
        coordinates: [
          { latitude: 28.6562, longitude: 77.2410 },
          { latitude: 28.6580, longitude: 77.2420 },
          { latitude: 28.6575, longitude: 77.2435 },
          { latitude: 28.6555, longitude: 77.2425 }
        ],
        description: 'Tourist safe zone around Red Fort',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'geofence_2',
        name: 'Construction Restricted Area',
        type: 'restricted_zone',
        coordinates: [
          { latitude: 28.6200, longitude: 77.2100 },
          { latitude: 28.6220, longitude: 77.2110 },
          { latitude: 28.6210, longitude: 77.2130 },
          { latitude: 28.6190, longitude: 77.2120 }
        ],
        description: 'Restricted construction zone - dangerous for tourists',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
  };

  const createSampleGeofences = async () => {
    const sampleGeofences = createSampleGeofencesData();
    
    try {
      for (const geofence of sampleGeofences) {
        // Calculate center point from coordinates with safety checks
        if (!Array.isArray(geofence.coordinates) || geofence.coordinates.length === 0) {
          console.warn('Skipping geofence with invalid coordinates:', geofence.name);
          continue;
        }
        
        const centerLat = geofence.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / geofence.coordinates.length;
        const centerLng = geofence.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / geofence.coordinates.length;
        
        await apiService.createGeofence({
          name: geofence.name,
          type: geofence.type.toUpperCase(),
          coordinates: geofence.coordinates,
          description: geofence.description,
          centerLatitude: centerLat,
          centerLongitude: centerLng,
          radius: 500, // Default radius
          alertMessage: `Alert: You are ${geofence.type === 'safe_zone' ? 'leaving a safe zone' : 'entering a restricted zone'}: ${geofence.name}`,
          isActive: geofence.isActive
        });
      }
      console.log('Sample geofences created successfully');
    } catch (err) {
      console.error('Error creating sample geofences:', err);
    }
  };

  const checkViolations = async (geofencesToCheck?: Geofence[]) => {
    setLoading(true);
    try {
      // Get sample tourist locations and check violations
      const sampleTourists = [
        { touristId: 'tourist_123', latitude: 28.6205, longitude: 77.2115 },
        { touristId: 'tourist_456', latitude: 28.6570, longitude: 77.2420 },
        { touristId: 'tourist_789', latitude: 28.6100, longitude: 77.2200 }
      ];

      const response = await apiService.bulkCheckGeofenceViolations(sampleTourists);
      
      // Process the response to create violation objects
      const violationResults = Array.isArray(response.violations) ? response.violations : [];
      const processedViolations: GeofenceViolation[] = violationResults.map((violation: any) => ({
        touristId: violation.touristId,
        touristName: `Tourist ${violation.touristId.slice(-3)}`,
        geofenceId: violation.geofenceId,
        geofenceName: violation.geofenceName,
        geofenceType: violation.geofenceType,
        violationType: violation.violationType,
        location: violation.location,
        timestamp: violation.timestamp || new Date().toISOString()
      }));

      setViolations(processedViolations);
    } catch (err) {
      console.error('Error checking violations:', err);
      // Show sample violations if API fails
      const sampleViolations: GeofenceViolation[] = [
        {
          touristId: 'tourist_123',
          touristName: 'John Doe',
          geofenceId: 'geofence_2',
          geofenceName: 'Construction Restricted Area',
          geofenceType: 'restricted_zone',
          violationType: 'ENTERED_RESTRICTED',
          location: { latitude: 28.6205, longitude: 77.2115 },
          timestamp: new Date().toISOString()
        }
      ];
      setViolations(sampleViolations);
      setError('Using sample violation data - check backend connection');
    } finally {
      setLoading(false);
    }
  };

  const deleteGeofence = async (geofenceId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete this geofence?')) return;
    
    try {
      await apiService.deleteGeofence(geofenceId);
      setGeofences(prev => prev.filter(g => g.id !== geofenceId));
      
      // Remove from map
      const polygon = geofencePolygonsRef.current.get(geofenceId);
      if (polygon) {
        polygon.setMap(null);
        geofencePolygonsRef.current.delete(geofenceId);
      }
      
      console.log('✅ Geofence deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete geofence';
      setError(errorMessage);
      console.error('❌ Error deleting geofence:', err);
    }
  };

  const toggleGeofenceStatus = async (geofenceId: string, isActive: boolean) => {
    try {
      await apiService.updateGeofence(geofenceId, { isActive });
      setGeofences(prev => prev.map(g => 
        g.id === geofenceId ? { ...g, isActive } : g
      ));
      
      // Re-render map to show/hide geofence
      renderGeofences();
      
      console.log(`✅ Geofence ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update geofence status';
      setError(errorMessage);
      console.error('❌ Error updating geofence status:', err);
    }
  };

  const createGeofence = async () => {
    if (!newGeofence.name || !Array.isArray(newGeofence.coordinates) || newGeofence.coordinates.length === 0) {
      setError('Please provide a name and draw the geofence area');
      return;
    }

    setLoading(true);
    try {
      // Calculate center point from coordinates with safety checks
      const centerLat = newGeofence.coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / newGeofence.coordinates.length;
      const centerLng = newGeofence.coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / newGeofence.coordinates.length;
      
      // Calculate approximate radius (distance from center to farthest point)
      const maxDistance = Math.max(...newGeofence.coordinates.map(coord => {
        const R = 6371e3; // metres
        const φ1 = centerLat * Math.PI/180;
        const φ2 = coord.latitude * Math.PI/180;
        const Δφ = (coord.latitude - centerLat) * Math.PI/180;
        const Δλ = (coord.longitude - centerLng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
      }));

      const response = await apiService.createGeofence({
        name: newGeofence.name,
        type: newGeofence.type.toUpperCase(),
        coordinates: newGeofence.coordinates,
        description: newGeofence.description,
        centerLatitude: centerLat,
        centerLongitude: centerLng,
        radius: Math.round(maxDistance),
        alertMessage: `Alert: You are ${newGeofence.type === 'safe_zone' ? 'leaving a safe zone' : 'entering a restricted zone'}: ${newGeofence.name}`
      });
      
      const createdGeofence = {
        id: response.id || `geofence_${Date.now()}`,
        name: newGeofence.name,
        type: newGeofence.type,
        coordinates: newGeofence.coordinates,
        description: newGeofence.description,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      setGeofences(prev => [...prev, createdGeofence]);
      setNewGeofence({
        name: '',
        type: 'safe_zone',
        description: '',
        coordinates: []
      });
      setIsCreateDialogOpen(false);
      setError(null);
      
      // Emit real-time update if enabled
      if (realTimeUpdates && websocketService.isConnected()) {
        websocketService.emit('message', {
          type: 'zone-created',
          data: createdGeofence,
          timestamp: new Date().toISOString()
        });
      }
      
      // Refresh violations after creating new geofence
      await checkViolations();
      
      console.log('✅ Geofence created successfully:', createdGeofence);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create geofence';
      setError(errorMessage);
      console.error('❌ Error creating geofence:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(prev => {
      const newState = !prev;
      console.log('🔄 [GeofencingManagement] Real-time updates:', newState ? 'ENABLED' : 'DISABLED');
      
      if (newState) {
        // Subscribe to existing supported events and adapt them for zone management
        websocketService.on('dashboard-stats', (data: any) => {
          console.log('📡 [GeofencingManagement] Dashboard stats update:', data);
          // If dashboard stats include zone information, refresh zones
          if (data.zones || data.geofences) {
            loadGeofences();
          }
        });
        
        websocketService.on('new_alert', (alert: any) => {
          console.log('📡 [GeofencingManagement] New alert received:', alert);
          // Check if alert is geofence-related
          if (alert.type?.includes('GEOFENCE') || alert.geofenceId) {
            const newViolation: GeofenceViolation = {
              touristId: alert.touristId || alert.tourist_id || 'unknown',
              touristName: alert.touristName || alert.tourist?.name || 'Unknown Tourist',
              geofenceId: alert.geofenceId || alert.zone_id || 'unknown',
              geofenceName: alert.geofenceName || alert.zone_name || 'Unknown Zone',
              geofenceType: alert.geofenceType || 'safe_zone',
              violationType: alert.subType || 'LEFT_SAFE_ZONE',
              location: alert.location || { latitude: alert.latitude || 0, longitude: alert.longitude || 0 },
              timestamp: alert.createdAt || alert.timestamp || new Date().toISOString()
            };
            setViolations(prev => [newViolation, ...prev.slice(0, 49)]); // Keep last 50
          }
        });
        
        websocketService.on('tourist_location_updated', (data: any) => {
          console.log('📡 [GeofencingManagement] Tourist location update:', data);
          // Check for real-time geofence violations
          if (data.violations && Array.isArray(data.violations)) {
            data.violations.forEach((violation: any) => {
              const newViolation: GeofenceViolation = {
                touristId: violation.touristId || data.touristId || 'unknown',
                touristName: violation.touristName || data.touristName || 'Unknown Tourist',
                geofenceId: violation.geofenceId || violation.zone_id || 'unknown',
                geofenceName: violation.geofenceName || violation.zone_name || 'Unknown Zone',
                geofenceType: violation.geofenceType || 'safe_zone',
                violationType: violation.type || 'LEFT_SAFE_ZONE',
                location: violation.location || data.location || { latitude: 0, longitude: 0 },
                timestamp: violation.timestamp || new Date().toISOString()
              };
              setViolations(prev => [newViolation, ...prev.slice(0, 49)]);
            });
          }
        });
        
        // Initialize WebSocket connection if not connected
        if (!websocketService.isConnected()) {
          // Try to trigger connection by subscribing to a basic event
          websocketService.on('connected', () => {
            console.log('✅ [GeofencingManagement] WebSocket connected for real-time updates');
          });
        }
      } else {
        // Clean up event handlers (note: WebSocket service may not support individual off)
        console.log('🔄 [GeofencingManagement] Disabling real-time updates');
        // The WebSocket service will continue running, but we won't process zone-specific events
      }
      
      return newState;
    });
  };

  const renderGeofences = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing polygons with safety checks
    if (geofencePolygonsRef.current && geofencePolygonsRef.current.forEach) {
      geofencePolygonsRef.current.forEach((polygon) => {
        if (polygon && polygon.setMap) {
          polygon.setMap(null);
        }
      });
      geofencePolygonsRef.current.clear();
    }

    // Render each geofence with safety checks
    if (Array.isArray(geofences)) {
      geofences.forEach(geofence => {
        if (!geofence.isActive || !Array.isArray(geofence.coordinates) || geofence.coordinates.length === 0) return;

        const paths = geofence.coordinates.map(coord => ({
          lat: coord.latitude,
          lng: coord.longitude
        }));

        const polygon = new window.google.maps.Polygon({
          paths,
          strokeColor: geofence.type === 'safe_zone' ? '#22c55e' : '#ef4444',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: geofence.type === 'safe_zone' ? '#22c55e' : '#ef4444',
          fillOpacity: 0.2,
          clickable: true
        });

        polygon.setMap(mapInstanceRef.current);
        geofencePolygonsRef.current.set(geofence.id, polygon);

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h4 style="margin: 0 0 10px 0; color: ${geofence.type === 'safe_zone' ? '#059669' : '#dc2626'};">
                ${geofence.type === 'safe_zone' ? '🛡️' : '⚠️'} ${geofence.name}
              </h4>
              <p><strong>Type:</strong> ${geofence.type.replace('_', ' ')}</p>
              <p><strong>Description:</strong> ${geofence.description || 'No description'}</p>
              <p><strong>Status:</strong> ${geofence.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          `
        });

        polygon.addListener('click', (event: any) => {
          infoWindow.setPosition(event.latLng);
          infoWindow.open(mapInstanceRef.current);
        });
      });
    }

    // Fit map to show all geofences with safety checks
    if (Array.isArray(geofences) && geofences.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      geofences.forEach(geofence => {
        if (Array.isArray(geofence.coordinates)) {
          geofence.coordinates.forEach(coord => {
            if (coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
              bounds.extend(new window.google.maps.LatLng(coord.latitude, coord.longitude));
            }
          });
        }
      });
      if (mapInstanceRef.current && mapInstanceRef.current.fitBounds) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  };

  const toggleDrawingMode = () => {
    console.log('🖊️ [GeofencingManagement] Toggle drawing mode requested');
    console.log('- drawingManagerRef.current:', !!drawingManagerRef.current);
    console.log('- window.google.maps.drawing:', !!(window.google && window.google.maps && window.google.maps.drawing));
    
    // First check if Google Maps is available at all
    if (!window.google || !window.google.maps) {
      setError('Google Maps not loaded. Please refresh the page and try again.');
      return;
    }

    // Check if drawing library is available
    if (!window.google.maps.drawing) {
      console.warn('⚠️ [GeofencingManagement] Drawing library not available - attempting to reload maps with libraries');
      setError('Drawing library not available. Reloading Google Maps with drawing tools...');
      
      // Force reload Google Maps with libraries
      loadGoogleMaps().then(() => {
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.drawing) {
            console.log('✅ [GeofencingManagement] Drawing library loaded after reload');
            setupDrawingManager();
            setError(null);
            // Try drawing mode again
            if (drawingManagerRef.current) {
              drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
              setDrawingMode(true);
            }
          } else {
            setError('Drawing tools unavailable after reload. Please use coordinate input method to create geofences.');
          }
        }, 2000);
      }).catch(err => {
        console.error('❌ [GeofencingManagement] Failed to reload Google Maps:', err);
        setError('Failed to reload drawing tools. Please use coordinate input method to create geofences.');
      });
      return;
    }

    // If drawing manager doesn't exist, try to create it
    if (!drawingManagerRef.current) {
      console.warn('⚠️ [GeofencingManagement] Drawing manager not available - trying to create it now');
      
      if (mapInstanceRef.current) {
        console.log('🔧 [GeofencingManagement] Attempting to create drawing manager on demand');
        setupDrawingManager();
        
        // Try again after setup
        setTimeout(() => {
          if (drawingManagerRef.current) {
            console.log('✅ [GeofencingManagement] Drawing manager created successfully - enabling drawing mode');
            drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
            setDrawingMode(true);
          } else {
            setError('Failed to initialize drawing tools. Please use coordinate input method to create geofences.');
          }
        }, 100);
        return;
      } else {
        setError('Map not ready. Please wait for map to load before using drawing tools.');
        return;
      }
    }

    // Toggle drawing mode
    try {
      if (drawingMode) {
        drawingManagerRef.current.setDrawingMode(null);
        setDrawingMode(false);
        console.log('🖊️ [GeofencingManagement] Drawing mode disabled');
      } else {
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        setDrawingMode(true);
        console.log('🖊️ [GeofencingManagement] Drawing mode enabled');
      }
    } catch (error) {
      console.error('❌ [GeofencingManagement] Error toggling drawing mode:', error);
      setError('Error with drawing tools. Please refresh the page and try again.');
    }
  };

  const getViolationColor = (violationType: string) => {
    switch (violationType) {
      case 'ENTERED_RESTRICTED': return 'bg-red-100 text-red-800';
      case 'LEFT_SAFE_ZONE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGeofenceTypeColor = (type: string) => {
    return type === 'safe_zone' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            {error.includes('Google Maps') && (
              <div className="mt-2 text-sm text-red-600">
                <p>Google Maps failed to load. You can still:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>View existing geofences</li>
                  <li>Check violations</li>
                  <li>Create geofences using coordinate input</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Geofencing Management</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={toggleRealTimeUpdates} 
                variant={realTimeUpdates ? "default" : "outline"}
                className={realTimeUpdates ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Activity className={`h-4 w-4 mr-2 ${realTimeUpdates ? 'animate-pulse' : ''}`} />
                {realTimeUpdates ? 'Real-time ON' : 'Real-time OFF'}
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('🔍 [Debug] Google Maps status:');
                  console.log('- window.google:', !!window.google);
                  console.log('- window.google.maps:', !!(window.google && window.google.maps));
                  console.log('- drawing library:', !!(window.google && window.google.maps && window.google.maps.drawing));
                  console.log('- geometry library:', !!(window.google && window.google.maps && window.google.maps.geometry));
                  console.log('- API key:', GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
                  console.log('- mapRef.current:', !!mapRef.current);
                  console.log('- mapInstanceRef.current:', !!mapInstanceRef.current);
                  console.log('- drawingManagerRef.current:', !!drawingManagerRef.current);
                  console.log('- mapLoaded:', mapLoaded);
                  console.log('- drawingMode:', drawingMode);
                  
                  // Check if any scripts are loading
                  const googleScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
                  console.log('- Google Maps scripts:', googleScripts.length);
                  googleScripts.forEach((script, index) => {
                    console.log(`  Script ${index + 1}:`, (script as HTMLScriptElement).src);
                  });

                  // Check if drawing library is in the loaded libraries
                  if (window.google && window.google.maps) {
                    try {
                      console.log('- Available map types:', Object.keys(window.google.maps.MapTypeId || {}));
                      console.log('- Drawing overlay types:', window.google.maps.drawing ? Object.keys(window.google.maps.drawing.OverlayType || {}) : 'Drawing library not available');
                    } catch (e) {
                      console.log('- Error checking map libraries:', e);
                    }
                  }
                  
                  // Show alert with comprehensive status
                  const status = [
                    `Google Maps Core: ${window.google && window.google.maps ? '✅ Loaded' : '❌ Not Loaded'}`,
                    `Drawing Library: ${window.google && window.google.maps && window.google.maps.drawing ? '✅ Available' : '❌ Missing'}`,
                    `Map Container: ${mapRef.current ? '✅ Ready' : '❌ Not Ready'}`,
                    `Map Instance: ${mapInstanceRef.current ? '✅ Created' : '❌ Not Created'}`,
                    `Drawing Manager: ${drawingManagerRef.current ? '✅ Available' : '❌ Not Available'}`,
                    `API Key: ${GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}`
                  ].join('\n');
                  
                  alert(`Debug Status:\n\n${status}\n\nSee console for detailed logs.`);
                  
                  // Auto-fix common issues
                  if (window.google && window.google.maps && !window.google.maps.drawing) {
                    console.log('🔧 [Debug] Drawing library missing - attempting force reload...');
                    setError('Drawing library missing - force reloading Google Maps...');
                    
                    // Remove existing scripts and force reload
                    document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach(script => script.remove());
                    delete (window as any).google;
                    
                    loadGoogleMaps().then(() => {
                      setTimeout(() => {
                        initializeMap();
                        setError(null);
                      }, 1000);
                    }).catch(err => {
                      setError('Failed to reload Google Maps. Please refresh the page.');
                    });
                  } else if (window.google && window.google.maps && window.google.maps.drawing && mapInstanceRef.current && !drawingManagerRef.current) {
                    console.log('🔧 [Debug] Attempting manual drawing manager setup...');
                    setupDrawingManager();
                  } else if (!window.google) {
                    console.log('🔧 [Debug] Google Maps not available - attempting initial load...');
                    loadGoogleMaps().then(() => {
                      setTimeout(initializeMap, 1000);
                    });
                  } else if (mapLoaded && mapInstanceRef.current && mapRef.current) {
                    console.log('✅ [Debug] Map appears to be working correctly');
                  }
                }}
                variant="outline"
                className="text-xs"
              >
                🔍 Debug Map
              </Button>
              
              <Button onClick={() => checkViolations()} disabled={loading}>
                {loading ? 'Checking...' : 'Check Violations'}
              </Button>
              
              {/* Simple Create Geofence Button and Form */}
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Geofence
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Create Geofence Form */}
      {isCreateDialogOpen && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Geofence</CardTitle>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                ✕ Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newGeofence.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter geofence name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newGeofence.type} 
                  onValueChange={(value: string) => 
                    setNewGeofence(prev => ({ ...prev, type: value as 'safe_zone' | 'restricted_zone' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe_zone">Safe Zone</SelectItem>
                    <SelectItem value="restricted_zone">Restricted Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGeofence.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGeofence(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Draw Area</Label>
                <Button
                  type="button"
                  variant={drawingMode ? "destructive" : "outline"}
                  onClick={toggleDrawingMode}
                  className="w-full"
                  disabled={!mapLoaded}
                >
                  {drawingMode ? 'Cancel Drawing' : 'Draw on Map'}
                </Button>
                {!mapLoaded && (
                  <p className="text-sm text-gray-500 mt-1">
                    Map drawing unavailable - use coordinate input below
                  </p>
                )}
                {newGeofence.coordinates.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Area defined with {newGeofence.coordinates.length} points
                  </p>
                )}
              </div>
              
              {/* Manual coordinate input when map is not available */}
              {!mapLoaded && (
                <div>
                  <Label>Manual Coordinates (as fallback)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Enter coordinates in format: lat,lng separated by semicolons
                  </p>
                  <Textarea
                    placeholder="28.6139,77.2090; 28.6149,77.2100; 28.6159,77.2090; 28.6149,77.2080"
                    onChange={(e) => {
                      const coordText = e.target.value;
                      try {
                        const coords = coordText.split(';').map(pair => {
                          const [lat, lng] = pair.trim().split(',').map(Number);
                          return { latitude: lat, longitude: lng };
                        }).filter(coord => !isNaN(coord.latitude) && !isNaN(coord.longitude));
                        
                        setNewGeofence(prev => ({
                          ...prev,
                          coordinates: coords
                        }));
                      } catch (err) {
                        // Invalid format, ignore
                      }
                    }}
                  />
                </div>
              )}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <div className="flex space-x-2">
                <Button onClick={createGeofence} className="flex-1">
                  Create Geofence
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Safe Zones</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(geofences) ? geofences.filter(g => g.type === 'safe_zone' && g.isActive).length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Restricted Zones</p>
                <p className="text-2xl font-bold text-red-600">
                  {Array.isArray(geofences) ? geofences.filter(g => g.type === 'restricted_zone' && g.isActive).length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Violations</p>
                <p className="text-2xl font-bold text-orange-600">{violations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Geofences</p>
                <p className="text-2xl font-bold text-blue-600">{geofences.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Geofences Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px] rounded-lg border flex items-center justify-center relative overflow-hidden" style={{ minHeight: '500px' }}>
            {!mapLoaded && !error && (
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Loading Google Maps...</p>
              </div>
            )}
            {error && error.includes('Google Maps') && (
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Map unavailable</p>
                <p className="text-sm">Geofences can still be managed below</p>
              </div>
            )}
            <div 
              ref={mapRef} 
              className={`absolute inset-0 w-full h-full ${mapLoaded ? 'visible' : 'invisible'}`}
              style={{ 
                minHeight: '500px',
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
                // Prevent React from managing this DOM subtree
                pointerEvents: mapLoaded ? 'auto' : 'none'
              }}
            />
          </div>
          {drawingMode && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                🖱️ Click on the map to draw the geofence boundary. Complete the shape by clicking on the starting point.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations List */}
      {Array.isArray(violations) && violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.map((violation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{violation.touristName}</h4>
                      <p className="text-sm text-gray-600">Tourist ID: {violation.touristId}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getViolationColor(violation.violationType)}>
                        {violation.violationType.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">
                      <strong>Geofence:</strong> {violation.geofenceName}
                    </p>
                    <p className="text-sm">
                      <strong>Location:</strong> {violation.location.latitude.toFixed(6)}, {violation.location.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geofences List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Geofences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(geofences) && geofences.map((geofence) => (
              <div key={geofence.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{geofence.name}</h4>
                    <p className="text-sm text-gray-600">{geofence.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <span>{Array.isArray(geofence.coordinates) ? geofence.coordinates.length : 0} boundary points • </span>
                      <span>Created {new Date(geofence.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getGeofenceTypeColor(geofence.type)}>
                      {geofence.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant={geofence.isActive ? "default" : "secondary"}>
                      {geofence.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGeofenceStatus(geofence.id, !geofence.isActive)}
                    >
                      {geofence.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGeofence(geofence.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {geofences.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No geofences configured yet.</p>
                <p className="text-sm">Create your first geofence to start monitoring zones.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeofencingManagement;