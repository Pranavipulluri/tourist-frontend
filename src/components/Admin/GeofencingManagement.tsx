import { AlertCircle, Eye, EyeOff, MapPin, Plus, Shield, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

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

declare global {
  interface Window {
    google: any;
  }
}

const GeofencingManagement: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [violations, setViolations] = useState<GeofenceViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  
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
    loadGoogleMaps();
    loadGeofences();
  }, []);

  useEffect(() => {
    if (mapLoaded && geofences.length > 0) {
      renderGeofences();
    }
  }, [mapLoaded, geofences]);

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
      mapTypeId: 'roadmap'
    });

    // Initialize drawing manager
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

    // Handle polygon creation
    window.google.maps.event.addListener(drawingManagerRef.current, 'polygoncomplete', (polygon: any) => {
      const coordinates = polygon.getPath().getArray().map((point: any) => ({
        latitude: point.lat(),
        longitude: point.lng()
      }));

      setNewGeofence(prev => ({
        ...prev,
        coordinates
      }));

      // Stop drawing mode
      drawingManagerRef.current.setDrawingMode(null);
      setDrawingMode(false);

      // Remove the drawing polygon
      polygon.setMap(null);
    });
  };

  const loadGeofences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load from real backend API
      const response = await apiService.get('/admin/geofences');
      const realGeofences = response.data.geofences || [];
      
      // If no geofences exist, create some sample ones
      if (realGeofences.length === 0) {
        console.log('No geofences found, creating sample data...');
        await createSampleGeofences();
        // Reload after creating samples
        const newResponse = await apiService.get('/admin/geofences');
        setGeofences(newResponse.data.geofences || []);
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
        await apiService.post('/admin/geofences', {
          name: geofence.name,
          type: geofence.type,
          coordinates: geofence.coordinates,
          description: geofence.description,
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
      const geofencesData = geofencesToCheck || geofences;
      const response = await apiService.post('/admin/geofences/check-violations', {
        geofences: geofencesData
      });
      setViolations(response.data.violations || []);
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
    if (!confirm('Are you sure you want to delete this geofence?')) return;
    
    try {
      await apiService.delete(`/admin/geofences/${geofenceId}`);
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
      await apiService.patch(`/admin/geofences/${geofenceId}`, { isActive });
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
    if (!newGeofence.name || !newGeofence.coordinates.length) {
      setError('Please provide a name and draw the geofence area');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/admin/geofences', {
        name: newGeofence.name,
        type: newGeofence.type,
        coordinates: newGeofence.coordinates,
        description: newGeofence.description,
        isActive: true
      });
      
      const createdGeofence = response.data.geofence || response.data;
      
      setGeofences(prev => [...prev, createdGeofence]);
      setNewGeofence({
        name: '',
        type: 'safe_zone',
        description: '',
        coordinates: []
      });
      setIsCreateDialogOpen(false);
      setError(null);
      
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

  const renderGeofences = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing polygons
    geofencePolygonsRef.current.forEach(polygon => {
      polygon.setMap(null);
    });
    geofencePolygonsRef.current.clear();

    // Render each geofence
    geofences.forEach(geofence => {
      if (!geofence.isActive) return;

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

    // Fit map to show all geofences
    if (geofences.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      geofences.forEach(geofence => {
        geofence.coordinates.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord.latitude, coord.longitude));
        });
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const toggleDrawingMode = () => {
    if (!drawingManagerRef.current) return;

    if (drawingMode) {
      drawingManagerRef.current.setDrawingMode(null);
      setDrawingMode(false);
    } else {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      setDrawingMode(true);
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Geofencing Management</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => checkViolations()} disabled={loading}>
                {loading ? 'Checking...' : 'Check Violations'}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Geofence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Geofence</DialogTitle>
                  </DialogHeader>
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
                      >
                        {drawingMode ? 'Cancel Drawing' : 'Draw on Map'}
                      </Button>
                      {newGeofence.coordinates.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Area drawn with {newGeofence.coordinates.length} points
                        </p>
                      )}
                    </div>
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
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Safe Zones</p>
                <p className="text-2xl font-bold text-green-600">
                  {geofences.filter(g => g.type === 'safe_zone' && g.isActive).length}
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
                  {geofences.filter(g => g.type === 'restricted_zone' && g.isActive).length}
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
          <div 
            ref={mapRef} 
            className="w-full h-[500px] rounded-lg border"
            style={{ minHeight: '500px' }}
          />
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
      {violations.length > 0 && (
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
            {geofences.map((geofence) => (
              <div key={geofence.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{geofence.name}</h4>
                    <p className="text-sm text-gray-600">{geofence.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <span>{geofence.coordinates.length} boundary points • </span>
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