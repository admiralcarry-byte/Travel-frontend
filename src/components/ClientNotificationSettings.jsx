import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ClientNotificationSettings = ({ clientId, onClose }) => {
  const [preferences, setPreferences] = useState({
    email: true,
    whatsapp: true,
    tripReminders: true,
    returnNotifications: true,
    passportExpiry: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchClientPreferences();
    }
  }, [clientId]);

  const fetchClientPreferences = async () => {
    try {
      const response = await api.get(`/api/clients/${clientId}`);

      if (response.data.success && response.data.data.client.notificationPreferences) {
        setPreferences(response.data.data.client.notificationPreferences);
      }
    } catch (error) {
      console.error('Failed to fetch client preferences:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(
        `/api/notifications/clients/${clientId}/notifications`,
        { notificationPreferences: preferences }
      );

      if (response.data.success) {
        setSuccess('Notification preferences updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectAll = (value) => {
    setPreferences({
      email: value,
      whatsapp: value,
      tripReminders: value,
      returnNotifications: value,
      passportExpiry: value
    });
  };

  const allSelected = Object.values(preferences).every(Boolean);
  const someSelected = Object.values(preferences).some(Boolean);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-md mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <label className="text-sm font-medium text-gray-700">
                Select All
              </label>
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            {/* Communication Methods */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Communication Methods</h4>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <label className="text-sm font-medium text-gray-700">WhatsApp Notifications</label>
                  <p className="text-xs text-gray-500">Receive notifications via WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.whatsapp}
                  onChange={(e) => handlePreferenceChange('whatsapp', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Notification Types</h4>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <label className="text-sm font-medium text-gray-700">Trip Reminders</label>
                  <p className="text-xs text-gray-500">72 hours before departure</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.tripReminders}
                  onChange={(e) => handlePreferenceChange('tripReminders', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <label className="text-sm font-medium text-gray-700">Return Notifications</label>
                  <p className="text-xs text-gray-500">Welcome back messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.returnNotifications}
                  onChange={(e) => handlePreferenceChange('returnNotifications', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <label className="text-sm font-medium text-gray-700">Passport Expiry</label>
                  <p className="text-xs text-gray-500">90 days before expiration</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.passportExpiry}
                  onChange={(e) => handlePreferenceChange('passportExpiry', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientNotificationSettings;