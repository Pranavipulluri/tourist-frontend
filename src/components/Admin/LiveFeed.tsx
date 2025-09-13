import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

export const LiveFeed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveFeed();

    // Setup real-time updates
    websocketService.on('new_alert', (alert: any) => {
      addFeedItem({
        id: `alert-${Date.now()}`,
        type: 'ALERT',
        message: `New ${alert.type} alert from ${alert.touristName || 'Unknown Tourist'}`,
        data: alert,
        timestamp: new Date().toISOString(),
      });
    });

    websocketService.on('location_updated', (data: any) => {
      addFeedItem({
        id: `location-${Date.now()}`,
        type: 'LOCATION_UPDATE',
        message: `Location updated for tourist ${data.touristName || data.touristId}`,
        data,
        timestamp: new Date().toISOString(),
      });
    });

    return () => {
      websocketService.off('new_alert');
      websocketService.off('location_updated');
    };
  }, []);

  const loadLiveFeed = async () => {
    try {
      const feed = await apiService.getLiveFeed(20);
      // Ensure feed is an array before setting state
      setFeedItems(Array.isArray(feed) ? feed : []);
    } catch (error) {
      console.error('Failed to load live feed:', error);
      // Set empty array on error
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addFeedItem = (item: any) => {
    setFeedItems((prev: any) => {
      // Ensure prev is an array before using slice
      const prevArray = Array.isArray(prev) ? prev : [];
      return [item, ...prevArray.slice(0, 19)]; // Keep only latest 20 items
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return '🚨';
      case 'LOCATION_UPDATE': return '📍';
      case 'DEVICE_STATUS': return '📱';
      case 'SYSTEM_EVENT': return '⚙️';
      default: return 'ℹ️';
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'ALERT': return '#e74c3c';
      case 'LOCATION_UPDATE': return '#3498db';
      case 'DEVICE_STATUS': return '#f39c12';
      case 'SYSTEM_EVENT': return '#95a5a6';
      default: return '#2ecc71';
    }
  };

  return (
    <div className="live-feed">
      <div className="feed-header">
        <h3>📡 Live Activity Feed</h3>
        <div className="feed-status">
          <span className="status-indicator active"></span>
          Real-time
        </div>
      </div>

      {loading ? (
        <div className="feed-loading">
          <span className="spinner"></span>
          Loading feed...
        </div>
      ) : (
        <div className="feed-container">
          {!Array.isArray(feedItems) || feedItems.length === 0 ? (
            <div className="no-feed-items">
              <span className="no-feed-icon">📡</span>
              <p>No recent activity</p>
            </div>
          ) : (
            feedItems.map((item: any) => (
              <div key={item.id} className="feed-item">
                <div 
                  className="feed-icon"
                  style={{ color: getItemColor(item.type) }}
                >
                  {getItemIcon(item.type)}
                </div>
                <div className="feed-content">
                  <p className="feed-message">{item.message}</p>
                  <span className="feed-time">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
