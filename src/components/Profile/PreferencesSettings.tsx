import React, { useState } from 'react';

export const PreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState({
    notifications: {
      alerts: true,
      locationUpdates: false,
      deviceStatus: true,
      emergency: true,
    },
    privacy: {
      shareLocation: true,
      dataCollection: false,
      marketingEmails: false,
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'auto',
    },
  });

  const handlePreferenceChange = (category: string, key: string, value: any) => {
    setPreferences((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const savePreferences = async () => {
    try {
      // Note: This endpoint may need to be created in the backend
      // await apiService.api.put('/tourists/preferences', preferences);
      console.log('Preferences saved:', preferences);
      // Show success message
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  return (
    <div className="preferences-settings">
      <div className="section-card">
        <h3>🔔 Notification Preferences</h3>
        <div className="preferences-group">
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <div key={key} className="preference-item">
              <div className="preference-content">
                <h4>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h4>
                <p>Receive {key} notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => handlePreferenceChange('notifications', key, e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h3>🔒 Privacy Settings</h3>
        <div className="preferences-group">
          {Object.entries(preferences.privacy).map(([key, value]) => (
            <div key={key} className="preference-item">
              <div className="preference-content">
                <h4>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h4>
                <p>Allow {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => handlePreferenceChange('privacy', key, e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <button onClick={savePreferences} className="save-button">
        Save Preferences
      </button>
    </div>
  );
};
