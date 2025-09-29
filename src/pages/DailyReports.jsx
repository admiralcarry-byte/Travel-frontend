import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DailyReport from '../components/DailyReport';

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [todayArrivals, setTodayArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetchTodayArrivals();
    fetchReports();
  }, [filters]);

  const fetchTodayArrivals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/api/daily-reports/today-arrivals?${params.toString()}`);
      
      if (response.data.success) {
        setTodayArrivals(response.data.data.arrivals);
      }
    } catch (error) {
      console.error('Failed to fetch arrivals:', error);
      setError(error.response?.data?.message || 'Failed to fetch arrivals');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: ''
    });
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/api/daily-reports?${params.toString()}`);

      if (response.data.success) {
        setReports(response.data.data.reports);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch daily reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (date) => {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // First, try to fetch existing report for the date
      try {
        const existingResponse = await api.get(`/api/daily-reports/date/${targetDate}`);
        if (existingResponse.data.success) {
          setSelectedReport(existingResponse.data.data.report);
          setSelectedDate(targetDate);
          setShowReport(true);
          fetchReports(); // Refresh the list
          return;
        }
      } catch (fetchError) {
        // If no existing report found, continue to generate new one
        console.log('No existing report found for date:', targetDate);
      }

      // Generate new report if none exists
      const response = await api.post('/api/daily-reports/generate', {
        date: targetDate
      });

      if (response.data.success) {
        setSelectedReport(response.data.data.report);
        setSelectedDate(targetDate);
        setShowReport(true);
        fetchReports(); // Refresh the list
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate daily report');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setSelectedDate(report.reportDate);
    setShowReport(true);
  };

  const handleCloseReport = (dataChanged = false) => {
    setShowReport(false);
    setSelectedReport(null);
    setSelectedDate('');
    
    // Refresh the reports list if data was changed
    if (dataChanged) {
      fetchReports();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      case 'generated':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'sent':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getWhatsAppStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'responded':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  if (showReport) {
    return (
      <DailyReport
        date={selectedDate}
        reportId={selectedReport?._id}
        report={selectedReport}
        onClose={handleCloseReport}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Daily Reports
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Manage daily arrival reports for passengers
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="card mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="generated">Generated</option>
                    <option value="sent">Sent</option>
                    <option value="completed">Completed</option>
                  </select>
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
          </div>

          {/* Actions - HIDDEN */}
          {/* <div className="card mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-dark-100">Actions</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => generateReport()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={true}
                    title="Disabled: Use date filters and 'View Report' buttons instead"
                  >
                    Generate Today's Report
                  </button>
                  <button
                    onClick={() => setShowCustomDateModal(true)}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={true}
                    title="Disabled: Use date filters and 'View Report' buttons instead"
                  >
                    Generate Custom Date
                  </button>
                </div>
              </div>
            </div>
          </div> */}

          {error && (
            <div className="notification mb-8">
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

          {/* Arrivals Table */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">
                {filters.startDate || filters.endDate ? 'Filtered Arrivals' : 'Today\'s Arrivals'}
              </h3>
              <p className="text-sm text-dark-400 mb-6">
                {filters.startDate || filters.endDate 
                  ? `Passengers arriving between ${filters.startDate || 'any date'} and ${filters.endDate || 'any date'}`
                  : 'Passengers arriving today based on service end dates'
                }
              </p>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : todayArrivals.length === 0 ? (
                <div className="text-center py-8 text-dark-400">
                  <p>
                    {filters.startDate || filters.endDate 
                      ? 'No passengers found for the selected date range'
                      : 'No passengers arriving today'
                    }
                  </p>
                  <p className="text-sm">
                    {filters.startDate || filters.endDate 
                      ? 'Try adjusting your date filters or check your sales data'
                      : 'Check back tomorrow or review your sales data'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-dark-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Passenger
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Arrival Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Sale Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                          Total Sale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-800/30 divide-y divide-white/10">
                      {todayArrivals.map((arrival, index) => (
                        <tr key={`${arrival.saleId}-${arrival.passengerId}-${index}`} className="hover:bg-dark-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-dark-100">
                              {arrival.passengerDetails.name} {arrival.passengerDetails.surname}
                            </div>
                            <div className="text-sm text-dark-400">
                              {arrival.passengerDetails.passportNumber}
                            </div>
                            <div className="text-xs text-dark-500">
                              {arrival.passengerDetails.nationality}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-100">
                              {arrival.clientDetails.name} {arrival.clientDetails.surname}
                            </div>
                            <div className="text-sm text-dark-400">
                              {arrival.clientDetails.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-100">
                              {arrival.serviceDetails.title}
                            </div>
                            <div className="text-sm text-dark-400">
                              {arrival.serviceDetails.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                            {arrival.serviceDetails.providerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-100">
                              {arrival.serviceDetails.location.city}
                            </div>
                            <div className="text-sm text-dark-400">
                              {arrival.serviceDetails.location.country}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                            {new Date(arrival.arrivalDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              arrival.saleDetails.status === 'open' 
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : arrival.saleDetails.status === 'closed'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {arrival.saleDetails.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-dark-100">
                              {arrival.saleDetails.currency} {arrival.saleDetails.totalSalePrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-green-400">
                              Profit: {arrival.saleDetails.currency} {arrival.saleDetails.profit.toLocaleString()}
                            </div>
                            <div className="text-xs text-dark-400">
                              Margin: {arrival.saleDetails.profitMargin}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Modal - DISABLED */}
        {/* {showCustomDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-white/20 w-96 shadow-lg rounded-md card-glass">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-dark-100 mb-4">
                  Generate Report for Custom Date
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customDate" className="block text-sm font-medium text-dark-200 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      id="customDate"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800/50 text-dark-100"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCustomDateModal(false);
                        setCustomDate('');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (customDate) {
                          generateReport(customDate);
                          setShowCustomDateModal(false);
                          setCustomDate('');
                        }
                      }}
                      disabled={!customDate}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default DailyReports;