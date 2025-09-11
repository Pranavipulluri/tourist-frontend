import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const DigitalID: React.FC = () => {
  const { user } = useAuth();
  const [digitalId, setDigitalId] = useState<{
    digitalId: string;
    qrCode: string;
    issuedAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadDigitalId();
  }, []);

  const loadDigitalId = async () => {
    try {
      const id = await apiService.getDigitalId();
      setDigitalId(id);
    } catch (error) {
      // Digital ID doesn't exist yet
      console.log('No digital ID found');
    }
  };

  const createDigitalId = async () => {
    setLoading(true);
    try {
      const newId = await apiService.createDigitalId();
      setDigitalId({
        ...newId,
        issuedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to create digital ID:', error);
      alert('Failed to create digital ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="digital-id">
      <div className="id-header">
        <h3>🆔 Digital ID</h3>
        {digitalId && (
          <button
            className="show-qr-button"
            onClick={() => setShowQR(!showQR)}
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
        )}
      </div>

      {digitalId ? (
        <div className="id-content">
          <div className="id-info">
            <div className="id-field">
              <span className="id-label">ID Number:</span>
              <span className="id-value">{digitalId.digitalId}</span>
            </div>
            <div className="id-field">
              <span className="id-label">Issued:</span>
              <span className="id-value">
                {new Date(digitalId.issuedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="id-field">
              <span className="id-label">Name:</span>
              <span className="id-value">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="id-field">
              <span className="id-label">Nationality:</span>
              <span className="id-value">{user?.nationality}</span>
            </div>
          </div>

          {showQR && (
            <div className="qr-code-container">
              <img 
                src={digitalId.qrCode} 
                alt="Digital ID QR Code"
                className="qr-code"
              />
              <p className="qr-instruction">
                Show this QR code to authorities for instant verification
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="no-id">
          <span className="no-id-icon">🆔</span>
          <p>No digital ID created</p>
          <p className="no-id-subtitle">
            Create a secure digital ID for quick verification
          </p>
          <button
            className={`create-id-button ${loading ? 'loading' : ''}`}
            onClick={createDigitalId}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Digital ID'}
          </button>
        </div>
      )}
    </div>
  );
};
