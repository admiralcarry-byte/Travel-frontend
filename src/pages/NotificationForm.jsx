import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationForm = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const [formData, setFormData] = useState({
    clientId: '',
    saleId: '',
    type: 'custom',
    subject: '',
    emailContent: '',
    whatsappContent: ''
  });

  // Fetch clients and sales on component mount
  useEffect(() => {
    if (token && user) {
      fetchClients();
      fetchSales();
    }
  }, [token, user]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/api/clients?limit=100');
      if (response.data.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch passengers:', error);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const response = await api.get('/api/sales?limit=100');
      if (response.data.success) {
        setSales(response.data.data.sales);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    }
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear success/error messages when user starts typing
    if (success) setSuccess('');
    if (error) setError('');
  }, [success, error]);

  const handleClientChange = useCallback((clientId) => {
    const client = clients.find(c => c._id === clientId);
    setSelectedClient(client);
    handleInputChange('clientId', clientId);
  }, [clients, handleInputChange]);

  const handleSaleChange = useCallback((saleId) => {
    const sale = sales.find(s => s._id === saleId);
    setSelectedSale(sale);
    handleInputChange('saleId', saleId);
  }, [sales, handleInputChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/notifications/send', formData);

      if (response.data.success) {
        setSuccess('Notification sent successfully!');
        // Reset form
        setFormData({
          clientId: '',
          saleId: '',
          type: 'custom',
          subject: '',
          emailContent: '',
          whatsappContent: ''
        });
        setSelectedClient(null);
        setSelectedSale(null);
        
        // Redirect to notification history after 2 seconds
        setTimeout(() => {
          navigate('/notifications/history');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Notification send error:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in to send notifications.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to send notifications.');
      } else {
        setError(error.response?.data?.message || 'Failed to send notification');
      }
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeDescription = (type) => {
    const descriptions = {
      custom: 'Send a custom notification message',
      trip_reminder: 'Remind passenger about upcoming trip',
      return_notification: 'Notify passenger about return date',
      passport_expiry: 'Alert passenger about passport expiry'
    };
    return descriptions[type] || '';
  };

  if (!token || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-dark-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-dark-300">
            Please log in to send notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Send Notification
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Create and send notifications to passengers
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="notification">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-success-500">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-success-400 font-medium text-lg">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="notification">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-error-500">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-error-400 font-medium text-lg">{error}</span>
            </div>
          </div>
        )}

        {/* Notification Form */}
        <div className="card-glass p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Passenger *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a passenger</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} {client.surname} - {client.email}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <div className="mt-2 p-3 bg-dark-700/50 rounded-lg">
                  <p className="text-sm text-dark-300">
                    <strong>Selected Passenger:</strong> {selectedClient.name} {selectedClient.surname}
                  </p>
                  <p className="text-sm text-dark-400">
                    Email: {selectedClient.email} | Phone: {selectedClient.phone || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Sale Selection (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Related Sale (Optional)
              </label>
              <select
                value={formData.saleId}
                onChange={(e) => handleSaleChange(e.target.value)}
                className="input-field"
              >
                <option value="">No related sale</option>
                {sales.map((sale) => (
                  <option key={sale._id} value={sale._id}>
                    Sale #{sale._id.slice(-6)} - {sale.totalSalePrice} - {sale.status}
                  </option>
                ))}
              </select>
              {selectedSale && (
                <div className="mt-2 p-3 bg-dark-700/50 rounded-lg">
                  <p className="text-sm text-dark-300">
                    <strong>Related Sale:</strong> #{selectedSale._id.slice(-6)}
                  </p>
                  <p className="text-sm text-dark-400">
                    Amount: {selectedSale.totalSalePrice} | Status: {selectedSale.status}
                  </p>
                </div>
              )}
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Notification Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="input-field"
                required
              >
                <option value="custom">Custom Notification</option>
                <option value="trip_reminder">Trip Reminder</option>
                <option value="return_notification">Return Notification</option>
                <option value="passport_expiry">Passport Expiry Alert</option>
              </select>
              <p className="text-sm text-dark-400 mt-1">
                {getNotificationTypeDescription(formData.type)}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="input-field"
                placeholder="Enter notification subject"
                required
                maxLength={200}
              />
              <p className="text-sm text-dark-400 mt-1">
                {formData.subject.length}/200 characters
              </p>
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Email Content *
              </label>
              <textarea
                value={formData.emailContent}
                onChange={(e) => handleInputChange('emailContent', e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Enter email message content"
                required
              />
            </div>

            {/* WhatsApp Content */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                WhatsApp Content *
              </label>
              <textarea
                value={formData.whatsappContent}
                onChange={(e) => handleInputChange('whatsappContent', e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Enter WhatsApp message content"
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/notifications/history')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationForm;