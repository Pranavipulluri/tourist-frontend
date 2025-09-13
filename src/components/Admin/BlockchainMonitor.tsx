import React, { useEffect, useState } from 'react';
import BlockchainService from '../../services/blockchain';
import styles from './BlockchainMonitor.module.css';

interface BlockchainStatus {
  connected: boolean;
  network: string;
  chainId: number;
  blockNumber?: number;
  gasPrice?: string;
}

export const BlockchainMonitor: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [sosRecords, setSosRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const blockchainService = BlockchainService.getInstance();

  useEffect(() => {
    loadBlockchainStatus();
    loadSOSRecords();
    startEventListener();

    // Start blockchain event listener
    blockchainService.startEventListener();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const loadBlockchainStatus = async () => {
    try {
      const blockchainStatus = await blockchainService.getBlockchainStatus();
      setStatus(blockchainStatus);
    } catch (error) {
      console.error('Failed to load blockchain status:', error);
      setStatus({
        connected: false,
        network: 'disconnected',
        chainId: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSOSRecords = async () => {
    try {
      const records = await blockchainService.getSOSRecords();
      setSosRecords(records.slice(0, 5)); // Show last 5 records
    } catch (error) {
      console.error('Failed to load SOS records:', error);
    }
  };

  const startEventListener = () => {
    const handleBlockchainEvent = (event: any) => {
      const newEvent = {
        id: Date.now(),
        ...event.detail,
        timestamp: new Date().toISOString()
      };
      
      setEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    window.addEventListener('blockchain-event', handleBlockchainEvent);
    
    return () => {
      window.removeEventListener('blockchain-event', handleBlockchainEvent);
    };
  };

  const testSOS = async () => {
    try {
      const testSOSData = {
        touristId: 'test_tourist_' + Date.now(),
        location: { latitude: 28.6139, longitude: 77.2090 }, // New Delhi
        emergencyType: 'SOS' as const,
        message: 'Test SOS from admin panel'
      };

      const result = await blockchainService.recordEmergencySOS(testSOSData);
      console.log('Test SOS recorded:', result);
      
      // Refresh SOS records
      loadSOSRecords();
      
      alert('Test SOS recorded successfully on blockchain!');
    } catch (error) {
      console.error('Failed to test SOS:', error);
      alert('Failed to record test SOS');
    }
  };

  if (loading) {
    return (
      <div className={styles.blockchainMonitor}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading blockchain status...</p>
      </div>
    );
  }

  return (
    <div className={styles.blockchainMonitor}>
      <div className={styles.blockchainHeader}>
        <h3>🔗 Blockchain Integration Status</h3>
        <button className={styles.testButton} onClick={testSOS}>
          🧪 Test SOS Recording
        </button>
      </div>

      {/* Blockchain Status */}
      <div className={styles.statusSection}>
        <h4>Network Status</h4>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Connection:</span>
            <span className={`${styles.statusValue} ${status?.connected ? styles.connected : styles.disconnected}`}>
              {status?.connected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Network:</span>
            <span className={styles.statusValue}>{status?.network || 'Unknown'}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Chain ID:</span>
            <span className={styles.statusValue}>{status?.chainId || 'N/A'}</span>
          </div>
          {status?.blockNumber && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Block:</span>
              <span className={styles.statusValue}>#{status.blockNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent SOS Records */}
      <div className={styles.sosSection}>
        <h4>🆘 Recent Blockchain SOS Records</h4>
        {sosRecords.length > 0 ? (
          <div className={styles.sosList}>
            {sosRecords.map((sos) => (
              <div key={sos.id} className={styles.sosItem}>
                <div className={styles.sosHeader}>
                  <span className={styles.sosType}>{sos.emergencyType}</span>
                  <span className={styles.sosTime}>
                    {new Date(sos.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.sosDetails}>
                  <span className={styles.touristId}>Tourist: {sos.touristId}</span>
                  {sos.blockchainTxHash && (
                    <span className={styles.txHash} title={sos.blockchainTxHash}>
                      📜 {sos.blockchainTxHash.substring(0, 10)}...
                    </span>
                  )}
                  <span className={`${styles.verification} ${sos.verified ? styles.verified : styles.pending}`}>
                    {sos.verified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noRecords}>No SOS records found</p>
        )}
      </div>

      {/* Real-time Events */}
      <div className={styles.eventsSection}>
        <h4>📡 Real-time Blockchain Events</h4>
        {events.length > 0 ? (
          <div className={styles.eventsList}>
            {events.map((event) => (
              <div key={event.id} className={styles.eventItem}>
                <div className={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className={styles.eventContent}>
                  <span className={styles.eventType}>{event.type}</span>
                  <span className={styles.eventMessage}>{event.message}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noEvents}>No recent events</p>
        )}
      </div>
    </div>
  );
};