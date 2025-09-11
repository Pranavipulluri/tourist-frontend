export const TouristsList: React.FC = () => {
  const [tourists, setTourists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadTourists();
  }, []);

  const loadTourists = async () => {
    try {
      // This would be a new endpoint to get all tourists (admin only)
      const response = await apiService.api.get('/admin/tourists');
      setTourists(response.data.tourists);
    } catch (error) {
      console.error('Failed to load tourists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = tourist.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tourist.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tourist.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && tourist.isActive) ||
                         (statusFilter === 'inactive' && !tourist.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="tourists-list">
      <div className="tourists-header">
        <h3>👥 Registered Tourists</h3>
        <div className="tourists-controls">
          <input
            type="text"
            placeholder="Search tourists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="tourists-loading">
          <span className="spinner"></span>
          Loading tourists...
        </div>
      ) : (
        <div className="tourists-table">
          <div className="table-header">
            <div className="col-name">Name</div>
            <div className="col-contact">Contact</div>
            <div className="col-nationality">Nationality</div>
            <div className="col-status">Status</div>
            <div className="col-last-seen">Last Seen</div>
            <div className="col-actions">Actions</div>
          </div>
          
          {filteredTourists.map(tourist => (
            <div key={tourist.id} className="table-row">
              <div className="col-name">
                <div className="tourist-avatar">
                  {tourist.firstName[0]}{tourist.lastName[0]}
                </div>
                <div className="tourist-info">
                  <span className="tourist-name">
                    {tourist.firstName} {tourist.lastName}
                  </span>
                  <span className="tourist-id">ID: {tourist.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className="col-contact">
                <div>{tourist.email}</div>
                <div>{tourist.phoneNumber}</div>
              </div>
              <div className="col-nationality">
                {tourist.nationality}
              </div>
              <div className="col-status">
                <span className={`status-badge ${tourist.isActive ? 'active' : 'inactive'}`}>
                  {tourist.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="col-last-seen">
                {tourist.lastLocationUpdate ? 
                  new Date(tourist.lastLocationUpdate).toLocaleString() : 
                  'Never'
                }
              </div>
              <div className="col-actions">
                <button className="action-button view">👁️ View</button>
                <button className="action-button track">📍 Track</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};