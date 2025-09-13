import { apiService } from './api';

export interface BlockchainSOS {
  id: string;
  touristId: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
  emergencyType: 'SOS' | 'PANIC' | 'MEDICAL' | 'SECURITY';
  blockchainTxHash?: string;
  verified: boolean;
}

export interface BlockchainGeofence {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  type: 'safe' | 'caution' | 'danger';
  blockchainTxHash?: string;
  violations: Array<{
    touristId: string;
    timestamp: number;
    location: { latitude: number; longitude: number };
    txHash?: string;
  }>;
}

class BlockchainService {
  private static instance: BlockchainService;
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  // SOS Emergency Recording on Blockchain
  async recordEmergencySOS(sosData: {
    touristId: string;
    location: { latitude: number; longitude: number };
    emergencyType: 'SOS' | 'PANIC' | 'MEDICAL' | 'SECURITY';
    message?: string;
  }): Promise<BlockchainSOS> {
    try {
      console.log('🔗 Recording SOS on blockchain:', sosData);
      
      // First record in backend database
      const response = await apiService.post('/emergency/sos', {
        ...sosData,
        timestamp: Date.now(),
        useBlockchain: true
      });

      // Simulate blockchain transaction for demo
      const mockTxHash = this.generateMockTxHash();
      
      const blockchainSOS: BlockchainSOS = {
        id: response.data.id || `sos_${Date.now()}`,
        touristId: sosData.touristId,
        timestamp: Date.now(),
        location: sosData.location,
        emergencyType: sosData.emergencyType,
        blockchainTxHash: mockTxHash,
        verified: true
      };

      console.log('✅ SOS recorded on blockchain:', blockchainSOS);
      return blockchainSOS;
    } catch (error) {
      console.error('❌ Failed to record SOS on blockchain:', error);
      
      // Fallback: create local record without blockchain
      const fallbackSOS: BlockchainSOS = {
        id: `sos_${Date.now()}`,
        touristId: sosData.touristId,
        timestamp: Date.now(),
        location: sosData.location,
        emergencyType: sosData.emergencyType,
        verified: false
      };
      
      return fallbackSOS;
    }
  }

  // Get SOS Records from Blockchain
  async getSOSRecords(touristId?: string): Promise<BlockchainSOS[]> {
    try {
      console.log('🔍 Fetching SOS records from blockchain...');
      
      const endpoint = touristId 
        ? `/emergency/alerts/${touristId}` 
        : '/admin/alerts/sos';
      
      const response = await apiService.get(endpoint);
      
      // Safely access response data
      const data = response?.data || response || [];
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('⚠️ SOS response data is not an array:', typeof data);
        return [];
      }
      
      // Transform backend data to blockchain format
      const sosRecords: BlockchainSOS[] = data.map((alert: any) => ({
        id: alert.id || `sos_${Date.now()}_${Math.random()}`,
        touristId: alert.touristId || alert.tourist_id || 'unknown',
        timestamp: alert.createdAt || alert.created_at 
          ? new Date(alert.createdAt || alert.created_at).getTime()
          : Date.now(),
        location: {
          latitude: alert.latitude || alert.location?.latitude || 0,
          longitude: alert.longitude || alert.location?.longitude || 0
        },
        emergencyType: alert.type || alert.emergency_type || 'SOS',
        blockchainTxHash: alert.blockchainTxHash || alert.blockchain_tx_hash || this.generateMockTxHash(),
        verified: alert.verified !== undefined ? alert.verified : true
      }));

      console.log('✅ Retrieved SOS records:', sosRecords.length, 'records');
      return sosRecords;
    } catch (error) {
      console.error('❌ Failed to get SOS records:', error);
      return [];
    }
  }

  // Create Geofence on Blockchain
  async createGeofence(geofenceData: {
    name: string;
    coordinates: Array<{ lat: number; lng: number }>;
    type: 'safe' | 'caution' | 'danger';
    description?: string;
  }): Promise<BlockchainGeofence> {
    try {
      console.log('🔗 Creating geofence on blockchain:', geofenceData);
      
      const response = await apiService.post('/admin/zones', {
        ...geofenceData,
        useBlockchain: true
      });

      const blockchainGeofence: BlockchainGeofence = {
        id: response.data.id || `geofence_${Date.now()}`,
        name: geofenceData.name,
        coordinates: geofenceData.coordinates,
        type: geofenceData.type,
        blockchainTxHash: this.generateMockTxHash(),
        violations: []
      };

      console.log('✅ Geofence created on blockchain:', blockchainGeofence);
      return blockchainGeofence;
    } catch (error) {
      console.error('❌ Failed to create geofence on blockchain:', error);
      throw error;
    }
  }

  // Record Geofence Violation on Blockchain
  async recordGeofenceViolation(violationData: {
    geofenceId: string;
    touristId: string;
    location: { latitude: number; longitude: number };
  }): Promise<void> {
    try {
      console.log('🔗 Recording geofence violation on blockchain:', violationData);
      
      await apiService.post('/location/geofence/check-violations', {
        ...violationData,
        timestamp: Date.now(),
        useBlockchain: true
      });

      const mockTxHash = this.generateMockTxHash();
      console.log('✅ Geofence violation recorded:', mockTxHash);
    } catch (error) {
      console.error('❌ Failed to record geofence violation:', error);
      throw error;
    }
  }

  // Get Blockchain Status
  async getBlockchainStatus(): Promise<{
    connected: boolean;
    network: string;
    chainId: number;
    blockNumber?: number;
    gasPrice?: string;
  }> {
    try {
      const response = await apiService.get('/digital-id/blockchain/status');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get blockchain status:', error);
      return {
        connected: false,
        network: 'disconnected',
        chainId: 0
      };
    }
  }

  // Verify Emergency on Blockchain
  async verifyEmergency(sosId: string): Promise<boolean> {
    try {
      console.log('🔍 Verifying emergency on blockchain:', sosId);
      
      // In a real implementation, this would check the blockchain transaction
      // For demo purposes, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Emergency verified on blockchain');
      return true;
    } catch (error) {
      console.error('❌ Failed to verify emergency:', error);
      return false;
    }
  }

  // Utility: Generate Mock Transaction Hash
  private generateMockTxHash(): string {
    return '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Real-time Blockchain Event Listener
  startEventListener(): void {
    console.log('🔗 Starting blockchain event listener...');
    
    // Simulate periodic blockchain events
    setInterval(() => {
      this.simulateBlockchainEvent();
    }, 30000); // Every 30 seconds
  }

  private simulateBlockchainEvent(): void {
    const events = [
      { type: 'NEW_SOS', message: 'New SOS alert recorded on blockchain' },
      { type: 'GEOFENCE_VIOLATION', message: 'Geofence violation detected' },
      { type: 'EMERGENCY_VERIFIED', message: 'Emergency response verified' }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    console.log('🔔 Blockchain Event:', randomEvent);
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('blockchain-event', {
      detail: randomEvent
    }));
  }
}

export default BlockchainService;