import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationHistory = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Debounce timer ref
  const debounceTimer = useRef(null);

  const fetchNotifications = useCallback(async (page = currentPage, filterParams = filters, limit = rowsPerPage) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page,
        limit: limit,
        ...filterParams
      });

      const response = await api.get(`/api/notifications/history?${params}`);

      // console.log('Notification API Response:', response.data); // Debug log

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setTotalPages(response.data.data.pages);
        setTotalNotifications(response.data.data.total);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in to view notifications.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view notifications.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, rowsPerPage, token, user]);

  // Initial load effect
  useEffect(() => {
    if (token && user) {
      fetchNotifications();
    } else {
      setLoading(false);
      setError('Please log in to view notifications.');
    }
  }, [token, user]);

  // Debounced filter effect
  useEffect(() => {
    if (token && user) {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer for debounced API call
      debounceTimer.current = setTimeout(() => {
        fetchNotifications(1, filters, rowsPerPage);
        setCurrentPage(1);
      }, 300); // 300ms debounce delay

      // Cleanup function
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [filters, token, user]);

  // Page change effect
  useEffect(() => {
    if (token && user && currentPage > 1) {
      fetchNotifications(currentPage, filters, rowsPerPage);
    }
  }, [currentPage, token, user]);

  // Rows per page change effect
  useEffect(() => {
    if (token && user) {
      fetchNotifications(1, filters, rowsPerPage);
      setCurrentPage(1);
    }
  }, [rowsPerPage, token, user]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const getTypeColor = useCallback((type) => {
    const colors = {
      email: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      sms: 'bg-purple-100 text-purple-800',
      reminder: 'bg-yellow-100 text-yellow-800',
      confirmation: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleString();
  }, []);

  // Memoized table row component
  const NotificationRow = React.memo(({ notification, getStatusColor, getTypeColor, formatDate }) => (
    <tr className="hover:bg-white/5 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-dark-100">
          {notification.clientId ? 
            `${notification.clientId.name} ${notification.clientId.surname}` : 
            'N/A'
          }
        </div>
        <div className="text-sm text-dark-400">
          {notification.clientId?.email || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
          {notification.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
          {notification.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-dark-100 max-w-xs truncate">
          {notification.message}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
        {notification.createdBy?.username || 'System'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
        {formatDate(notification.createdAt)}
      </td>
    </tr>
  ));

  // Memoized pagination handlers
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handleRowsPerPageChange = useCallback((value) => {
    setRowsPerPage(parseInt(value));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v11l-4-4H4z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Notification History
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Track and manage all sent notifications
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/notifications/send')}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Send New Notification</span>
            </button>
          </div>
        </div>

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

        {/* Filters */}
        <div className="card-glass p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="reminder">Reminder</option>
                <option value="confirmation">Confirmation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="card p-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v11l-4-4H4z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  No notifications found
                </h3>
              </div>
              <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                No notifications match your current filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-100">
                  Showing {notifications.length} of {totalNotifications} notifications
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-dark-300">Rows per page:</label>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => handleRowsPerPageChange(e.target.value)}
                      className="input-field w-20 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div className="text-sm text-dark-300">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sent By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {notifications.map((notification) => (
                      <NotificationRow
                        key={notification._id}
                        notification={notification}
                        getStatusColor={getStatusColor}
                        getTypeColor={getTypeColor}
                        formatDate={formatDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(totalPages > 1 || totalNotifications > rowsPerPage) && (
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                      </button>
                      <span className="text-sm text-dark-300 px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-dark-400">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalNotifications)} of {totalNotifications} entries
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;