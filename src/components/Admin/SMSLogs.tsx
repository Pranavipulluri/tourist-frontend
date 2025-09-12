import React, { useEffect, useState } from 'react';

interface SMSLog {
  id: string;
  touristId: string;
  touristName: string;
  phoneNumber: string;
  messageType: 'ALERT' | 'NOTIFICATION' | 'EMERGENCY' | 'SAFETY_TIP' | 'WELCOME' | 'REMINDER';
  message: string;
  originalLanguage: string;
  translatedLanguage?: string;
  translatedMessage?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  provider: 'TWILIO' | 'AWS_SNS' | 'LOCAL_SMS';
  cost: number;
  response?: string;
  automationTriggerId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface SMSTemplate {
  id: string;
  name: string;
  type: SMSLog['messageType'];
  template: string;
  variables: string[];
  languages: string[];
  isActive: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'ZONE_ENTRY' | 'ZONE_EXIT' | 'SOS_ALERT' | 'INACTIVITY' | 'WEATHER_WARNING' | 'SCHEDULE';
  conditions: any;
  template: string;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

export const SMSLogs: React.FC = () => {
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'templates' | 'automation' | 'analytics'>('logs');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('24h');

  useEffect(() => {
    loadSMSData();
  }, [dateRange]);

  const loadSMSData = async () => {
    try {
      setLoading(true);
      
      // Mock SMS logs data
      const mockLogs: SMSLog[] = [
        {
          id: '1',
          touristId: 'tourist_001',
          touristName: 'Rahul Sharma',
          phoneNumber: '+91-9876543210',
          messageType: 'EMERGENCY',
          message: 'EMERGENCY ALERT: Your location shows you may be in danger. Please confirm your safety status. Reply SAFE if you are okay. Police assistance: 100',
          originalLanguage: 'en',
          translatedLanguage: 'hi',
          translatedMessage: 'आपातकालीन चेतावनी: आपका स्थान दिखाता है कि आप खतरे में हो सकते हैं। कृपया अपनी सुरक्षा स्थिति की पुष्टि करें। यदि आप ठीक हैं तो SAFE का उत्तर दें। पुलिस सहायता: 100',
          status: 'DELIVERED',
          sentAt: new Date(Date.now() - 1800000).toISOString(),
          deliveredAt: new Date(Date.now() - 1798000).toISOString(),
          provider: 'TWILIO',
          cost: 0.05,
          response: 'SAFE',
          priority: 'CRITICAL',
          automationTriggerId: 'auto_001'
        },
        {
          id: '2',
          touristId: 'tourist_002',
          touristName: 'Priya Patel',
          phoneNumber: '+91-9876543211',
          messageType: 'ALERT',
          message: 'SAFETY ALERT: You are entering a high-risk zone. Please stay alert and avoid isolated areas. Tourist helpline: 1363',
          originalLanguage: 'en',
          status: 'DELIVERED',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          deliveredAt: new Date(Date.now() - 3598000).toISOString(),
          readAt: new Date(Date.now() - 3500000).toISOString(),
          provider: 'AWS_SNS',
          cost: 0.03,
          priority: 'HIGH',
          automationTriggerId: 'auto_002'
        },
        {
          id: '3',
          touristId: 'tourist_003',
          touristName: 'David Johnson',
          phoneNumber: '+1-555-0123',
          messageType: 'SAFETY_TIP',
          message: 'Daily Safety Tip: Keep copies of important documents separate from originals. Store digital copies in cloud storage. Have a great day exploring!',
          originalLanguage: 'en',
          status: 'SENT',
          sentAt: new Date(Date.now() - 7200000).toISOString(),
          provider: 'TWILIO',
          cost: 0.02,
          priority: 'LOW',
          automationTriggerId: 'auto_003'
        },
        {
          id: '4',
          touristId: 'tourist_004',
          touristName: 'Maria Garcia',
          phoneNumber: '+34-666-123456',
          messageType: 'NOTIFICATION',
          message: 'Weather Alert: Heavy rain expected in your area. Carry umbrella and avoid outdoor activities. Stay safe!',
          originalLanguage: 'en',
          translatedLanguage: 'es',
          translatedMessage: 'Alerta meteorológica: Se esperan lluvias intensas en su área. Lleve paraguas y evite actividades al aire libre. ¡Manténgase seguro!',
          status: 'FAILED',
          sentAt: new Date(Date.now() - 10800000).toISOString(),
          provider: 'LOCAL_SMS',
          cost: 0.01,
          response: 'DELIVERY_FAILED',
          priority: 'MEDIUM'
        }
      ];

      const mockTemplates: SMSTemplate[] = [
        {
          id: '1',
          name: 'Emergency Alert',
          type: 'EMERGENCY',
          template: 'EMERGENCY ALERT: Your location shows you may be in danger. Please confirm your safety status. Reply SAFE if okay. Police: {emergency_number}',
          variables: ['emergency_number'],
          languages: ['en', 'hi', 'es', 'fr'],
          isActive: true
        },
        {
          id: '2',
          name: 'Zone Entry Alert',
          type: 'ALERT',
          template: 'SAFETY ALERT: You are entering {zone_type}. {zone_message} Tourist helpline: {helpline_number}',
          variables: ['zone_type', 'zone_message', 'helpline_number'],
          languages: ['en', 'hi'],
          isActive: true
        },
        {
          id: '3',
          name: 'Daily Safety Tip',
          type: 'SAFETY_TIP',
          template: 'Daily Safety Tip: {tip_message} Have a great day exploring!',
          variables: ['tip_message'],
          languages: ['en', 'hi', 'es', 'fr', 'de'],
          isActive: true
        }
      ];

      const mockAutomationRules: AutomationRule[] = [
        {
          id: 'auto_001',
          name: 'Emergency SOS Response',
          trigger: 'SOS_ALERT',
          conditions: { priority: 'CRITICAL' },
          template: 'Emergency Alert',
          isActive: true,
          lastTriggered: new Date(Date.now() - 1800000).toISOString(),
          triggerCount: 15
        },
        {
          id: 'auto_002',
          name: 'High Risk Zone Entry',
          trigger: 'ZONE_ENTRY',
          conditions: { zoneType: 'HIGH_RISK_ZONE' },
          template: 'Zone Entry Alert',
          isActive: true,
          lastTriggered: new Date(Date.now() - 3600000).toISOString(),
          triggerCount: 8
        },
        {
          id: 'auto_003',
          name: 'Daily Safety Tips',
          trigger: 'SCHEDULE',
          conditions: { time: '09:00', timezone: 'Asia/Kolkata' },
          template: 'Daily Safety Tip',
          isActive: true,
          lastTriggered: new Date(Date.now() - 7200000).toISOString(),
          triggerCount: 150
        }
      ];

      setSmsLogs(mockLogs);
      setTemplates(mockTemplates);
      setAutomationRules(mockAutomationRules);
    } catch (err: any) {
      setError('Failed to load SMS data');
      console.error('SMS data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendManualSMS = async (touristId: string, templateId: string, variables: Record<string, string>) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      let message = template.template;
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
      });

      const newLog: SMSLog = {
        id: Date.now().toString(),
        touristId,
        touristName: 'Selected Tourist',
        phoneNumber: '+91-XXXXXXXXXX',
        messageType: template.type,
        message,
        originalLanguage: 'en',
        status: 'SENT',
        sentAt: new Date().toISOString(),
        provider: 'TWILIO',
        cost: 0.03,
        priority: 'MEDIUM'
      };

      setSmsLogs([newLog, ...smsLogs]);
    } catch (err) {
      setError('Failed to send SMS');
      console.error('SMS sending error:', err);
    }
  };

  const getStatusColor = (status: SMSLog['status']) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'SENT': return '#2196F3';
      case 'DELIVERED': return '#4CAF50';
      case 'FAILED': return '#F44336';
      case 'READ': return '#8BC34A';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: SMSLog['priority']) => {
    switch (priority) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#757575';
    }
  };

  const filteredLogs = smsLogs.filter(log => {
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesType = filterType === 'ALL' || log.messageType === filterType;
    const matchesSearch = searchTerm === '' || 
      log.touristName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.phoneNumber.includes(searchTerm) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getSMSAnalytics = () => {
    const total = smsLogs.length;
    const delivered = smsLogs.filter(log => log.status === 'DELIVERED').length;
    const failed = smsLogs.filter(log => log.status === 'FAILED').length;
    const totalCost = smsLogs.reduce((sum, log) => sum + log.cost, 0);
    const deliveryRate = total > 0 ? (delivered / total * 100).toFixed(1) : '0';

    return { total, delivered, failed, totalCost, deliveryRate };
  };

  if (loading) {
    return (
      <div className="sms-logs">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading SMS management system...</p>
        </div>
      </div>
    );
  }

  const analytics = getSMSAnalytics();

  return (
    <div className="sms-logs">
      <div className="sms-header">
        <h2>📱 SMS & Communication Management</h2>
        <p>Monitor SMS delivery, manage templates, and configure automation rules</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="sms-analytics-summary">
        <div className="analytics-cards">
          <div className="analytics-card">
            <h4>Total SMS</h4>
            <span className="analytics-value">{analytics.total}</span>
          </div>
          <div className="analytics-card">
            <h4>Delivery Rate</h4>
            <span className="analytics-value">{analytics.deliveryRate}%</span>
          </div>
          <div className="analytics-card">
            <h4>Failed</h4>
            <span className="analytics-value">{analytics.failed}</span>
          </div>
          <div className="analytics-card">
            <h4>Total Cost</h4>
            <span className="analytics-value">${analytics.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="sms-tabs">
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 SMS Logs ({filteredLogs.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📝 Templates ({templates.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          🤖 Automation ({automationRules.filter(r => r.isActive).length})
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="sms-logs-content">
          <div className="logs-controls">
            <div className="search-filters">
              <input
                type="text"
                placeholder="Search by tourist name, phone, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="READ">Read</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="type-filter"
              >
                <option value="ALL">All Types</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="ALERT">Alert</option>
                <option value="NOTIFICATION">Notification</option>
                <option value="SAFETY_TIP">Safety Tip</option>
                <option value="WELCOME">Welcome</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="date-filter"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="logs-grid">
            {filteredLogs.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-header">
                  <div className="log-tourist">
                    <h4>{log.touristName}</h4>
                    <span className="phone-number">{log.phoneNumber}</span>
                  </div>
                  <div className="log-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(log.priority) }}
                    >
                      {log.priority}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(log.status) }}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>

                <div className="log-content">
                  <div className="message-type">
                    <span className="type-badge">{log.messageType}</span>
                    {log.automationTriggerId && <span className="auto-badge">AUTO</span>}
                  </div>
                  <p className="message-text">{log.message}</p>
                  {log.translatedMessage && (
                    <div className="translated-message">
                      <strong>Translated ({log.translatedLanguage}):</strong>
                      <p>{log.translatedMessage}</p>
                    </div>
                  )}
                </div>

                <div className="log-details">
                  <div className="log-timing">
                    <span>Sent: {new Date(log.sentAt).toLocaleString()}</span>
                    {log.deliveredAt && (
                      <span>Delivered: {new Date(log.deliveredAt).toLocaleString()}</span>
                    )}
                    {log.readAt && (
                      <span>Read: {new Date(log.readAt).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="log-meta">
                    <span>Provider: {log.provider}</span>
                    <span>Cost: ${log.cost}</span>
                    {log.response && <span>Response: {log.response}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="templates-content">
          <div className="templates-header">
            <h3>SMS Templates</h3>
            <button className="create-template-btn">➕ Create Template</button>
          </div>
          
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h4>{template.name}</h4>
                  <div className="template-badges">
                    <span className="type-badge">{template.type}</span>
                    <span className={`active-badge ${template.isActive ? 'active' : 'inactive'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="template-content">
                  <p className="template-text">{template.template}</p>
                  <div className="template-variables">
                    <strong>Variables:</strong> {template.variables.join(', ')}
                  </div>
                  <div className="template-languages">
                    <strong>Languages:</strong> {template.languages.join(', ')}
                  </div>
                </div>

                <div className="template-actions">
                  <button className="edit-template-btn">✏️ Edit</button>
                  <button className="test-template-btn">🧪 Test</button>
                  <button className={`toggle-template-btn ${template.isActive ? 'deactivate' : 'activate'}`}>
                    {template.isActive ? '❌ Deactivate' : '✅ Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="automation-content">
          <div className="automation-header">
            <h3>Automation Rules</h3>
            <button className="create-rule-btn">➕ Create Rule</button>
          </div>
          
          <div className="automation-grid">
            {automationRules.map(rule => (
              <div key={rule.id} className="automation-card">
                <div className="automation-header">
                  <h4>{rule.name}</h4>
                  <div className="automation-badges">
                    <span className="trigger-badge">{rule.trigger.replace('_', ' ')}</span>
                    <span className={`active-badge ${rule.isActive ? 'active' : 'inactive'}`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="automation-content">
                  <div className="automation-stats">
                    <span>Triggers: {rule.triggerCount}</span>
                    {rule.lastTriggered && (
                      <span>Last: {new Date(rule.lastTriggered).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="automation-conditions">
                    <strong>Conditions:</strong> {JSON.stringify(rule.conditions)}
                  </div>
                  <div className="automation-template">
                    <strong>Template:</strong> {rule.template}
                  </div>
                </div>

                <div className="automation-actions">
                  <button className="edit-rule-btn">✏️ Edit</button>
                  <button className="test-rule-btn">🧪 Test</button>
                  <button className={`toggle-rule-btn ${rule.isActive ? 'deactivate' : 'activate'}`}>
                    {rule.isActive ? '❌ Disable' : '✅ Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <h3>SMS Analytics & Reports</h3>
          
          <div className="analytics-charts">
            <div className="chart-container">
              <h4>Delivery Status Distribution</h4>
              <div className="chart-placeholder">
                <p>📊 Chart showing SMS delivery status breakdown</p>
                <div className="chart-data">
                  <div>Delivered: {analytics.delivered}</div>
                  <div>Failed: {analytics.failed}</div>
                  <div>Pending: {smsLogs.filter(l => l.status === 'PENDING').length}</div>
                </div>
              </div>
            </div>
            
            <div className="chart-container">
              <h4>Message Types</h4>
              <div className="chart-placeholder">
                <p>📈 Chart showing message type distribution</p>
                <div className="chart-data">
                  {Object.entries(
                    smsLogs.reduce((acc, log) => {
                      acc[log.messageType] = (acc[log.messageType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type}>{type}: {count}</div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="chart-container">
              <h4>Cost Analysis</h4>
              <div className="chart-placeholder">
                <p>💰 Cost breakdown by provider and time</p>
                <div className="chart-data">
                  <div>Total Cost: ${analytics.totalCost.toFixed(2)}</div>
                  <div>Average Cost: ${(analytics.totalCost / analytics.total).toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};