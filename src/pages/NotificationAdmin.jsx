import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const NotificationAdmin = () => {
  const [cronStatus, setCronStatus] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [testForm, setTestForm] = useState({
    email: '',
    phone: ''
  });

  const [manualNotification, setManualNotification] = useState({
    clientId: '',
    saleId: '',
    type: 'custom',
    subject: '',
    emailContent: '',
    whatsappContent: ''
  });

  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchCronStatus();
    fetchServiceStatus();
    fetchClients();
    fetchSales();
  }, []);

  const fetchCronStatus = async () => {
    try {
      const response = await api.get('/api/notifications/cron/status');

      if (response.data.success) {
        setCronStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
    }
  };

  const fetchServiceStatus = async () => {
    try {
      const response = await api.get('/api/notifications/service-status');

      if (response.data.success) {
        setServiceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients?limit=100');

      if (response.data.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await api.get('/api/sales?limit=100');

      if (response.data.success) {
        setSales(response.data.data.sales);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    }
  };

  const handleTestNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTestResults(null);

    try {
      const response = await api.post('/api/notifications/test', testForm);

      if (response.data.success) {
        setTestResults(response.data.data);
        setSuccess('Test notification sent successfully!');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCronJob = async (jobType) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/notifications/cron/trigger', {
        jobType
      });

      if (response.data.success) {
        setSuccess(`Cron job '${jobType}' triggered successfully!`);
        fetchCronStatus(); // Refresh status
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to trigger cron job');
    } finally {
      setLoading(false);
    }
  };

  const handleSendManualNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/notifications/send', manualNotification);

      if (response.data.success) {
        setSuccess('Manual notification sent successfully!');
        setManualNotification({
          clientId: '',
          saleId: '',
          type: 'custom',
          subject: '',
          emailContent: '',
          whatsappContent: ''
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send manual notification');
    } finally {
      setLoading(false);
    }
  };

  const createTestNotification = async () => {
    if (clients.length === 0) {
      setError('No clients available for test notification');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const testNotification = {
        clientId: clients[0]._id,
        type: 'custom',
        subject: 'Test Notification - ' + new Date().toLocaleString(),
        emailContent: 'This is a test notification sent from the admin panel.',
        whatsappContent: 'Test notification from admin panel.'
      };

      const response = await api.post('/api/notifications/send', testNotification);

      if (response.data.success) {
        setSuccess('Test notification created successfully!');
      } else {
        setError(response.data.message || 'Failed to create test notification');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      setError(error.response?.data?.message || 'Failed to create test notification');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { value: 'custom', label: 'Custom' },
    { value: 'trip_reminder', label: 'Trip Reminder' },
    { value: 'return_notification', label: 'Return Notification' },
    { value: 'passport_expiry', label: 'Passport Expiry' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Administration</h1>
          <p className="text-gray-600 mt-2">Manage notification system and send manual notifications</p>
          <div className="mt-4">
            <button
              onClick={createTestNotification}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Test Notification'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        {/* Service Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Service Status</h2>
          
          {serviceStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  serviceStatus.sendGrid.configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {serviceStatus.sendGrid.configured ? '✅ Configured' : '⚠️ Mock Mode'}
                </div>
                <p className="text-sm text-gray-600 mt-2">SendGrid Email</p>
                <p className="text-xs text-gray-500">{serviceStatus.sendGrid.fromEmail}</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  serviceStatus.twilio.configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {serviceStatus.twilio.configured ? '✅ Configured' : '⚠️ Mock Mode'}
                </div>
                <p className="text-sm text-gray-600 mt-2">Twilio WhatsApp</p>
                <p className="text-xs text-gray-500">{serviceStatus.twilio.whatsappFrom}</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  serviceStatus.mode === 'production' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {serviceStatus.mode === 'production' ? '🚀 Production' : '🔧 Development'}
                </div>
                <p className="text-sm text-gray-600 mt-2">Mode</p>
                <p className="text-xs text-gray-500">
                  {serviceStatus.mode === 'production' ? 'Real notifications' : 'Mock notifications'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          )}
        </div>

        {/* Cron Job Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cron Job Status</h2>
          
          {cronStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  cronStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {cronStatus.isRunning ? '✅ Running' : '❌ Stopped'}
                </div>
                <p className="text-sm text-gray-600 mt-2">Overall Status</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{cronStatus.jobsCount}</div>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {cronStatus.jobs.filter(job => job.running).length}
                </div>
                <p className="text-sm text-gray-600">Running Jobs</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleTriggerCronJob('trip_reminder')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Trigger Trip Reminder Job
            </button>
            <button
              onClick={() => handleTriggerCronJob('return_notification')}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Trigger Return Notification Job
            </button>
            <button
              onClick={() => handleTriggerCronJob('passport_expiry')}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Trigger Passport Expiry Job
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Notification */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Notification</h2>
            
            <form onSubmit={handleTestNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email
                </label>
                <input
                  type="email"
                  value={testForm.email}
                  onChange={(e) => setTestForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="test@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={testForm.phone}
                  onChange={(e) => setTestForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+1234567890"
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!testForm.email && !testForm.phone)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </button>
            </form>

            {testResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test Results:</h3>
                <div className="text-sm text-gray-600">
                  {testResults.email && (
                    <div className="mb-2">
                      <strong>Email:</strong> {testResults.email.success ? '✅ Sent' : '❌ Failed'}
                      {testResults.email.error && <span className="text-red-600"> - {testResults.email.error}</span>}
                    </div>
                  )}
                  {testResults.whatsapp && (
                    <div>
                      <strong>WhatsApp:</strong> {testResults.whatsapp.success ? '✅ Sent' : '❌ Failed'}
                      {testResults.whatsapp.error && <span className="text-red-600"> - {testResults.whatsapp.error}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Notification */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Manual Notification</h2>
            
            <form onSubmit={handleSendManualNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={manualNotification.clientId}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.surname} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale (Optional)
                </label>
                <select
                  value={manualNotification.saleId}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, saleId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No sale</option>
                  {sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      Sale #{sale.id} - ${sale.totalSalePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={manualNotification.type}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={manualNotification.subject}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Notification subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  value={manualNotification.emailContent}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, emailContent: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Email content (HTML supported)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Content
                </label>
                <textarea
                  value={manualNotification.whatsappContent}
                  onChange={(e) => setManualNotification(prev => ({ ...prev, whatsappContent: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="WhatsApp message content"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white shadow rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Jobs</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Trip Reminder:</strong> Every hour - Sends reminders 72 hours before trip</li>
                <li>• <strong>Return Notification:</strong> Every hour - Sends welcome back messages</li>
                <li>• <strong>Passport Expiry:</strong> Daily at 9 AM - Sends passport expiry reminders</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Types</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Email:</strong> Via SendGrid API</li>
                <li>• <strong>WhatsApp:</strong> Via Twilio API</li>
                <li>• <strong>Client Preferences:</strong> Respects individual notification settings</li>
                <li>• <strong>History Tracking:</strong> All notifications are logged</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationAdmin;