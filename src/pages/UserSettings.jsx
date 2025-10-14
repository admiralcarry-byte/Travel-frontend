import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ResponsiveCard from '../components/ResponsiveCard';
import ResponsiveGrid from '../components/ResponsiveGrid';
import api from '../utils/api';

const UserSettings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme, setLightTheme, setDarkTheme, applySystemTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    timezone: 'UTC'
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification preferences - DISABLED
  // const [notifications, setNotifications] = useState({
  //   emailNotifications: true,
  //   pushNotifications: true,
  //   smsNotifications: false,
  //   marketingEmails: false
  // });

  const tabs = [
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'security', 
      name: 'Security', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    // { id: 'notifications', name: 'Notifications', icon: '🔔' }, // DISABLED
    // { id: 'preferences', name: 'Preferences', icon: '⚙️' }
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC'
      });
    }
  }, [user]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.put('/api/auth/profile', profileData);
      updateUser(response.data.data.user);
      showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match.', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showMessage('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('Failed to update password. Please check your current password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Notification submit handler - DISABLED
  // const handleNotificationSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   
  //   try {
  //     await axios.put('/api/users/notifications', notifications);
  //     showMessage('Notification preferences updated!', 'success');
  //   } catch (error) {
  //     console.error('Error updating notifications:', error);
  //     showMessage('Failed to update notification preferences.', 'error');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">User Settings</h1>
        <p className="text-dark-300">Manage your account preferences and settings</p>
      </div>

      {message.text && (
        <div className={`notification ${
          message.type === 'success' 
            ? 'border-success-500/30 text-success-400'
            : 'border-error-500/30 text-error-400'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`icon-container ${
              message.type === 'success' ? 'bg-success-500' : 'bg-error-500'
            }`}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
            </div>
            <span className="font-medium text-lg">{message.text}</span>
          </div>
        </div>
      )}

      <div className="card">
        {/* Tab Navigation */}
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-dark-400 hover:text-dark-300 hover:border-white/20'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-dark-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark-200 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark-200 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-dark-200 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-dark-200 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                    className="input-field"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-dark-200 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-dark-200 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-200 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications tab - DISABLED */}
          {/* {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in your browser</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.smsNotifications}
                    onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Marketing Emails</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive marketing and promotional emails</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketingEmails}
                    onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Notifications'}
                </button>
              </div>
            </form>
          )} */}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-dark-100 mb-4">Theme Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-dark-200">Current Theme</h4>
                      <p className="text-sm text-dark-400">Currently using {theme} theme</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={setLightTheme}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          theme === 'light' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={setDarkTheme}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          theme === 'dark' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={applySystemTheme}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          theme === 'system' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                        }`}
                      >
                        System
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;