import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import InteractiveBarChart from '../components/InteractiveBarChart';
import PieChart from '../components/PieChart';
import DataTable from '../components/DataTable';

const AdminInsightsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [sellerPerformance, setSellerPerformance] = useState([]);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  
  // Seller activity states
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerActivity, setSellerActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    period: 'monthly',
    startDate: '',
    endDate: '',
    sellerId: '',
    status: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });
  
  // View states
  const [activeView, setActiveView] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('seller-performance');
  const [exportFormat, setExportFormat] = useState('csv');

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/admin-insights/overview?${params}`);
      if (response.data.success) {
        setOverview(response.data.data.insights);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  }, [filters.period, filters.startDate, filters.endDate]);

  // Fetch seller performance data
  const fetchSellerPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      params.append('includeHistory', 'true');

      const response = await api.get(`/api/admin-insights/seller-performance?${params}`);
      if (response.data.success) {
        // Ensure we have a valid array and each seller has the expected structure
        const sellers = response.data.data.sellers || [];
        const validSellers = sellers.map(seller => ({
          ...seller,
          sellerName: seller.sellerName || 'Unknown Seller',
          sellerEmail: seller.sellerEmail || 'No email',
          performance: {
            ...seller.performance,
            totalSales: seller.performance?.totalSales || 0,
            totalProfit: seller.performance?.totalProfit || 0,
            profitMargin: seller.performance?.profitMargin || 0,
            saleCount: seller.performance?.saleCount || 0,
            averageSaleValue: seller.performance?.averageSaleValue || 0,
            ranking: seller.performance?.ranking || 0
          }
        }));
        setSellerPerformance(validSellers);
      } else {
        console.warn('Failed to fetch seller performance:', response.data.message);
        setSellerPerformance([]);
      }
    } catch (error) {
      console.error('Error fetching seller performance:', error);
      setSellerPerformance([]);
    }
  }, [filters.period, filters.startDate, filters.endDate, filters.sellerId]);

  // Fetch seller activity
  const fetchSellerActivity = useCallback(async (sellerId) => {
    try {
      setActivityLoading(true);
      const params = new URLSearchParams();
      params.append('userId', sellerId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '20');

      const response = await api.get(`/api/activity-logs?${params}`);
      if (response.data.success) {
        setSellerActivity(response.data.data.activities || []);
      } else {
        setSellerActivity([]);
      }
    } catch (error) {
      console.error('Error fetching seller activity:', error);
      setSellerActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  // Handle seller selection
  const handleSellerSelect = useCallback((seller) => {
    setSelectedSeller(seller);
    fetchSellerActivity(seller.sellerId);
  }, [fetchSellerActivity]);

  // Fetch transaction details
  const fetchTransactionDetails = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.status) params.append('status', filters.status);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await api.get(`/api/admin-insights/transaction-details?${params}`);
      if (response.data.success) {
        setTransactionDetails(response.data.data.transactions);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.data.pagination.totalCount,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Fetch monthly trends
  const fetchMonthlyTrends = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('months', '12');
      if (filters.sellerId) params.append('sellerId', filters.sellerId);

      const response = await api.get(`/api/admin-insights/monthly-trends?${params}`);
      if (response.data.success) {
        setMonthlyTrends(response.data.data.trends);
      }
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  }, [filters.sellerId]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        fetchOverview(),
        fetchSellerPerformance(),
        fetchTransactionDetails(),
        fetchMonthlyTrends()
      ]);
    } catch (error) {
      setError('Failed to fetch insights data');
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchSellerPerformance, fetchTransactionDetails, fetchMonthlyTrends]);

  // Initial data fetch
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset pagination when filters change
    if (field !== 'page') {
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('type', exportType);
      params.append('format', exportFormat);
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);

      const response = await api.get(`/api/admin-insights/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportType}-${filters.period}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      period: 'monthly',
      startDate: '',
      endDate: '',
      sellerId: '',
      status: '',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification">
        <div className="flex items-center space-x-4">
          <div className="icon-container bg-error-500">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-error-400 font-medium text-lg">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Admin Insights
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Comprehensive analytics and performance insights for administrators
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="card-glass p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'overview'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('sellers')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'sellers'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Seller Performance
            </button>
            <button
              onClick={() => setActiveView('transactions')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'transactions'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Transaction Details
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'trends'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Monthly Trends
            </button>
            {/* <button
              onClick={() => setShowExportModal(true)}
              className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Export Data
            </button> */}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Period
              </label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="input-field"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
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

            {/* <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Seller
              </label>
              <select
                value={filters.sellerId}
                onChange={(e) => handleFilterChange('sellerId', e.target.value)}
                className="input-field"
              >
                <option value="">All Sellers</option>
                {sellerPerformance.map(seller => (
                  <option key={seller.sellerId} value={seller.sellerId}>
                    {seller.sellerName || 'Unknown Seller'}
                  </option>
                ))}
              </select>
            </div> */}

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
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
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

        {/* Overview View */}
        {activeView === 'overview' && overview && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Revenue"
                value={overview.businessMetrics?.totalRevenue || 0}
                subtitle={`${overview.businessMetrics?.saleCount || 0} sales`}
                icon="money"
                color="blue"
              />
              <KPICard
                title="Total Profit"
                value={overview.businessMetrics?.totalProfit || 0}
                subtitle={`${overview.businessMetrics?.profitMargin || 0}% margin`}
                icon="chart"
                color="green"
              />
              <KPICard
                title="Total Clients"
                value={overview.businessMetrics?.totalClients || 0}
                subtitle={`${overview.businessMetrics?.newClients || 0} new`}
                icon="users"
                color="yellow"
              />
              <KPICard
                title="Avg Sale Value"
                value={overview.businessMetrics?.averageSaleValue || 0}
                subtitle="Per transaction"
                icon="dollar"
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              {monthlyTrends.length > 0 && (
                <LineChart
                  title="Revenue & Profit Trends"
                  data={monthlyTrends.map(trend => ({
                    label: `${trend.month} ${trend.year}`,
                    revenue: trend.metrics.totalRevenue,
                    profit: trend.metrics.totalProfit
                  }))}
                  lines={[
                    { dataKey: 'revenue', name: 'Revenue', color: '#3B82F6' },
                    { dataKey: 'profit', name: 'Profit', color: '#10B981' }
                  ]}
                  height={350}
                />
              )}

              {/* Seller Performance */}
              {sellerPerformance.length > 0 && (
                <InteractiveBarChart
                  title="Top Sellers by Profit"
                  data={sellerPerformance.slice(0, 8).map(seller => ({
                    label: seller.sellerName || 'Unknown Seller',
                    sellerId: seller.sellerId,
                    sellerEmail: seller.sellerEmail,
                    profit: seller.performance?.totalProfit || 0,
                    revenue: seller.performance?.totalSales || 0
                  }))}
                  bars={[
                    { dataKey: 'profit', name: 'Profit', color: '#10B981' },
                    { dataKey: 'revenue', name: 'Revenue', color: '#3B82F6' }
                  ]}
                  height={350}
                  onSellerClick={handleSellerSelect}
                  selectedSeller={selectedSeller}
                />
              )}
            </div>
            
            {/* Seller Activity Section */}
            {selectedSeller && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-dark-100">
                      Activity for {selectedSeller.sellerName}
                    </h3>
                    <p className="text-sm text-dark-300">{selectedSeller.sellerEmail}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSeller(null)}
                    className="text-dark-400 hover:text-dark-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-dark-300">Loading activity...</span>
                  </div>
                ) : sellerActivity.length > 0 ? (
                  <div className="space-y-3">
                    {sellerActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'sale' ? 'bg-green-500' :
                            activity.type === 'client' ? 'bg-blue-500' :
                            activity.type === 'payment' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-dark-100">{activity.action}</p>
                            <p className="text-xs text-dark-400">
                              {activity.details || 'No additional details'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-dark-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <p>No activity found for this seller in the selected period.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Seller Performance View */}
        {activeView === 'sellers' && (
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-dark-100">Seller Performance Rankings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Margin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sales Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Avg Sale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sellerPerformance.map((seller, index) => (
                      <tr key={seller.sellerId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                          #{seller.performance?.ranking || index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          <div>
                            <div className="font-medium">{seller.sellerName || 'Unknown Seller'}</div>
                            <div className="text-dark-400">{seller.sellerEmail || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          ${(seller.performance?.totalSales || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                          ${(seller.performance?.totalProfit || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {seller.performance?.profitMargin || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {seller.performance?.saleCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          ${(seller.performance?.averageSaleValue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details View */}
        {activeView === 'transactions' && (
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-dark-100">Transaction Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sale ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {transactionDetails.map((transaction) => (
                      <tr key={transaction.saleId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                          #{transaction.saleId.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          <div>
                            <div className="font-medium">{transaction.clientName}</div>
                            <div className="text-dark-400">{transaction.clientEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {transaction.sellerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          ${transaction.totalSalePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                          ${transaction.profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'closed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'open'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-dark-300">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-dark-300 px-2">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly Trends View */}
        {activeView === 'trends' && monthlyTrends.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                title="Revenue Trends"
                data={monthlyTrends.map(trend => ({
                  label: `${trend.month} ${trend.year}`,
                  revenue: trend.metrics.totalRevenue,
                  sales: trend.metrics.saleCount
                }))}
                lines={[
                  { dataKey: 'revenue', name: 'Revenue', color: '#3B82F6' },
                  { dataKey: 'sales', name: 'Sales Count', color: '#10B981' }
                ]}
                height={400}
              />
              
              <LineChart
                title="Profit & Margin Trends"
                data={monthlyTrends.map(trend => ({
                  label: `${trend.month} ${trend.year}`,
                  profit: trend.metrics.totalProfit,
                  margin: trend.metrics.profitMargin
                }))}
                lines={[
                  { dataKey: 'profit', name: 'Profit', color: '#10B981' },
                  { dataKey: 'margin', name: 'Margin %', color: '#F59E0B' }
                ]}
                height={400}
              />
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Type
                  </label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="seller-performance">Seller Performance</option>
                    <option value="transaction-details">Transaction Details</option>
                    <option value="monthly-trends">Monthly Trends</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInsightsDashboard;