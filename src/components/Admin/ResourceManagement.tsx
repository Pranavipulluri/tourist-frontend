import React, { useEffect, useState } from 'react';

interface ResourceUnit {
  id: string;
  type: 'POLICE_PATROL' | 'MEDICAL_UNIT' | 'TOURIST_POLICE' | 'EMERGENCY_RESPONSE' | 'VOLUNTEER_GROUP';
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'EMERGENCY_DEPLOYED';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  coverage: {
    radius: number;
    zones: string[];
  };
  capacity: {
    current: number;
    maximum: number;
  };
  equipment: string[];
  contactInfo: {
    radio: string;
    phone: string;
    officer: string;
  };
  currentAssignment?: {
    type: 'PATROL' | 'INCIDENT_RESPONSE' | 'TOURIST_ASSISTANCE' | 'EMERGENCY';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignedAt: string;
    eta?: string;
  };
  responseHistory: Array<{
    incidentId: string;
    type: string;
    responseTime: number;
    resolution: string;
    timestamp: string;
  }>;
}

interface MedicalFacility {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'EMERGENCY_CENTER';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance: number;
  contact: {
    phone: string;
    emergency: string;
  };
  facilities: string[];
  availability: {
    beds: number;
    ambulances: number;
    specialists: string[];
  };
  languages: string[];
  rating: number;
}

interface PatrolRecommendation {
  id: string;
  area: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  recommendedUnits: number;
  timeSlots: string[];
  reasoning: string;
  touristDensity: number;
  crimeHistory: number;
  weatherConditions?: string;
}

export const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<ResourceUnit[]>([]);
  const [medicalFacilities, setMedicalFacilities] = useState<MedicalFacility[]>([]);
  const [patrolRecommendations, setPatrolRecommendations] = useState<PatrolRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'medical' | 'patrol' | 'deployment'>('resources');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState<ResourceUnit | null>(null);

  useEffect(() => {
    loadResourceData();
  }, []);

  const loadResourceData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive resource data
      const mockResources: ResourceUnit[] = [
        {
          id: '1',
          type: 'POLICE_PATROL',
          name: 'Delhi Police Unit Alpha-1',
          status: 'AVAILABLE',
          location: {
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'India Gate Area, New Delhi'
          },
          coverage: {
            radius: 2000,
            zones: ['India Gate', 'Rajpath', 'Central Delhi']
          },
          capacity: {
            current: 2,
            maximum: 4
          },
          equipment: ['Radio', 'First Aid', 'GPS Tracker', 'Tourist Guide'],
          contactInfo: {
            radio: 'ALPHA-1-DELHI',
            phone: '+91-11-23456789',
            officer: 'Inspector Sharma'
          },
          responseHistory: [
            {
              incidentId: 'INC001',
              type: 'Tourist Assistance',
              responseTime: 8,
              resolution: 'Directions provided',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              incidentId: 'INC002',
              type: 'Theft Report',
              responseTime: 12,
              resolution: 'FIR filed',
              timestamp: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        },
        {
          id: '2',
          type: 'TOURIST_POLICE',
          name: 'Tourist Help Desk - CP',
          status: 'BUSY',
          location: {
            latitude: 28.6315,
            longitude: 77.2167,
            address: 'Connaught Place, New Delhi'
          },
          coverage: {
            radius: 1500,
            zones: ['Connaught Place', 'Janpath', 'Central Market']
          },
          capacity: {
            current: 6,
            maximum: 6
          },
          equipment: ['Multi-language Support', 'Tourist Maps', 'Emergency Kits', 'Communication Device'],
          contactInfo: {
            radio: 'TOURIST-CP-1',
            phone: '+91-11-23987654',
            officer: 'Sub-Inspector Patel'
          },
          currentAssignment: {
            type: 'TOURIST_ASSISTANCE',
            description: 'Helping lost tourists find accommodation',
            priority: 'MEDIUM',
            assignedAt: new Date(Date.now() - 1800000).toISOString(),
            eta: new Date(Date.now() + 900000).toISOString()
          },
          responseHistory: [
            {
              incidentId: 'INC003',
              type: 'Lost Tourist',
              responseTime: 5,
              resolution: 'Tourist safely guided to hotel',
              timestamp: new Date(Date.now() - 1800000).toISOString()
            }
          ]
        },
        {
          id: '3',
          type: 'EMERGENCY_RESPONSE',
          name: 'Emergency Response Team Delta',
          status: 'EMERGENCY_DEPLOYED',
          location: {
            latitude: 28.6506,
            longitude: 77.2334,
            address: 'Chandni Chowk Area, Delhi'
          },
          coverage: {
            radius: 3000,
            zones: ['Old Delhi', 'Chandni Chowk', 'Red Fort Area']
          },
          capacity: {
            current: 4,
            maximum: 4
          },
          equipment: ['Medical Kit', 'Emergency Equipment', 'Communication', 'Transport Vehicle'],
          contactInfo: {
            radio: 'DELTA-EMERGENCY',
            phone: '+91-11-22334455',
            officer: 'Inspector Kumar'
          },
          currentAssignment: {
            type: 'EMERGENCY',
            description: 'Responding to tourist emergency alert',
            priority: 'CRITICAL',
            assignedAt: new Date(Date.now() - 300000).toISOString()
          },
          responseHistory: [
            {
              incidentId: 'INC004',
              type: 'Medical Emergency',
              responseTime: 6,
              resolution: 'Tourist transported to hospital',
              timestamp: new Date(Date.now() - 300000).toISOString()
            }
          ]
        },
        {
          id: '4',
          type: 'VOLUNTEER_GROUP',
          name: 'Delhi Tourism Volunteers',
          status: 'AVAILABLE',
          location: {
            latitude: 28.6562,
            longitude: 77.2410,
            address: 'Red Fort Area, Delhi'
          },
          coverage: {
            radius: 1000,
            zones: ['Red Fort', 'Jama Masjid', 'Chandni Chowk']
          },
          capacity: {
            current: 8,
            maximum: 12
          },
          equipment: ['Tourist Information', 'First Aid Basic', 'Mobile Phones', 'Language Support'],
          contactInfo: {
            radio: 'VOLUNTEER-RF',
            phone: '+91-11-33445566',
            officer: 'Coordinator Singh'
          },
          responseHistory: [
            {
              incidentId: 'INC005',
              type: 'Tourist Guidance',
              responseTime: 3,
              resolution: 'Information provided',
              timestamp: new Date(Date.now() - 1200000).toISOString()
            }
          ]
        }
      ];

      const mockMedicalFacilities: MedicalFacility[] = [
        {
          id: '1',
          name: 'All India Institute of Medical Sciences (AIIMS)',
          type: 'HOSPITAL',
          location: {
            latitude: 28.5672,
            longitude: 77.2100,
            address: 'Ansari Nagar, New Delhi'
          },
          distance: 5.2,
          contact: {
            phone: '+91-11-26588500',
            emergency: '+91-11-26588700'
          },
          facilities: ['Emergency Care', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
          availability: {
            beds: 45,
            ambulances: 8,
            specialists: ['Emergency Medicine', 'Surgery', 'Cardiology', 'Neurology']
          },
          languages: ['English', 'Hindi', 'Urdu'],
          rating: 4.8
        },
        {
          id: '2',
          name: 'Safdarjung Hospital',
          type: 'HOSPITAL',
          location: {
            latitude: 28.5705,
            longitude: 77.2066,
            address: 'Safdarjung Enclave, New Delhi'
          },
          distance: 3.8,
          contact: {
            phone: '+91-11-26165060',
            emergency: '+91-11-26165000'
          },
          facilities: ['Emergency Care', 'Trauma Center', 'ICU', 'Blood Bank'],
          availability: {
            beds: 32,
            ambulances: 5,
            specialists: ['Emergency Medicine', 'Trauma Surgery', 'Orthopedics']
          },
          languages: ['English', 'Hindi'],
          rating: 4.5
        },
        {
          id: '3',
          name: 'Apollo Pharmacy - CP',
          type: 'PHARMACY',
          location: {
            latitude: 28.6315,
            longitude: 77.2167,
            address: 'Connaught Place, New Delhi'
          },
          distance: 1.2,
          contact: {
            phone: '+91-11-23341234',
            emergency: '+91-11-23341234'
          },
          facilities: ['Prescription Medicines', 'OTC Drugs', 'First Aid Supplies'],
          availability: {
            beds: 0,
            ambulances: 0,
            specialists: ['Pharmacist', 'Health Consultant']
          },
          languages: ['English', 'Hindi', 'Punjabi'],
          rating: 4.2
        }
      ];

      const mockPatrolRecommendations: PatrolRecommendation[] = [
        {
          id: '1',
          area: 'Chandni Chowk Market Area',
          priority: 'HIGH',
          riskFactors: ['High tourist density', 'Pickpocket incidents', 'Crowded narrow lanes'],
          recommendedUnits: 3,
          timeSlots: ['10:00-12:00', '14:00-16:00', '18:00-20:00'],
          reasoning: 'Peak tourist hours with historical incident data showing increased risk',
          touristDensity: 85,
          crimeHistory: 12
        },
        {
          id: '2',
          area: 'India Gate Evening Area',
          priority: 'MEDIUM',
          riskFactors: ['Evening crowds', 'Vehicle congestion', 'Street vendors'],
          recommendedUnits: 2,
          timeSlots: ['17:00-21:00'],
          reasoning: 'Evening gathering spot requires crowd management and tourist safety',
          touristDensity: 70,
          crimeHistory: 3
        },
        {
          id: '3',
          area: 'Karol Bagh Shopping District',
          priority: 'MEDIUM',
          riskFactors: ['Tourist shopping area', 'Traffic congestion', 'Fraud reports'],
          recommendedUnits: 2,
          timeSlots: ['11:00-13:00', '15:00-19:00'],
          reasoning: 'Commercial area with tourist shoppers, requires fraud prevention',
          touristDensity: 60,
          crimeHistory: 8
        }
      ];

      setResources(mockResources);
      setMedicalFacilities(mockMedicalFacilities);
      setPatrolRecommendations(mockPatrolRecommendations);
    } catch (err: any) {
      setError('Failed to load resource data');
      console.error('Resource loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deployResource = async (resourceId: string, assignment: any) => {
    try {
      const updatedResources = resources.map(resource => 
        resource.id === resourceId 
          ? { 
              ...resource, 
              status: 'BUSY' as const, 
              currentAssignment: {
                ...assignment,
                assignedAt: new Date().toISOString()
              }
            }
          : resource
      );
      setResources(updatedResources);
    } catch (err) {
      setError('Failed to deploy resource');
      console.error('Resource deployment error:', err);
    }
  };

  const getStatusColor = (status: ResourceUnit['status']) => {
    switch (status) {
      case 'AVAILABLE': return '#4CAF50';
      case 'BUSY': return '#FF9800';
      case 'OFFLINE': return '#757575';
      case 'EMERGENCY_DEPLOYED': return '#F44336';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#757575';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = filterType === 'ALL' || resource.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || resource.status === filterStatus;
    return matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="resource-management">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading resource management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-management">
      <div className="resource-header">
        <h2>🚔 Authority Resource Management</h2>
        <p>Real-time monitoring and deployment of police, medical, and emergency resources</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="resource-tabs">
        <button
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          🚔 Response Units ({resources.filter(r => r.status === 'AVAILABLE').length} Available)
        </button>
        <button
          className={`tab-button ${activeTab === 'medical' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          🏥 Medical Facilities ({medicalFacilities.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'patrol' ? 'active' : ''}`}
          onClick={() => setActiveTab('patrol')}
        >
          📋 Patrol Recommendations ({patrolRecommendations.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'deployment' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployment')}
        >
          🎯 Live Deployment
        </button>
      </div>

      {activeTab === 'resources' && (
        <div className="resources-content">
          <div className="resource-controls">
            <div className="filters">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Types</option>
                <option value="POLICE_PATROL">Police Patrol</option>
                <option value="TOURIST_POLICE">Tourist Police</option>
                <option value="EMERGENCY_RESPONSE">Emergency Response</option>
                <option value="MEDICAL_UNIT">Medical Unit</option>
                <option value="VOLUNTEER_GROUP">Volunteer Group</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="OFFLINE">Offline</option>
                <option value="EMERGENCY_DEPLOYED">Emergency</option>
              </select>
            </div>

            <div className="resource-stats">
              <div className="stat-card">
                <h4>Available Units</h4>
                <span className="stat-value">{resources.filter(r => r.status === 'AVAILABLE').length}</span>
              </div>
              <div className="stat-card">
                <h4>Deployed</h4>
                <span className="stat-value">{resources.filter(r => r.status === 'BUSY' || r.status === 'EMERGENCY_DEPLOYED').length}</span>
              </div>
              <div className="stat-card">
                <h4>Response Time Avg</h4>
                <span className="stat-value">8.5 min</span>
              </div>
            </div>
          </div>

          <div className="resources-grid">
            {filteredResources.map(resource => (
              <div 
                key={resource.id}
                className={`resource-card ${selectedResource?.id === resource.id ? 'selected' : ''}`}
                onClick={() => setSelectedResource(resource)}
              >
                <div className="resource-header">
                  <div className="resource-name">
                    <h4>{resource.name}</h4>
                    <span className="resource-type">{resource.type.replace('_', ' ')}</span>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(resource.status) }}
                  >
                    {resource.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="resource-location">
                  <p><strong>Location:</strong> {resource.location.address}</p>
                  <p><strong>Coverage:</strong> {resource.coverage.radius}m radius</p>
                </div>

                <div className="resource-capacity">
                  <div className="capacity-bar">
                    <div className="capacity-fill" style={{ 
                      width: `${(resource.capacity.current / resource.capacity.maximum) * 100}%` 
                    }}></div>
                  </div>
                  <span className="capacity-text">
                    {resource.capacity.current}/{resource.capacity.maximum} personnel
                  </span>
                </div>

                <div className="resource-contact">
                  <p><strong>Officer:</strong> {resource.contactInfo.officer}</p>
                  <p><strong>Radio:</strong> {resource.contactInfo.radio}</p>
                </div>

                {resource.currentAssignment && (
                  <div className="current-assignment">
                    <h5>Current Assignment</h5>
                    <p>{resource.currentAssignment.description}</p>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(resource.currentAssignment.priority) }}
                    >
                      {resource.currentAssignment.priority}
                    </span>
                  </div>
                )}

                <div className="resource-actions">
                  {resource.status === 'AVAILABLE' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const assignment = {
                          type: 'PATROL',
                          description: 'Tourist area patrol assignment',
                          priority: 'MEDIUM'
                        };
                        deployResource(resource.id, assignment);
                      }}
                      className="deploy-btn"
                    >
                      🎯 Deploy
                    </button>
                  )}
                  <button className="contact-btn">📞 Contact</button>
                  <button className="locate-btn">📍 Locate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="medical-content">
          <div className="medical-header">
            <h3>Nearest Medical Facilities</h3>
            <p>Emergency medical support for tourist incidents</p>
          </div>

          <div className="medical-grid">
            {medicalFacilities.map(facility => (
              <div key={facility.id} className="medical-card">
                <div className="medical-header">
                  <div className="facility-name">
                    <h4>{facility.name}</h4>
                    <span className="facility-type">{facility.type}</span>
                  </div>
                  <div className="facility-rating">
                    <span className="rating">⭐ {facility.rating}</span>
                    <span className="distance">{facility.distance} km</span>
                  </div>
                </div>

                <div className="facility-location">
                  <p>{facility.location.address}</p>
                </div>

                <div className="facility-contact">
                  <p><strong>Phone:</strong> {facility.contact.phone}</p>
                  <p><strong>Emergency:</strong> {facility.contact.emergency}</p>
                </div>

                <div className="facility-availability">
                  <h5>Current Availability</h5>
                  {facility.availability.beds > 0 && (
                    <p>🛏️ Beds: {facility.availability.beds}</p>
                  )}
                  {facility.availability.ambulances > 0 && (
                    <p>🚑 Ambulances: {facility.availability.ambulances}</p>
                  )}
                  <p>🗣️ Languages: {facility.languages.join(', ')}</p>
                </div>

                <div className="facility-services">
                  <h5>Services</h5>
                  <div className="services-list">
                    {facility.facilities.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>

                <div className="facility-specialists">
                  <h5>Specialists Available</h5>
                  <div className="specialists-list">
                    {facility.availability.specialists.map((specialist, index) => (
                      <span key={index} className="specialist-tag">{specialist}</span>
                    ))}
                  </div>
                </div>

                <div className="facility-actions">
                  <button className="call-btn">📞 Call</button>
                  <button className="directions-btn">🗺️ Directions</button>
                  <button className="book-btn">📋 Request Bed</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'patrol' && (
        <div className="patrol-content">
          <div className="patrol-header">
            <h3>AI-Powered Patrol Recommendations</h3>
            <p>Proactive patrolling suggestions based on tourist density and risk analysis</p>
          </div>

          <div className="patrol-grid">
            {patrolRecommendations.map(recommendation => (
              <div key={recommendation.id} className="patrol-card">
                <div className="patrol-header">
                  <div className="area-name">
                    <h4>{recommendation.area}</h4>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
                    >
                      {recommendation.priority} PRIORITY
                    </span>
                  </div>
                </div>

                <div className="patrol-metrics">
                  <div className="metric">
                    <span className="metric-label">Tourist Density</span>
                    <span className="metric-value">{recommendation.touristDensity}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Recent Incidents</span>
                    <span className="metric-value">{recommendation.crimeHistory}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Recommended Units</span>
                    <span className="metric-value">{recommendation.recommendedUnits}</span>
                  </div>
                </div>

                <div className="risk-factors">
                  <h5>Risk Factors</h5>
                  <div className="factors-list">
                    {recommendation.riskFactors.map((factor, index) => (
                      <span key={index} className="risk-factor">{factor}</span>
                    ))}
                  </div>
                </div>

                <div className="time-slots">
                  <h5>Recommended Time Slots</h5>
                  <div className="slots-list">
                    {recommendation.timeSlots.map((slot, index) => (
                      <span key={index} className="time-slot">{slot}</span>
                    ))}
                  </div>
                </div>

                <div className="reasoning">
                  <h5>AI Reasoning</h5>
                  <p>{recommendation.reasoning}</p>
                </div>

                <div className="patrol-actions">
                  <button className="deploy-patrol-btn">🎯 Deploy Patrol</button>
                  <button className="schedule-btn">📅 Schedule</button>
                  <button className="modify-btn">✏️ Modify</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="deployment-content">
          <div className="deployment-header">
            <h3>Live Deployment Dashboard</h3>
            <p>Real-time resource allocation and incident response coordination</p>
          </div>

          <div className="deployment-map">
            <div className="map-container" style={{ height: '500px', backgroundColor: '#f0f0f0' }}>
              <div className="map-placeholder">
                <p>🗺️ Live Deployment Map</p>
                <p>Real-time tracking of all deployed units and incidents</p>
                <div className="map-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                    Available Units
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
                    Deployed Units
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
                    Emergency Response
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#9C27B0' }}></span>
                    Medical Facilities
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="active-deployments">
            <h4>Active Deployments</h4>
            <div className="deployments-list">
              {resources.filter(r => r.currentAssignment).map(resource => (
                <div key={resource.id} className="deployment-item">
                  <div className="deployment-info">
                    <h5>{resource.name}</h5>
                    <p>{resource.currentAssignment?.description}</p>
                    <span className="deployment-time">
                      Deployed: {resource.currentAssignment && new Date(resource.currentAssignment.assignedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="deployment-status">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(resource.currentAssignment?.priority || 'LOW') }}
                    >
                      {resource.currentAssignment?.priority}
                    </span>
                    {resource.currentAssignment?.eta && (
                      <span className="eta">ETA: {new Date(resource.currentAssignment.eta).toLocaleTimeString()}</span>
                    )}
                  </div>
                  <div className="deployment-actions">
                    <button className="update-btn">📝 Update</button>
                    <button className="recall-btn">🔄 Recall</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedResource && (
        <div className="resource-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedResource.name} - Detailed Information</h3>
              <button onClick={() => setSelectedResource(null)} className="close-modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="details-section">
                  <h4>Unit Information</h4>
                  <p><strong>Type:</strong> {selectedResource.type.replace('_', ' ')}</p>
                  <p><strong>Status:</strong> {selectedResource.status.replace('_', ' ')}</p>
                  <p><strong>Officer in Charge:</strong> {selectedResource.contactInfo.officer}</p>
                  <p><strong>Radio Call Sign:</strong> {selectedResource.contactInfo.radio}</p>
                  <p><strong>Phone:</strong> {selectedResource.contactInfo.phone}</p>
                </div>

                <div className="details-section">
                  <h4>Location & Coverage</h4>
                  <p><strong>Current Location:</strong> {selectedResource.location.address}</p>
                  <p><strong>Coverage Radius:</strong> {selectedResource.coverage.radius} meters</p>
                  <p><strong>Coverage Zones:</strong> {selectedResource.coverage.zones.join(', ')}</p>
                </div>

                <div className="details-section">
                  <h4>Capacity & Equipment</h4>
                  <p><strong>Personnel:</strong> {selectedResource.capacity.current}/{selectedResource.capacity.maximum}</p>
                  <p><strong>Equipment:</strong></p>
                  <ul>
                    {selectedResource.equipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="details-section">
                  <h4>Response History</h4>
                  {selectedResource.responseHistory.map((response, index) => (
                    <div key={index} className="response-item">
                      <p><strong>{response.type}</strong></p>
                      <p>Response Time: {response.responseTime} minutes</p>
                      <p>Resolution: {response.resolution}</p>
                      <p>Time: {new Date(response.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="action-btn primary">📞 Contact Unit</button>
              <button className="action-btn">📍 Track Location</button>
              <button className="action-btn">🎯 Deploy Mission</button>
              <button className="action-btn">📊 View Analytics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
