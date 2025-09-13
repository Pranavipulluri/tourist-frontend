import { ethers } from 'ethers';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    this.networkUrl = process.env.REACT_APP_NETWORK_URL || 'https://polygon-mainnet.g.alchemy.com/v2/XmbIM4kcSjZ9DNkl-R1hj';
    this.contractABI = null;
    
    this.eventCallbacks = {};
    this.isListening = false;
  }

  // Initialize Web3 connection
  async initialize() {
    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log('✅ MetaMask detected');
      } else {
        // Fallback to read-only provider
        this.provider = new ethers.providers.JsonRpcProvider(this.networkUrl);
        console.log('✅ Read-only provider initialized');
      }

      // Load contract if address is available
      if (this.contractAddress) {
        await this.loadContract();
      }

      return {
        success: true,
        hasMetaMask: !!window.ethereum,
        networkName: (await this.provider.getNetwork()).name
      };

    } catch (error) {
      console.error('❌ Failed to initialize Web3:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not detected');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];
      this.signer = this.provider.getSigner();

      // Update contract with signer if available
      if (this.contract && this.contractABI) {
        this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
      }

      console.log('✅ Wallet connected:', this.account);

      return {
        success: true,
        account: this.account,
        network: await this.provider.getNetwork()
      };

    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Load smart contract
  async loadContract() {
    try {
      // Load ABI from environment or fetch from API
      if (!this.contractABI) {
        // Try to load from deployment info endpoint
        try {
          const response = await fetch('/api/contract-info');
          const contractInfo = await response.json();
          this.contractABI = contractInfo.abi;
        } catch (fetchError) {
          console.warn('Could not fetch contract ABI from API, using embedded ABI');
          // Embedded simplified ABI for critical functions
          this.contractABI = this.getEmbeddedABI();
        }
      }

      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.signer || this.provider
      );

      console.log('✅ Smart contract loaded');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to load contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tourist Registration
  async registerTourist(touristData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or wallet not connected');
      }

      const tx = await this.contract.registerTourist(
        touristData.digitalId,
        touristData.firstName,
        touristData.lastName,
        touristData.passportNumber,
        touristData.nationality,
        touristData.phoneNumber,
        touristData.emergencyContact
      );

      console.log('📝 Registration transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      // Extract tourist ID from events
      const event = receipt.events?.find(e => e.event === 'TouristRegistered');
      const touristId = event?.args?.touristId?.toString();

      console.log('✅ Tourist registered on blockchain:', touristId);

      return {
        success: true,
        touristId,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to register tourist:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  // SOS Alert Functions
  async triggerSOSAlert(alertData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or wallet not connected');
      }

      const alertType = this.getAlertTypeEnum(alertData.type);
      const severity = this.getSeverityEnum(alertData.severity);
      const latitude = Math.round(alertData.latitude * 1000000);
      const longitude = Math.round(alertData.longitude * 1000000);

      const tx = await this.contract.triggerSOSAlert(
        alertType,
        severity,
        alertData.message,
        latitude,
        longitude,
        alertData.address || ''
      );

      console.log('🚨 SOS Alert transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === 'SOSAlertTriggered');
      const alertId = event?.args?.alertId?.toString();

      console.log('✅ SOS Alert created on blockchain:', alertId);

      return {
        success: true,
        alertId,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to trigger SOS alert:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  async acknowledgeAlert(alertId, notes = '') {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or wallet not connected');
      }

      const tx = await this.contract.acknowledgeAlert(alertId, notes);
      console.log('✅ Alert acknowledgment transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  async resolveAlert(alertId, resolutionNotes = '') {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or wallet not connected');
      }

      const tx = await this.contract.resolveAlert(alertId, resolutionNotes);
      console.log('✅ Alert resolution transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  // Location Updates
  async updateLocation(locationData) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or wallet not connected');
      }

      const latitude = Math.round(locationData.latitude * 1000000);
      const longitude = Math.round(locationData.longitude * 1000000);

      const tx = await this.contract.updateLocation(
        latitude,
        longitude,
        locationData.accuracy || 0,
        locationData.address || ''
      );

      console.log('📍 Location update transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('❌ Failed to update location:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  // Read Functions
  async getTourist(touristId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const tourist = await this.contract.getTourist(touristId);
      
      return {
        success: true,
        data: {
          id: tourist.id.toString(),
          walletAddress: tourist.walletAddress,
          digitalId: tourist.digitalId,
          firstName: tourist.firstName,
          lastName: tourist.lastName,
          passportNumber: tourist.passportNumber,
          nationality: tourist.nationality,
          phoneNumber: tourist.phoneNumber,
          emergencyContact: tourist.emergencyContact,
          isActive: tourist.isActive,
          registrationTime: new Date(tourist.registrationTime.toNumber() * 1000),
          lastLocationUpdate: tourist.lastLocationUpdate.toNumber() > 0 
            ? new Date(tourist.lastLocationUpdate.toNumber() * 1000) 
            : null
        }
      };

    } catch (error) {
      console.error('❌ Failed to get tourist:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  async getSOSAlert(alertId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const alert = await this.contract.getSOSAlert(alertId);
      
      return {
        success: true,
        data: {
          id: alert.id.toString(),
          touristId: alert.touristId.toString(),
          alertType: this.parseAlertType(alert.alertType),
          severity: this.parseSeverity(alert.severity),
          status: this.parseStatus(alert.status),
          message: alert.message,
          latitude: alert.latitude.toNumber() / 1000000,
          longitude: alert.longitude.toNumber() / 1000000,
          locationAddress: alert.locationAddress,
          timestamp: new Date(alert.timestamp.toNumber() * 1000),
          acknowledgedBy: alert.acknowledgedBy !== ethers.constants.AddressZero ? alert.acknowledgedBy : null,
          acknowledgedAt: alert.acknowledgedAt.toNumber() > 0 ? new Date(alert.acknowledgedAt.toNumber() * 1000) : null,
          resolvedBy: alert.resolvedBy !== ethers.constants.AddressZero ? alert.resolvedBy : null,
          resolvedAt: alert.resolvedAt.toNumber() > 0 ? new Date(alert.resolvedAt.toNumber() * 1000) : null,
          responseNotes: alert.responseNotes,
          isBlockchainVerified: alert.isBlockchainVerified
        }
      };

    } catch (error) {
      console.error('❌ Failed to get SOS alert:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  async getAllActiveAlerts() {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const activeAlertIds = await this.contract.getAllActiveAlerts();
      const activeAlerts = [];

      for (const alertId of activeAlertIds) {
        const alertResult = await this.getSOSAlert(alertId.toString());
        if (alertResult.success) {
          activeAlerts.push(alertResult.data);
        }
      }

      return {
        success: true,
        data: activeAlerts
      };

    } catch (error) {
      console.error('❌ Failed to get active alerts:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  async getPlatformStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const stats = await this.contract.getPlatformStats();
      
      return {
        success: true,
        data: {
          totalTourists: stats.totalTourists.toString(),
          totalAlerts: stats.totalAlerts.toString(),
          activeAlerts: stats.activeAlerts.toString(),
          totalGeofences: stats.totalGeofences.toString(),
          totalViolations: stats.totalViolations.toString()
        }
      };

    } catch (error) {
      console.error('❌ Failed to get platform stats:', error);
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }

  // Event Listening
  startEventListening(callbacks = {}) {
    if (!this.contract || this.isListening) {
      return;
    }

    this.eventCallbacks = callbacks;
    this.isListening = true;

    // SOS Alert triggered
    this.contract.on('SOSAlertTriggered', (alertId, touristId, alertType, severity, event) => {
      console.log('🚨 New SOS Alert detected:', alertId.toString());
      if (this.eventCallbacks.onSOSAlert) {
        this.eventCallbacks.onSOSAlert({
          alertId: alertId.toString(),
          touristId: touristId.toString(),
          alertType: this.parseAlertType(alertType),
          severity: this.parseSeverity(severity),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    // Location updates
    this.contract.on('LocationUpdated', (touristId, latitude, longitude, timestamp, event) => {
      console.log('📍 Location update detected for tourist:', touristId.toString());
      if (this.eventCallbacks.onLocationUpdate) {
        this.eventCallbacks.onLocationUpdate({
          touristId: touristId.toString(),
          latitude: latitude.toNumber() / 1000000,
          longitude: longitude.toNumber() / 1000000,
          timestamp: new Date(timestamp.toNumber() * 1000),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    // Geofence violations
    this.contract.on('GeofenceViolation', (violationId, touristId, geofenceId, event) => {
      console.log('⚠️ Geofence violation detected:', violationId.toString());
      if (this.eventCallbacks.onGeofenceViolation) {
        this.eventCallbacks.onGeofenceViolation({
          violationId: violationId.toString(),
          touristId: touristId.toString(),
          geofenceId: geofenceId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    });

    console.log('✅ Event listening started');
  }

  stopEventListening() {
    if (this.contract && this.isListening) {
      this.contract.removeAllListeners();
      this.isListening = false;
      this.eventCallbacks = {};
      console.log('✅ Event listening stopped');
    }
  }

  // Utility Functions
  getAlertTypeEnum(type) {
    const types = {
      'SOS': 0,
      'PANIC': 1,
      'EMERGENCY': 2,
      'GEOFENCE': 3,
      'SAFETY_CHECK': 4
    };
    return types[type] || 0;
  }

  getSeverityEnum(severity) {
    const severities = {
      'LOW': 0,
      'MEDIUM': 1,
      'HIGH': 2,
      'CRITICAL': 3
    };
    return severities[severity] || 1;
  }

  parseAlertType(type) {
    const types = ['SOS', 'PANIC', 'EMERGENCY', 'GEOFENCE', 'SAFETY_CHECK'];
    return types[type] || 'UNKNOWN';
  }

  parseSeverity(severity) {
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    return severities[severity] || 'UNKNOWN';
  }

  parseStatus(status) {
    const statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];
    return statuses[status] || 'UNKNOWN';
  }

  parseError(error) {
    if (error.reason) {
      return error.reason;
    }
    if (error.message) {
      return error.message;
    }
    return 'Transaction failed';
  }

  // Get contract status
  getConnectionStatus() {
    return {
      hasProvider: !!this.provider,
      hasContract: !!this.contract,
      hasWallet: !!this.signer,
      account: this.account,
      isListening: this.isListening
    };
  }

  // Embedded ABI for critical functions (fallback)
  getEmbeddedABI() {
    return [
      "function registerTourist(string memory digitalId, string memory firstName, string memory lastName, string memory passportNumber, string memory nationality, string memory phoneNumber, string memory emergencyContact) external returns (uint256)",
      "function triggerSOSAlert(uint8 alertType, uint8 severity, string memory message, int256 latitude, int256 longitude, string memory locationAddress) external returns (uint256)",
      "function acknowledgeAlert(uint256 alertId, string memory notes) external",
      "function resolveAlert(uint256 alertId, string memory resolutionNotes) external",
      "function updateLocation(int256 latitude, int256 longitude, uint256 accuracy, string memory locationAddress) external",
      "function getTourist(uint256 touristId) external view returns (tuple(uint256 id, address walletAddress, string digitalId, string firstName, string lastName, string passportNumber, string nationality, string phoneNumber, string emergencyContact, bool isActive, uint256 registrationTime, uint256 lastLocationUpdate))",
      "function getSOSAlert(uint256 alertId) external view returns (tuple(uint256 id, uint256 touristId, uint8 alertType, uint8 severity, uint8 status, string message, int256 latitude, int256 longitude, string locationAddress, uint256 timestamp, address acknowledgedBy, uint256 acknowledgedAt, address resolvedBy, uint256 resolvedAt, string responseNotes, bool isBlockchainVerified))",
      "function getAllActiveAlerts() external view returns (uint256[])",
      "function getPlatformStats() external view returns (tuple(uint256 totalTourists, uint256 totalAlerts, uint256 activeAlerts, uint256 totalGeofences, uint256 totalViolations))",
      "event SOSAlertTriggered(uint256 indexed alertId, uint256 indexed touristId, uint8 alertType, uint8 severity)",
      "event LocationUpdated(uint256 indexed touristId, int256 latitude, int256 longitude, uint256 timestamp)",
      "event GeofenceViolation(uint256 indexed violationId, uint256 indexed touristId, uint256 indexed geofenceId)",
      "event TouristRegistered(uint256 indexed touristId, address indexed walletAddress, string digitalId)"
    ];
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;