import React, { useState } from 'react';
import { IoTDevice, apiService } from '../../services/api';

interface DeviceStatusProps {
  device: IoTDevice | null;
  onDeviceUpdate: (device: IoTDevice | null) => void;
}

export const DeviceStatus: React.FC<DeviceStatusProps> = ({ device, onDeviceUpdate }) => {
  const [showPairing, setShowPairing] = useState(false);
  const [pairingData, setPairingData] = useState({
    deviceId: '',
    deviceType: 'SMARTWATCH' as const,
    pairingCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePairDevice = async () => {
    setLoading(true);
    try {
      const newDevice = await apiService.pairDevice(pairingData);
      onDeviceUpdate(newDevice);
      setShowPairing(false);
      setPairingData({ deviceId: '', deviceType: 'SMARTWATCH', pairingCode: '' });
    } catch (error) {
      console.error('Failed to pair device:', error);
      alert('Failed to pair device. Please check your pairing code.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpairDevice = async () => {
    setLoading(true);
    try {
      await apiService.unpairDevice();
      onDeviceUpdate(null);
    } catch (error) {
      console.error('Failed to unpair device:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return '🔋';
    if (level > 50) return '🔋';
    if (level > 25) return '🪫';
    return '🪫';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'SMARTWATCH': return '⌚';
      case 'PANIC_BUTTON': return '🔴';
      case 'GPS_TRACKER': return '📍';
      default: return '📱';
    }
  };

  return (
    <div className="device-status">
      <div className="device-header">
        <h3>📱 IoT Device</h3>
        {!device && (
          <button 
            className="pair-button"
            onClick={() => setShowPairing(true)}
          >
            Pair Device
          </button>
        )}
      </div>

      {device ? (
        <div className="device-info">
          <div className="device-overview">
            <span className="device-icon">{getDeviceIcon(device.deviceType)}</span>
            <div className="device-details">
              <h4>{device.deviceType.replace('_', ' ')}</h4>
              <p className="device-id">ID: {device.deviceId}</p>
            </div>
            <div className={`device-status-indicator ${device.isActive ? 'active' : 'inactive'}`}>
              {device.isActive ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="device-stats">
            <div className="stat-item">
              <span className="stat-icon">{getBatteryIcon(device.batteryLevel)}</span>
              <span className="stat-label">Battery</span>
              <span className="stat-value">{device.batteryLevel}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🕐</span>
              <span className="stat-label">Last Seen</span>
              <span className="stat-value">
                {new Date(device.lastSeen).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <button
            className={`unpair-button ${loading ? 'loading' : ''}`}
            onClick={handleUnpairDevice}
            disabled={loading}
          >
            {loading ? 'Unpairing...' : 'Unpair Device'}
          </button>
        </div>
      ) : (
        <div className="no-device">
          <span className="no-device-icon">📱</span>
          <p>No device paired</p>
          <p className="no-device-subtitle">
            Pair a smartwatch or panic button for enhanced safety
          </p>
        </div>
      )}

      {showPairing && (
        <div className="pairing-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Pair New Device</h4>
              <button 
                className="close-button"
                onClick={() => setShowPairing(false)}
              >
                ✕
              </button>
            </div>

            <div className="pairing-form">
              <div className="form-group">
                <label>Device Type</label>
                <select
                  value={pairingData.deviceType}
                  onChange={(e) => setPairingData(prev => ({
                    ...prev,
                    deviceType: e.target.value as any
                  }))}
                >
                  <option value="SMARTWATCH">Smart Watch</option>
                  <option value="PANIC_BUTTON">Panic Button</option>
                  <option value="GPS_TRACKER">GPS Tracker</option>
                </select>
              </div>

              <div className="form-group">
                <label>Device ID</label>
                <input
                  type="text"
                  value={pairingData.deviceId}
                  onChange={(e) => setPairingData(prev => ({
                    ...prev,
                    deviceId: e.target.value
                  }))}
                  placeholder="Enter device ID"
                />
              </div>

              <div className="form-group">
                <label>Pairing Code</label>
                <input
                  type="text"
                  value={pairingData.pairingCode}
                  onChange={(e) => setPairingData(prev => ({
                    ...prev,
                    pairingCode: e.target.value
                  }))}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <button
                className={`pair-device-button ${loading ? 'loading' : ''}`}
                onClick={handlePairDevice}
                disabled={loading || !pairingData.deviceId || !pairingData.pairingCode}
              >
                {loading ? 'Pairing...' : 'Pair Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
