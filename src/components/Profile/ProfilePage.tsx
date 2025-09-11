import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Tourist } from '../../services/api';
import { Header } from '../Layout/Header';
import { PreferencesSettings } from './PreferencesSettings';
import './Profile.css';
import { SecuritySettings } from './SecuritySettings';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<Partial<Tourist>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        nationality: user.nationality,
        passportNumber: user.passportNumber,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await apiService.updateProfile(formData);
      updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="profile-info">
            <h1>{user?.firstName} {user?.lastName}</h1>
            <p>{user?.email}</p>
            <span className="profile-id">Tourist ID: {user?.id?.slice(0, 8)}</span>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="section-card">
                <h3>Personal Information</h3>
                
                {message && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="emergencyContact">Emergency Contact</label>
                      <input
                        type="tel"
                        id="emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nationality">Nationality</label>
                      <select
                        id="nationality"
                        name="nationality"
                        value={formData.nationality || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Country</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="IN">India</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="JP">Japan</option>
                        <option value="CN">China</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="passportNumber">Passport Number</label>
                      <input
                        type="text"
                        id="passportNumber"
                        name="passportNumber"
                        value={formData.passportNumber || ''}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`save-button ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner small"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-tab">
              <SecuritySettings />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="preferences-tab">
              <PreferencesSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};