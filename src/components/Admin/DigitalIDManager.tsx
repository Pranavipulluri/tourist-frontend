import React, { useEffect, useState } from 'react';
import DigitalTouristIDService from '../../services/digital-tourist-id';
import styles from './DigitalIDManager.module.css';

interface DigitalID {
  blockchainId: string;
  touristId: string;
  touristName: string;
  touristWallet: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOST' | 'REPLACED';
  issuedAt: number;
  expiresAt: number;
  checkoutTime: number;
  emergencyOverride: boolean;
  accessLevel: {
    police: boolean;
    hotel: boolean;
    family: boolean;
    tourism: boolean;
  };
  lastAccessed?: number;
  accessCount: number;
}

interface ConsentSettings {
  POLICE_ACCESS: boolean;
  HOTEL_ACCESS: boolean;
  FAMILY_ACCESS: boolean;
  TOURISM_DEPT_ACCESS: boolean;
}

export const DigitalIDManager: React.FC = () => {
  const [digitalIDs, setDigitalIDs] = useState<DigitalID[]>([]);
  const [selectedID, setSelectedID] = useState<DigitalID | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'issue' | 'manage' | 'analytics' | 'emergency'>('overview');
  const [accessLogs, setAccessLogs] = useState<string[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Form states
  const [newIDForm, setNewIDForm] = useState({
    touristId: '',
    touristName: '',
    touristWallet: '',
    nationalId: '',
    passport: '',
    nationality: '',
    phoneNumber: '',
    emergencyContact: '',
    hotelName: '',
    checkInDate: '',
    checkOutDate: '',
    validityDays: 30,
    biometricData: ''
  });

  const digitalIDService = DigitalTouristIDService.getInstance();

  // Event handler for digital ID events
  const handleDigitalIDEvent = (event: any) => {
    const { type, data } = event.detail;
    
    const newEvent = {
      id: Date.now(),
      type,
      data,
      timestamp: Date.now()
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    
    // Refresh data on relevant events
    if (['id-issued', 'id-expired', 'emergency-access'].includes(type)) {
      loadDigitalIDs();
    }
  };

  useEffect(() => {
    initializeDigitalIDService();
    loadDigitalIDs();
    setupEventListeners();

    return () => {
      // Cleanup event listeners
      window.removeEventListener('digital-id-event', handleDigitalIDEvent);
    };
  }, []);

  const initializeDigitalIDService = async () => {
    try {
      await digitalIDService.initialize();
      const status = digitalIDService.getStatus();
      setServiceStatus(status);
      console.log('🆔 Digital ID Service Status:', status);
    } catch (error) {
      console.error('Failed to initialize Digital ID Service:', error);
    }
  };

  const setupEventListeners = () => {
    window.addEventListener('digital-id-event', handleDigitalIDEvent);
  };

  const loadDigitalIDs = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - in production, this would fetch from backend
      const mockDigitalIDs: DigitalID[] = [
        {
          blockchainId: '1001',
          touristId: 'TUR001',
          touristName: 'John Smith',
          touristWallet: '0x1234567890abcdef1234567890abcdef12345678',
          status: 'ACTIVE',
          issuedAt: Date.now() - 86400000,
          expiresAt: Date.now() + 2592000000, // 30 days
          checkoutTime: Date.now() + 432000000, // 5 days
          emergencyOverride: false,
          accessLevel: {
            police: true,
            hotel: true,
            family: true,
            tourism: true
          },
          lastAccessed: Date.now() - 3600000,
          accessCount: 15
        },
        {
          blockchainId: '1002',
          touristId: 'TUR002',
          touristName: 'Maria Garcia',
          touristWallet: '0x2345678901bcdef12345678901bcdef123456789',
          status: 'ACTIVE',
          issuedAt: Date.now() - 172800000,
          expiresAt: Date.now() + 2419200000,
          checkoutTime: Date.now() + 259200000,
          emergencyOverride: false,
          accessLevel: {
            police: true,
            hotel: true,
            family: false,
            tourism: true
          },
          lastAccessed: Date.now() - 1800000,
          accessCount: 8
        },
        {
          blockchainId: '1003',
          touristId: 'TUR003',
          touristName: 'David Chen',
          touristWallet: '0x3456789012cdef123456789012cdef1234567890',
          status: 'EXPIRED',
          issuedAt: Date.now() - 3024000000,
          expiresAt: Date.now() - 432000000,
          checkoutTime: Date.now() - 432000000,
          emergencyOverride: false,
          accessLevel: {
            police: true,
            hotel: false,
            family: true,
            tourism: true
          },
          lastAccessed: Date.now() - 432000000,
          accessCount: 23
        }
      ];
      
      setDigitalIDs(mockDigitalIDs);
    } catch (err: any) {
      setError('Failed to load Digital IDs');
      console.error('Digital ID load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueNewID = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const checkoutTimestamp = new Date(newIDForm.checkOutDate).getTime();
      
      const result = await digitalIDService.issueDigitalID({
        touristId: newIDForm.touristId,
        touristWallet: newIDForm.touristWallet,
        personalData: {
          name: newIDForm.touristName,
          nationalId: newIDForm.nationalId,
          passport: newIDForm.passport,
          nationality: newIDForm.nationality,
          phoneNumber: newIDForm.phoneNumber
        },
        bookingData: {
          hotelName: newIDForm.hotelName,
          checkInDate: newIDForm.checkInDate,
          checkOutDate: newIDForm.checkOutDate
        },
        emergencyContacts: {
          primary: newIDForm.emergencyContact
        },
        biometricData: newIDForm.biometricData,
        validityDays: newIDForm.validityDays,
        checkoutTimestamp
      });

      if (result.success) {
        // eslint-disable-next-line no-restricted-globals
        window.alert(`Digital ID issued successfully!\nBlockchain ID: ${result.blockchainId}\nTransaction: ${result.transactionHash}`);
        setShowIssueForm(false);
        setNewIDForm({
          touristId: '',
          touristName: '',
          touristWallet: '',
          nationalId: '',
          passport: '',
          nationality: '',
          phoneNumber: '',
          emergencyContact: '',
          hotelName: '',
          checkInDate: '',
          checkOutDate: '',
          validityDays: 30,
          biometricData: ''
        });
        await loadDigitalIDs();
      } else {
        // eslint-disable-next-line no-restricted-globals
        window.alert(`Failed to issue Digital ID: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to issue Digital ID:', error);
      // eslint-disable-next-line no-restricted-globals
      window.alert('Failed to issue Digital ID');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAccessLogs = async (digitalID: DigitalID) => {
    try {
      const result = await digitalIDService.getAccessLogs(digitalID.blockchainId);
      if (result.success && result.logs) {
        setAccessLogs(result.logs);
        setSelectedID(digitalID);
      }
    } catch (error) {
      console.error('Failed to load access logs:', error);
    }
  };

  const handleEmergencyAccess = async (digitalID: DigitalID) => {
    // eslint-disable-next-line no-restricted-globals
    const reason = window.prompt('Enter emergency access reason:');
    if (!reason) return;

    try {
      const result = await digitalIDService.triggerEmergencyAccess({
        blockchainId: digitalID.blockchainId,
        reason,
        emergencyResponderAddress: '0x0000000000000000000000000000000000000000'
      });

      if (result.success) {
        // eslint-disable-next-line no-restricted-globals
        window.alert(`Emergency access triggered!\nTransaction: ${result.transactionHash}`);
        await loadDigitalIDs();
      } else {
        // eslint-disable-next-line no-restricted-globals
        window.alert(`Failed to trigger emergency access: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to trigger emergency access:', error);
      // eslint-disable-next-line no-restricted-globals
      window.alert('Failed to trigger emergency access');
    }
  };

  const handleExpireID = async (digitalID: DigitalID) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm(`Are you sure you want to expire Digital ID ${digitalID.blockchainId}?`)) {
      return;
    }

    try {
      // In production, this would call the smart contract's autoExpireID function
      console.log('Expiring Digital ID:', digitalID.blockchainId);
      // eslint-disable-next-line no-restricted-globals
      window.alert('Digital ID marked for expiration');
      await loadDigitalIDs();
    } catch (error) {
      console.error('Failed to expire Digital ID:', error);
      // eslint-disable-next-line no-restricted-globals
      window.alert('Failed to expire Digital ID');
    }
  };

  const getStatusColor = (status: DigitalID['status']) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'EXPIRED': return '#FF9800';
      case 'REVOKED': return '#F44336';
      case 'LOST': return '#9C27B0';
      case 'REPLACED': return '#607D8B';
      default: return '#757575';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const daysUntilExpiry = (expiresAt: number) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading && digitalIDs.length === 0) {
    return (
      <div className={styles.digitalIDManager}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Loading Digital ID Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.digitalIDManager}>
      <div className={styles.header}>
        <h2>🆔 Digital Tourist ID Management</h2>
        <p>Blockchain-backed identity management with dynamic lifecycle and tiered access control</p>
        
        {serviceStatus && (
          <div className={styles.serviceStatus}>
            <div className={`${styles.statusIndicator} ${serviceStatus.connected ? styles.connected : styles.disconnected}`}>
              {serviceStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            <span>Blockchain Service: {serviceStatus.initialized ? 'Ready' : 'Initializing'}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'issue' ? styles.active : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          ➕ Issue New ID
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'manage' ? styles.active : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          ⚙️ Manage IDs
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'emergency' ? styles.active : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          🚨 Emergency
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className={styles.overviewSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Digital IDs</h3>
              <div className={styles.statValue}>{digitalIDs.length}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Active IDs</h3>
              <div className={styles.statValue}>
                {digitalIDs.filter(id => id.status === 'ACTIVE').length}
              </div>
            </div>
            <div className={styles.statCard}>
              <h3>Expiring Soon</h3>
              <div className={styles.statValue}>
                {digitalIDs.filter(id => daysUntilExpiry(id.expiresAt) <= 7 && id.status === 'ACTIVE').length}
              </div>
            </div>
            <div className={styles.statCard}>
              <h3>Emergency Override</h3>
              <div className={styles.statValue}>
                {digitalIDs.filter(id => id.emergencyOverride).length}
              </div>
            </div>
          </div>

          <div className={styles.recentActivity}>
            <h3>📡 Recent Blockchain Events</h3>
            {events.length > 0 ? (
              <div className={styles.eventsList}>
                {events.map(event => (
                  <div key={event.id} className={styles.eventItem}>
                    <div className={styles.eventTime}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className={styles.eventContent}>
                      <span className={styles.eventType}>{event.type}</span>
                      <span className={styles.eventData}>
                        {JSON.stringify(event.data, null, 2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noEvents}>No recent events</p>
            )}
          </div>

          <div className={styles.quickActions}>
            <h3>⚡ Quick Actions</h3>
            <div className={styles.actionButtons}>
              <button
                className={styles.actionButton}
                onClick={() => setActiveTab('issue')}
              >
                ➕ Issue New Digital ID
              </button>
              <button
                className={styles.actionButton}
                onClick={() => digitalIDService.autoExpireIDs()}
              >
                ⏰ Run Auto-Expiration
              </button>
              <button
                className={styles.actionButton}
                onClick={() => setActiveTab('emergency')}
              >
                🚨 Emergency Console
              </button>
              <button
                className={styles.actionButton}
                onClick={loadDigitalIDs}
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue New ID Tab */}
      {activeTab === 'issue' && (
        <div className={styles.issueSection}>
          <form onSubmit={handleIssueNewID} className={styles.issueForm}>
            <h3>➕ Issue New Digital Tourist ID</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Tourist ID</label>
                <input
                  type="text"
                  value={newIDForm.touristId}
                  onChange={(e) => setNewIDForm({...newIDForm, touristId: e.target.value})}
                  required
                  placeholder="TUR001"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tourist Name</label>
                <input
                  type="text"
                  value={newIDForm.touristName}
                  onChange={(e) => setNewIDForm({...newIDForm, touristName: e.target.value})}
                  required
                  placeholder="John Smith"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Wallet Address</label>
                <input
                  type="text"
                  value={newIDForm.touristWallet}
                  onChange={(e) => setNewIDForm({...newIDForm, touristWallet: e.target.value})}
                  required
                  placeholder="0x..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>National ID</label>
                <input
                  type="text"
                  value={newIDForm.nationalId}
                  onChange={(e) => setNewIDForm({...newIDForm, nationalId: e.target.value})}
                  placeholder="National ID Number"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Passport Number</label>
                <input
                  type="text"
                  value={newIDForm.passport}
                  onChange={(e) => setNewIDForm({...newIDForm, passport: e.target.value})}
                  placeholder="US123456789"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Nationality</label>
                <select
                  value={newIDForm.nationality}
                  onChange={(e) => setNewIDForm({...newIDForm, nationality: e.target.value})}
                  required
                >
                  <option value="">Select Nationality</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Canadian">Canadian</option>
                  <option value="Australian">Australian</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newIDForm.phoneNumber}
                  onChange={(e) => setNewIDForm({...newIDForm, phoneNumber: e.target.value})}
                  placeholder="+1-555-0123"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Emergency Contact</label>
                <input
                  type="text"
                  value={newIDForm.emergencyContact}
                  onChange={(e) => setNewIDForm({...newIDForm, emergencyContact: e.target.value})}
                  placeholder="Name: +1-555-0124"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Hotel Name</label>
                <input
                  type="text"
                  value={newIDForm.hotelName}
                  onChange={(e) => setNewIDForm({...newIDForm, hotelName: e.target.value})}
                  placeholder="Grand Palace Hotel"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Check-in Date</label>
                <input
                  type="date"
                  value={newIDForm.checkInDate}
                  onChange={(e) => setNewIDForm({...newIDForm, checkInDate: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Check-out Date</label>
                <input
                  type="date"
                  value={newIDForm.checkOutDate}
                  onChange={(e) => setNewIDForm({...newIDForm, checkOutDate: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Validity Period (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newIDForm.validityDays}
                  onChange={(e) => setNewIDForm({...newIDForm, validityDays: parseInt(e.target.value)})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Biometric Data Hash</label>
                <input
                  type="text"
                  value={newIDForm.biometricData}
                  onChange={(e) => setNewIDForm({...newIDForm, biometricData: e.target.value})}
                  placeholder="SHA256 hash of biometric data"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Issuing...' : '🆔 Issue Digital ID'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage IDs Tab */}
      {activeTab === 'manage' && (
        <div className={styles.manageSection}>
          <h3>⚙️ Manage Digital Tourist IDs</h3>
          
          <div className={styles.digitalIDsList}>
            {digitalIDs.map(digitalID => (
              <div key={digitalID.blockchainId} className={styles.digitalIDCard}>
                <div className={styles.digitalIDHeader}>
                  <div className={styles.digitalIDInfo}>
                    <h4>{digitalID.touristName}</h4>
                    <span className={styles.touristId}>ID: {digitalID.touristId}</span>
                    <span className={styles.blockchainId}>Blockchain: {digitalID.blockchainId}</span>
                  </div>
                  <div className={styles.digitalIDStatus}>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(digitalID.status) }}
                    >
                      {digitalID.status}
                    </span>
                    {digitalID.emergencyOverride && (
                      <span className={styles.emergencyBadge}>🚨 EMERGENCY</span>
                    )}
                  </div>
                </div>

                <div className={styles.digitalIDDetails}>
                  <div className={styles.detailItem}>
                    <strong>Issued:</strong> {formatDate(digitalID.issuedAt)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Expires:</strong> {formatDate(digitalID.expiresAt)}
                    <span className={styles.daysLeft}>
                      ({daysUntilExpiry(digitalID.expiresAt)} days left)
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Checkout:</strong> {formatDate(digitalID.checkoutTime)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Last Accessed:</strong> {digitalID.lastAccessed ? formatDate(digitalID.lastAccessed) : 'Never'}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Access Count:</strong> {digitalID.accessCount}
                  </div>
                </div>

                <div className={styles.accessLevels}>
                  <h5>Access Permissions:</h5>
                  <div className={styles.accessGrid}>
                    <span className={`${styles.accessItem} ${digitalID.accessLevel.police ? styles.granted : styles.denied}`}>
                      👮 Police: {digitalID.accessLevel.police ? 'Granted' : 'Denied'}
                    </span>
                    <span className={`${styles.accessItem} ${digitalID.accessLevel.hotel ? styles.granted : styles.denied}`}>
                      🏨 Hotel: {digitalID.accessLevel.hotel ? 'Granted' : 'Denied'}
                    </span>
                    <span className={`${styles.accessItem} ${digitalID.accessLevel.family ? styles.granted : styles.denied}`}>
                      👨‍👩‍👧‍👦 Family: {digitalID.accessLevel.family ? 'Granted' : 'Denied'}
                    </span>
                    <span className={`${styles.accessItem} ${digitalID.accessLevel.tourism ? styles.granted : styles.denied}`}>
                      🏛️ Tourism: {digitalID.accessLevel.tourism ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                </div>

                <div className={styles.digitalIDActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleViewAccessLogs(digitalID)}
                  >
                    📋 View Logs
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEmergencyAccess(digitalID)}
                    disabled={digitalID.status !== 'ACTIVE'}
                  >
                    🚨 Emergency Access
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleExpireID(digitalID)}
                    disabled={digitalID.status !== 'ACTIVE'}
                  >
                    ⏰ Expire ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className={styles.analyticsSection}>
          <h3>📈 Digital ID Analytics</h3>
          
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <h4>ID Status Distribution</h4>
              <div className={styles.statusChart}>
                {['ACTIVE', 'EXPIRED', 'REVOKED', 'LOST', 'REPLACED'].map(status => {
                  const count = digitalIDs.filter(id => id.status === status).length;
                  const percentage = digitalIDs.length > 0 ? (count / digitalIDs.length) * 100 : 0;
                  return (
                    <div key={status} className={styles.statusRow}>
                      <span className={styles.statusLabel}>{status}</span>
                      <div className={styles.statusBar}>
                        <div 
                          className={styles.statusFill}
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getStatusColor(status as any)
                          }}
                        ></div>
                      </div>
                      <span className={styles.statusCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h4>Access Activity</h4>
              <div className={styles.accessStats}>
                <div className={styles.statItem}>
                  <span>Total Accesses:</span>
                  <span>{digitalIDs.reduce((sum, id) => sum + id.accessCount, 0)}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Avg per ID:</span>
                  <span>
                    {digitalIDs.length > 0 
                      ? (digitalIDs.reduce((sum, id) => sum + id.accessCount, 0) / digitalIDs.length).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span>Most Accessed:</span>
                  <span>
                    {digitalIDs.length > 0
                      ? Math.max(...digitalIDs.map(id => id.accessCount))
                      : '0'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.analyticsCard}>
              <h4>Security Metrics</h4>
              <div className={styles.securityStats}>
                <div className={styles.statItem}>
                  <span>Emergency Overrides:</span>
                  <span>{digitalIDs.filter(id => id.emergencyOverride).length}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Lost/Replaced:</span>
                  <span>{digitalIDs.filter(id => ['LOST', 'REPLACED'].includes(id.status)).length}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Avg Validity:</span>
                  <span>
                    {digitalIDs.length > 0
                      ? Math.round(digitalIDs.reduce((sum, id) => sum + (id.expiresAt - id.issuedAt), 0) / digitalIDs.length / (1000 * 60 * 60 * 24))
                      : '0'
                    } days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Tab */}
      {activeTab === 'emergency' && (
        <div className={styles.emergencySection}>
          <h3>🚨 Emergency Response Console</h3>
          
          <div className={styles.emergencyAlert}>
            <h4>⚠️ Critical Operations</h4>
            <p>Use these functions only in genuine emergency situations. All actions are logged on the blockchain.</p>
          </div>

          <div className={styles.emergencyActions}>
            <div className={styles.emergencyCard}>
              <h5>Mass Emergency Access</h5>
              <p>Grant emergency access to all active Digital IDs</p>
              <button className={styles.emergencyButton}>
                🚨 Trigger Mass Emergency Access
              </button>
            </div>

            <div className={styles.emergencyCard}>
              <h5>Auto-Expire All</h5>
              <p>Immediately expire all Digital IDs (for security breach scenarios)</p>
              <button className={styles.emergencyButton}>
                ⏰ Mass Expire All IDs
              </button>
            </div>

            <div className={styles.emergencyCard}>
              <h5>Blockchain Status</h5>
              <p>Check blockchain network status and contract availability</p>
              <button className={styles.emergencyButton}>
                🔍 Check Blockchain Status
              </button>
            </div>
          </div>

          <div className={styles.emergencyLogs}>
            <h4>🚨 Emergency Access Log</h4>
            <div className={styles.logsList}>
              {digitalIDs
                .filter(id => id.emergencyOverride)
                .map(id => (
                  <div key={id.blockchainId} className={styles.logItem}>
                    <span className={styles.logTime}>{formatDate(id.lastAccessed || Date.now())}</span>
                    <span className={styles.logId}>{id.touristName} ({id.touristId})</span>
                    <span className={styles.logAction}>Emergency Override Active</span>
                  </div>
                ))
              }
              {digitalIDs.filter(id => id.emergencyOverride).length === 0 && (
                <p className={styles.noLogs}>No emergency accesses recorded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Access Logs Modal */}
      {selectedID && accessLogs.length > 0 && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>📋 Access Logs for {selectedID.touristName}</h3>
              <button 
                className={styles.closeModal}
                onClick={() => {
                  setSelectedID(null);
                  setAccessLogs([]);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.logsList}>
                {accessLogs.map((log, index) => (
                  <div key={index} className={styles.logEntry}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};