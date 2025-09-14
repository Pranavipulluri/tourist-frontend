import React, { useEffect, useState } from 'react';

interface APITestResult {
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}

export const MapAPITest: React.FC = () => {
  const [testResult, setTestResult] = useState<APITestResult>({
    status: 'loading',
    message: 'Testing Google Maps API...'
  });

  useEffect(() => {
    testGoogleMapsAPI();
  }, []);

  const testGoogleMapsAPI = async () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setTestResult({
        status: 'error',
        message: 'No API key found in environment variables'
      });
      return;
    }

    try {
      // Test 1: Check if API key format is valid
      if (apiKey.length !== 39 || !apiKey.startsWith('AIza')) {
        setTestResult({
          status: 'error',
          message: 'Invalid API key format',
          details: `Key length: ${apiKey.length}, Should be 39 characters starting with 'AIza'`
        });
        return;
      }

      // Test 2: Try to load Google Maps JavaScript API
      const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&callback=testCallback`;
      
      // Create a global callback for testing
      (window as any).testCallback = () => {
        if (window.google && window.google.maps) {
          setTestResult({
            status: 'success',
            message: 'Google Maps API loaded successfully!',
            details: {
              maps: !!window.google.maps,
              places: !!window.google.maps.places,
              geometry: !!window.google.maps.geometry,
              marker: !!window.google.maps.marker
            }
          });
        } else {
          setTestResult({
            status: 'error',
            message: 'Google Maps API loaded but objects not available'
          });
        }
      };

      // Load the script
      const script = document.createElement('script');
      script.src = testUrl;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        setTestResult({
          status: 'error',
          message: 'Failed to load Google Maps API script',
          details: 'Possible issues: Invalid API key, APIs not enabled, billing not set up, or domain restrictions'
        });
      };

      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (testResult.status === 'loading') {
          setTestResult({
            status: 'error',
            message: 'API loading timeout',
            details: 'Google Maps API took too long to load'
          });
        }
      }, 10000);

    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Error testing API',
        details: error
      });
    }
  };

  const getStatusColor = () => {
    switch (testResult.status) {
      case 'loading': return '#3B82F6';
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid',
      borderColor: getStatusColor(),
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h3 style={{ color: getStatusColor() }}>
        {getStatusIcon()} Google Maps API Test
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {testResult.status}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Message:</strong> {testResult.message}
      </div>

      {testResult.details && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          <strong>Details:</strong>
          <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
        <strong>API Key:</strong> {process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.substring(0, 10)}...
      </div>

      {testResult.status === 'error' && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: '#FEE2E2', 
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          <strong>💡 Troubleshooting Steps:</strong>
          <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Check if the API key is valid in Google Cloud Console</li>
            <li>Enable "Maps JavaScript API" in Google Cloud Console</li>
            <li>Enable "Places API (New)" in Google Cloud Console</li>
            <li>Set up billing in Google Cloud Console</li>
            <li>Remove domain restrictions or add localhost to allowed domains</li>
            <li>Check browser console for detailed error messages</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default MapAPITest;