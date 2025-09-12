import React, { useEffect, useState } from 'react';
import './ComplianceLogs.css';

interface ComplianceLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  resource: 'TOURIST_DATA' | 'LOCATION_DATA' | 'ALERT_DATA' | 'FIR_DATA' | 'SMS_LOGS' | 'SYSTEM_CONFIG';
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blockchainHash?: string;
  auditTrail: {
    previousValue?: any;
    newValue?: any;
    changeReason?: string;
  };
}

interface BlockchainRecord {
  id: string;
  blockHash: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  recordType: 'USER_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_EVENT' | 'SECURITY_ALERT';
  data: any;
  verified: boolean;
  gasUsed: number;
  minerAddress: string;
}

interface DataAccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterOrganization: string;
  requestedData: string[];
  purpose: string;
  duration: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvalConditions?: string[];
}

export const ComplianceLogs: React.FC = () => {
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([]);
  const [accessRequests, setAccessRequests] = useState<DataAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'blockchain' | 'requests' | 'reports'>('logs');
  const [filterUser, setFilterUser] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [dateRange, setDateRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComplianceData();
  }, [dateRange]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive compliance data
      const mockLogs: ComplianceLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          userId: 'admin_001',
          userName: 'Inspector Kumar',
          userRole: 'ADMIN',
          action: 'VIEW',
          resource: 'TOURIST_DATA',
          resourceId: 'tourist_123',
          details: 'Viewed tourist profile for emergency response coordination',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          riskLevel: 'LOW',
          blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890',
          auditTrail: {}
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: 'officer_002',
          userName: 'Sub-Inspector Patel',
          userRole: 'OFFICER',
          action: 'EDIT',
          resource: 'FIR_DATA',
          resourceId: 'fir_456',
          details: 'Updated FIR status from PENDING to UNDER_INVESTIGATION',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          riskLevel: 'MEDIUM',
          blockchainHash: '0x2b3c4d5e6f7890abcdef1234567890ab',
          auditTrail: {
            previousValue: { status: 'PENDING' },
            newValue: { status: 'UNDER_INVESTIGATION' },
            changeReason: 'Investigation team assigned'
          }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: 'analyst_003',
          userName: 'Data Analyst Singh',
          userRole: 'ANALYST',
          action: 'EXPORT',
          resource: 'LOCATION_DATA',
          details: 'Exported location analytics for weekly report generation',
          ipAddress: '192.168.1.110',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          riskLevel: 'HIGH',
          blockchainHash: '0x3c4d5e6f7890abcdef1234567890abcd',
          auditTrail: {
            changeReason: 'Scheduled weekly analytics report'
          }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          userId: 'unknown_004',
          userName: 'Unknown User',
          userRole: 'UNAUTHORIZED',
          action: 'VIEW',
          resource: 'TOURIST_DATA',
          details: 'Unauthorized access attempt to tourist database',
          ipAddress: '203.0.113.45',
          userAgent: 'Python-urllib/3.8',
          success: false,
          riskLevel: 'CRITICAL',
          auditTrail: {}
        }
      ];

      const mockBlockchainRecords: BlockchainRecord[] = [
        {
          id: '1',
          blockHash: '0x1a2b3c4d5e6f7890abcdef1234567890',
          transactionHash: '0xabcdef1234567890abcdef1234567890',
          blockNumber: 15847392,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          recordType: 'USER_ACCESS',
          data: {
            userId: 'admin_001',
            action: 'VIEW_TOURIST_DATA',
            resourceId: 'tourist_123',
            authorized: true
          },
          verified: true,
          gasUsed: 21000,
          minerAddress: '0x742d35Cc6634C0532925a3b8D75C49c1a'
        },
        {
          id: '2',
          blockHash: '0x2b3c4d5e6f7890abcdef1234567890ab',
          transactionHash: '0xbcdef1234567890abcdef1234567890a',
          blockNumber: 15847393,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          recordType: 'DATA_MODIFICATION',
          data: {
            userId: 'officer_002',
            action: 'UPDATE_FIR',
            resourceId: 'fir_456',
            changes: {
              status: { from: 'PENDING', to: 'UNDER_INVESTIGATION' }
            }
          },
          verified: true,
          gasUsed: 45000,
          minerAddress: '0x742d35Cc6634C0532925a3b8D75C49c1b'
        },
        {
          id: '3',
          blockHash: '0x3c4d5e6f7890abcdef1234567890abcd',
          transactionHash: '0xcdef1234567890abcdef1234567890ab',
          blockNumber: 15847394,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          recordType: 'SECURITY_ALERT',
          data: {
            alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            ipAddress: '203.0.113.45',
            userAgent: 'Python-urllib/3.8',
            blocked: true
          },
          verified: true,
          gasUsed: 32000,
          minerAddress: '0x742d35Cc6634C0532925a3b8D75C49c1c'
        }
      ];

      const mockAccessRequests: DataAccessRequest[] = [
        {
          id: '1',
          requesterId: 'researcher_001',
          requesterName: 'Dr. Sharma',
          requesterOrganization: 'Delhi University Tourism Research',
          requestedData: ['Tourist Movement Patterns', 'Safety Incident Statistics'],
          purpose: 'Academic research on tourist safety patterns in Delhi',
          duration: '6 months',
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          requesterId: 'ministry_002',
          requesterName: 'Joint Secretary Tourism',
          requesterOrganization: 'Ministry of Tourism, Government of India',
          requestedData: ['Aggregate Safety Statistics', 'Zone Risk Assessment'],
          purpose: 'Policy formulation for tourist safety guidelines',
          duration: '12 months',
          status: 'APPROVED',
          requestedAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          reviewedBy: 'Chief Administrator',
          approvalConditions: ['Data anonymization required', 'No individual identification', 'Quarterly usage reports']
        },
        {
          id: '3',
          requesterId: 'media_003',
          requesterName: 'News Reporter',
          requesterOrganization: 'Delhi Today News',
          requestedData: ['Individual Tourist Incident Details'],
          purpose: 'News reporting on tourist safety incidents',
          duration: '1 month',
          status: 'REJECTED',
          requestedAt: new Date(Date.now() - 259200000).toISOString(),
          reviewedAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedBy: 'Legal Officer'
        }
      ];

      setComplianceLogs(mockLogs);
      setBlockchainRecords(mockBlockchainRecords);
      setAccessRequests(mockAccessRequests);
    } catch (err: any) {
      setError('Failed to load compliance data');
      console.error('Compliance data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyBlockchainRecord = async (recordId: string) => {
    try {
      // Mock blockchain verification
      const updatedRecords = blockchainRecords.map(record => 
        record.id === recordId ? { ...record, verified: true } : record
      );
      setBlockchainRecords(updatedRecords);
    } catch (err) {
      setError('Failed to verify blockchain record');
      console.error('Blockchain verification error:', err);
    }
  };

  const reviewAccessRequest = async (requestId: string, decision: 'APPROVED' | 'REJECTED', conditions?: string[]) => {
    try {
      const updatedRequests = accessRequests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: decision,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Current Admin',
              approvalConditions: conditions
            }
          : request
      );
      setAccessRequests(updatedRequests);
    } catch (err) {
      setError('Failed to review access request');
      console.error('Access request review error:', err);
    }
  };

  const getRiskLevelColor = (level: ComplianceLog['riskLevel']) => {
    switch (level) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: DataAccessRequest['status']) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'APPROVED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      case 'EXPIRED': return '#757575';
      default: return '#757575';
    }
  };

  const filteredLogs = complianceLogs.filter(log => {
    const matchesUser = filterUser === 'ALL' || log.userRole === filterUser;
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesRisk = filterRisk === 'ALL' || log.riskLevel === filterRisk;
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesUser && matchesAction && matchesRisk && matchesSearch;
  });

  if (loading) {
    return (
      <div className="compliance-logs">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading compliance management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-logs">
      <div className="compliance-header">
        <h2>📝 Audit & Compliance Management</h2>
        <p>Comprehensive audit trails with blockchain-based immutable records</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="compliance-stats">
        <div className="stats-cards">
          <div className="stat-card">
            <h4>Total Logs</h4>
            <span className="stat-value">{complianceLogs.length}</span>
          </div>
          <div className="stat-card">
            <h4>Critical Events</h4>
            <span className="stat-value">{complianceLogs.filter(l => l.riskLevel === 'CRITICAL').length}</span>
          </div>
          <div className="stat-card">
            <h4>Blockchain Records</h4>
            <span className="stat-value">{blockchainRecords.length}</span>
          </div>
          <div className="stat-card">
            <h4>Access Requests</h4>
            <span className="stat-value">{accessRequests.filter(r => r.status === 'PENDING').length} Pending</span>
          </div>
        </div>
      </div>

      <div className="compliance-tabs">
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Audit Logs ({filteredLogs.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'blockchain' ? 'active' : ''}`}
          onClick={() => setActiveTab('blockchain')}
        >
          ⛓️ Blockchain Records ({blockchainRecords.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          🔒 Data Access Requests ({accessRequests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Compliance Reports
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="audit-logs-content">
          <div className="logs-controls">
            <div className="filters-section">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Users</option>
                <option value="ADMIN">Admin</option>
                <option value="OFFICER">Officer</option>
                <option value="ANALYST">Analyst</option>
                <option value="UNAUTHORIZED">Unauthorized</option>
              </select>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Actions</option>
                <option value="VIEW">View</option>
                <option value="EDIT">Edit</option>
                <option value="DELETE">Delete</option>
                <option value="EXPORT">Export</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="filter-select"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>Risk Level</th>
                  <th>Success</th>
                  <th>Blockchain</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`log-row ${!log.success ? 'failed' : ''}`}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <div className="user-info">
                        <strong>{log.userName}</strong>
                        <span className="user-role">{log.userRole}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`action-badge ${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="resource-info">
                        <span>{log.resource.replace('_', ' ')}</span>
                        {log.resourceId && <small>{log.resourceId}</small>}
                      </div>
                    </td>
                    <td className="details-cell">
                      <span title={log.details}>
                        {log.details.length > 50 ? `${log.details.substring(0, 50)}...` : log.details}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="risk-badge"
                        style={{ backgroundColor: getRiskLevelColor(log.riskLevel) }}
                      >
                        {log.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`success-indicator ${log.success ? 'success' : 'failed'}`}>
                        {log.success ? '✅' : '❌'}
                      </span>
                    </td>
                    <td>
                      {log.blockchainHash ? (
                        <span className="blockchain-hash" title={log.blockchainHash}>
                          ⛓️ {log.blockchainHash.substring(0, 10)}...
                        </span>
                      ) : (
                        <span className="no-blockchain">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'blockchain' && (
        <div className="blockchain-content">
          <div className="blockchain-header">
            <h3>Blockchain Audit Trail</h3>
            <p>Immutable records stored on blockchain for transparency and verification</p>
          </div>

          <div className="blockchain-stats">
            <div className="blockchain-stat">
              <span className="stat-label">Total Blocks</span>
              <span className="stat-value">{blockchainRecords.length}</span>
            </div>
            <div className="blockchain-stat">
              <span className="stat-label">Verified Records</span>
              <span className="stat-value">{blockchainRecords.filter(r => r.verified).length}</span>
            </div>
            <div className="blockchain-stat">
              <span className="stat-label">Gas Used</span>
              <span className="stat-value">{blockchainRecords.reduce((sum, r) => sum + r.gasUsed, 0)}</span>
            </div>
          </div>

          <div className="blockchain-records">
            {blockchainRecords.map(record => (
              <div key={record.id} className="blockchain-record">
                <div className="record-header">
                  <div className="block-info">
                    <h4>Block #{record.blockNumber}</h4>
                    <span className="record-type">{record.recordType.replace('_', ' ')}</span>
                  </div>
                  <div className="verification-status">
                    {record.verified ? (
                      <span className="verified">✅ Verified</span>
                    ) : (
                      <button 
                        onClick={() => verifyBlockchainRecord(record.id)}
                        className="verify-btn"
                      >
                        🔍 Verify
                      </button>
                    )}
                  </div>
                </div>

                <div className="record-details">
                  <div className="hash-info">
                    <p><strong>Block Hash:</strong> <code>{record.blockHash}</code></p>
                    <p><strong>Transaction Hash:</strong> <code>{record.transactionHash}</code></p>
                  </div>
                  
                  <div className="transaction-info">
                    <p><strong>Timestamp:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                    <p><strong>Gas Used:</strong> {record.gasUsed}</p>
                    <p><strong>Miner:</strong> <code>{record.minerAddress}</code></p>
                  </div>

                  <div className="record-data">
                    <h5>Record Data</h5>
                    <pre className="data-preview">
                      {JSON.stringify(record.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="access-requests-content">
          <div className="requests-header">
            <h3>Data Access Requests</h3>
            <p>Manage external requests for tourist data access</p>
          </div>

          <div className="requests-grid">
            {accessRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="requester-info">
                    <h4>{request.requesterName}</h4>
                    <p>{request.requesterOrganization}</p>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
                  <div className="requested-data">
                    <h5>Requested Data</h5>
                    <ul>
                      {request.requestedData.map((data, index) => (
                        <li key={index}>{data}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="request-purpose">
                    <h5>Purpose</h5>
                    <p>{request.purpose}</p>
                  </div>

                  <div className="request-duration">
                    <h5>Duration</h5>
                    <p>{request.duration}</p>
                  </div>

                  <div className="request-timeline">
                    <p><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
                    {request.reviewedAt && (
                      <p><strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}</p>
                    )}
                    {request.reviewedBy && (
                      <p><strong>Reviewed By:</strong> {request.reviewedBy}</p>
                    )}
                  </div>

                  {request.approvalConditions && (
                    <div className="approval-conditions">
                      <h5>Approval Conditions</h5>
                      <ul>
                        {request.approvalConditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <div className="request-actions">
                    <button 
                      onClick={() => reviewAccessRequest(request.id, 'APPROVED', [
                        'Data anonymization required',
                        'Usage monitoring enabled',
                        'Monthly compliance reports required'
                      ])}
                      className="approve-btn"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => reviewAccessRequest(request.id, 'REJECTED')}
                      className="reject-btn"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="reports-content">
          <div className="reports-header">
            <h3>Compliance Reports & Analytics</h3>
            <p>Generate and download compliance reports</p>
          </div>

          <div className="reports-grid">
            <div className="report-card">
              <h4>Data Access Summary</h4>
              <p>Weekly summary of all data access activities</p>
              <div className="report-stats">
                <span>Total Accesses: {complianceLogs.filter(l => l.action === 'VIEW').length}</span>
                <span>Unauthorized Attempts: {complianceLogs.filter(l => !l.success).length}</span>
              </div>
              <button className="generate-report-btn">📊 Generate Report</button>
            </div>

            <div className="report-card">
              <h4>Security Incidents Report</h4>
              <p>Detailed analysis of security incidents and responses</p>
              <div className="report-stats">
                <span>Critical Incidents: {complianceLogs.filter(l => l.riskLevel === 'CRITICAL').length}</span>
                <span>Resolution Rate: 85%</span>
              </div>
              <button className="generate-report-btn">🔒 Generate Report</button>
            </div>

            <div className="report-card">
              <h4>Blockchain Integrity Report</h4>
              <p>Verification status of blockchain records</p>
              <div className="report-stats">
                <span>Verified Blocks: {blockchainRecords.filter(r => r.verified).length}</span>
                <span>Integrity: 100%</span>
              </div>
              <button className="generate-report-btn">⛓️ Generate Report</button>
            </div>

            <div className="report-card">
              <h4>Data Usage Analytics</h4>
              <p>Analysis of data usage patterns and trends</p>
              <div className="report-stats">
                <span>Most Accessed: Tourist Data</span>
                <span>Peak Hours: 10:00-16:00</span>
              </div>
              <button className="generate-report-btn">📈 Generate Report</button>
            </div>
          </div>

          <div className="compliance-charts">
            <div className="chart-container">
              <h4>Access Patterns Over Time</h4>
              <div className="chart-placeholder">
                <p>📊 Time-series chart showing data access patterns</p>
                <div className="chart-data">
                  <div>Today: {complianceLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length} accesses</div>
                  <div>This Week: {complianceLogs.length} total accesses</div>
                  <div>Critical Events: {complianceLogs.filter(l => l.riskLevel === 'CRITICAL').length}</div>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h4>User Role Distribution</h4>
              <div className="chart-placeholder">
                <p>🥧 Pie chart showing access by user roles</p>
                <div className="chart-data">
                  {Object.entries(
                    complianceLogs.reduce((acc, log) => {
                      acc[log.userRole] = (acc[log.userRole] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([role, count]) => (
                    <div key={role}>{role}: {count}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
