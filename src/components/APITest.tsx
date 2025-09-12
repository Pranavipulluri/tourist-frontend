import React, { useState } from 'react';

const APITest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:3001/api/admin/dashboard/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.text();
      setTestResult(`Status: ${response.status}\nResponse: ${result}`);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  const testRegistration = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'testpassword123',
          phoneNumber: '+1234567890',
          emergencyContact: '+1234567891',
          nationality: 'USA',
          passportNumber: 'TEST123456'
        }),
      });

      const result = await response.text();
      setTestResult(`Registration Status: ${response.status}\nResponse: ${result}`);
    } catch (error) {
      setTestResult(`Registration Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Page</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={testAPI} disabled={loading}>
          Test API Connection
        </button>
        <button onClick={testRegistration} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Registration
        </button>
      </div>
      
      {loading && <p>Testing...</p>}
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        border: '1px solid #ddd',
        whiteSpace: 'pre-wrap',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {testResult || 'Click a button to test the API'}
      </pre>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Current Environment:</h3>
        <p>API URL: {process.env.REACT_APP_API_URL}</p>
        <p>Environment: {process.env.REACT_APP_ENV}</p>
      </div>
    </div>
  );
};

export default APITest;
