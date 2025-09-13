import axios from 'axios';

// Digital Tourist ID Service for Frontend (API-only)
class DigitalTouristIDService {
  private static instance: DigitalTouristIDService;
  private isInitialized: boolean = false;
  private apiBaseUrl: string;

  private constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  public static getInstance(): DigitalTouristIDService {
    if (!DigitalTouristIDService.instance) {
      DigitalTouristIDService.instance = new DigitalTouristIDService();
    }
    return DigitalTouristIDService.instance;
  }

  // Initialize the service
  public async initialize(): Promise<void> {
    try {
      console.log('🆔 Initializing Digital Tourist ID Service...');
      
      // Test connection to backend
      const response = await axios.get(`${this.apiBaseUrl}/digital-tourist-id/blockchain/status`);
      
      this.isInitialized = true;
      console.log('✅ Digital Tourist ID Service initialized');
      console.log('🔗 Backend Status:', response.data);

    } catch (error) {
      console.error('❌ Failed to initialize Digital Tourist ID Service:', error);
      this.isInitialized = false;
    }
  }

  // Issue a new Digital Tourist ID
  public async issueDigitalID(data: {
    touristId: string;
    touristWallet: string;
    personalData: any;
    bookingData?: any;
    emergencyContacts: any;
    biometricData?: string;
    validityDays: number;
    checkoutTimestamp?: number;
    initialConsent?: any;
  }): Promise<{ success: boolean; blockchainId?: string; transactionHash?: string; error?: string }> {
    try {
      console.log('🆔 Issuing Digital Tourist ID through backend service...', data.touristId);

      const response = await axios.post(`${this.apiBaseUrl}/digital-tourist-id/issue`, {
        touristId: data.touristId,
        touristWallet: data.touristWallet,
        personalData: data.personalData,
        bookingData: data.bookingData,
        emergencyContacts: data.emergencyContacts,
        biometricData: data.biometricData || '',
        validityDays: data.validityDays,
        checkoutTimestamp: data.checkoutTimestamp,
        initialConsent: data.initialConsent
      });

      if (response.data.success) {
        this.emitEvent('id-issued', {
          blockchainId: response.data.blockchainId,
          touristId: data.touristId,
          transactionHash: response.data.transactionHash
        });

        return {
          success: true,
          blockchainId: response.data.blockchainId,
          transactionHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to issue Digital ID'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to issue Digital Tourist ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to issue Digital ID'
      };
    }
  }

  // Access Digital ID with proper authorization
  public async accessDigitalID(data: {
    blockchainId: string;
    accessReason: string;
    emergencyAccess?: boolean;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('👁️ Accessing Digital ID:', data.blockchainId);

      const response = await axios.post(`${this.apiBaseUrl}/digital-tourist-id/access`, {
        blockchainId: data.blockchainId,
        accessReason: data.accessReason,
        emergencyAccess: data.emergencyAccess || false
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Access denied'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to access Digital ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Access denied'
      };
    }
  }

  // Update consent settings
  public async updateConsent(
    blockchainId: string,
    consentSettings: any
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('✋ Updating consent for Digital ID:', blockchainId);

      const response = await axios.put(`${this.apiBaseUrl}/digital-tourist-id/consent/${blockchainId}`, {
        consentSettings
      });

      if (response.data.success) {
        return {
          success: true,
          transactionHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Consent update failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to update consent:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Consent update failed'
      };
    }
  }

  // Report lost ID and request reissuance
  public async reportLostID(data: {
    blockchainId: string;
    reason: string;
    kioskLocation?: string;
    newWalletAddress?: string;
  }): Promise<{ success: boolean; newBlockchainId?: string; transactionHash?: string; error?: string }> {
    try {
      console.log('📱 Processing lost ID report for:', data.blockchainId);

      const response = await axios.post(`${this.apiBaseUrl}/digital-tourist-id/report-lost`, {
        blockchainId: data.blockchainId,
        reason: data.reason,
        kioskLocation: data.kioskLocation,
        newWalletAddress: data.newWalletAddress
      });

      if (response.data.success) {
        return {
          success: true,
          newBlockchainId: response.data.newBlockchainId,
          transactionHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Lost ID processing failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to process lost ID:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Lost ID processing failed'
      };
    }
  }

  // Trigger emergency access
  public async triggerEmergencyAccess(data: {
    blockchainId: string;
    reason: string;
    emergencyResponderAddress: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('🚨 Triggering emergency access for Digital ID:', data.blockchainId);

      const response = await axios.post(`${this.apiBaseUrl}/digital-tourist-id/emergency-access`, {
        blockchainId: data.blockchainId,
        reason: data.reason,
        emergencyResponderAddress: data.emergencyResponderAddress
      });

      if (response.data.success) {
        return {
          success: true,
          transactionHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Emergency access failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to trigger emergency access:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Emergency access failed'
      };
    }
  }

  // Run auto-expiration process
  public async autoExpireIDs(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('⏰ Running auto-expiration check...');

      const response = await axios.post(`${this.apiBaseUrl}/digital-tourist-id/auto-expire`);

      if (response.data.success) {
        console.log('✅ Auto-expiration completed:', response.data);
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || 'Auto-expiration failed'
        };
      }

    } catch (error: any) {
      console.error('❌ Auto-expiration process failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Auto-expiration failed'
      };
    }
  }

  // Get access logs for audit
  public async getAccessLogs(blockchainId: string): Promise<{
    success: boolean;
    logs?: any[];
    error?: string;
  }> {
    try {
      console.log('📋 Retrieving access logs for Digital ID:', blockchainId);

      const response = await axios.get(`${this.apiBaseUrl}/digital-tourist-id/${blockchainId}/access-logs`);

      if (response.data.success) {
        return {
          success: true,
          logs: response.data.logs
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to retrieve logs'
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to retrieve access logs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to retrieve logs'
      };
    }
  }

  // Get analytics summary
  public async getAnalyticsSummary(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📊 Retrieving analytics summary...');

      const response = await axios.get(`${this.apiBaseUrl}/digital-tourist-id/analytics/summary`);

      if (response.data.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data
        };
      } else {
        return {
          success: true,
          data: response.data
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to retrieve analytics:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to retrieve analytics'
      };
    }
  }

  // Get blockchain status
  public async getBlockchainStatus(): Promise<{
    success: boolean;
    status?: any;
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/digital-tourist-id/blockchain/status`);

      if (response.data.success !== undefined) {
        return {
          success: response.data.success,
          status: response.data.blockchainStatus
        };
      } else {
        return {
          success: true,
          status: response.data
        };
      }

    } catch (error: any) {
      console.error('❌ Failed to get blockchain status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get status'
      };
    }
  }

  // Frontend notification methods
  private notifyFrontend(eventType: string, data: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('digital-id-event', {
        detail: { type: eventType, data }
      }));
    }
  }

  // Emit events to the frontend
  private emitEvent(type: string, data: any): void {
    this.notifyFrontend(type, data);
  }

  // Public method to get service status
  public getStatus(): {
    initialized: boolean;
    apiBaseUrl: string;
  } {
    return {
      initialized: this.isInitialized,
      apiBaseUrl: this.apiBaseUrl
    };
  }
}

export default DigitalTouristIDService;