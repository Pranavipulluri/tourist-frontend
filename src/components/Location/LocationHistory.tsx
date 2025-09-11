import React, { useState, useEffect } from 'react';
import { apiService, Location } from '../../services/api';
import { Header } from '../Layout/Header';
import './Location.css';

export const LocationHistory: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLocations();
  }, [filter]);

  const loadLocations = async (pageNum = 0) => {
    try {
      setLoading(pageNum === 0);
      
      const limit = 50;
      const offset = pageNum * limit;
      
      const response = await apiService.getLocationHistory(limit, offset);
      
      if (pageNum === 0) {
        setLocations(response.locations);
      } else {
        setLocations(prev => [...prev, ...response.locations]);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load location history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLocations(page + 1);
    }
  };

  const getFilteredLocations = () => {
    const now = new Date();
    
    switch (filter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return locations.filter(loc => new Date(loc.timestamp) >= today);
      
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return locations.filter(loc => new Date(loc.timestamp) >= weekAgo);
      
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return locations.filter(loc => new Date(loc.timestamp) >= monthAgo);
      
      default:
        return locations;
    }
  };

  const filteredLocations = getFilteredLocations();

  return (
    <div className="location-history-page">
      <Header />
      
      <div className="location-container">
        <div className="location-header">
          <h1>📍 Location History</h1>
          <p>View your location tracking history and analytics</p>
        </div>

        <div className="location-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
          <button
            className={`filter-button ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-button ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-button ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
        </div>

        <div className="location-stats">
          <div className="stat-card">
            <h3>{filteredLocations.length}</h3>
            <p>Total Locations</p>
          </div>
          <div className="stat-card">
            <h3>
              {filteredLocations.length > 0 
                ? Math.round(filteredLocations.reduce((acc, loc) => acc + loc.accuracy, 0) / filteredLocations.length)
                : 0}m
            </h3>
            <p>Avg Accuracy</p>
          </div>
          <div className="stat-card">
            <h3>
              {filteredLocations.length > 0 
                ? new Date(filteredLocations[0].timestamp).toLocaleDateString()
                : 'N/A'
              }
            </h3>
            <p>Last Update</p>
          </div>
        </div>

        {loading && page === 0 ? (
          <div className="location-loading">
            <span className="spinner large"></span>
            <p>Loading location history...</p>
          </div>
        ) : (
          <div className="location-list">
            {filteredLocations.length === 0 ? (
              <div className="no-locations">
                <span className="no-locations-icon">📍</span>
                <h3>No locations found</h3>
                <p>No location data available for the selected time period</p>
              </div>
            ) : (
              <>
                {filteredLocations.map((location, index) => (
                  <div key={location.id} className="location-item">
                    <div className="location-icon">📍</div>
                    <div className="location-details">
                      <div className="location-coordinates">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </div>
                      {location.address && (
                        <div className="location-address">{location.address}</div>
                      )}
                      <div className="location-meta">
                        <span className="location-time">
                          {new Date(location.timestamp).toLocaleString()}
                        </span>
                        <span className="location-accuracy">
                          ±{Math.round(location.accuracy)}m accuracy
                        </span>
                      </div>
                    </div>
                    <div className="location-actions">
                      <button 
                        className="action-button"
                        onClick={() => window.open(`https://maps.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                      >
                        🗺️ View on Map
                      </button>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button
                    className={`load-more-button ${loading ? 'loading' : ''}`}
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner small"></span>
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};