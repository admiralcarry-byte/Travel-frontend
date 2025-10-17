import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import InteractiveBarChart from '../components/InteractiveBarChart';
import PieChart from '../components/PieChart';
import DataTable from '../components/DataTable';
import PaymentMethodsTable from '../components/PaymentMethodsTable';
import { formatCurrencyCompact } from '../utils/formatNumbers';

// Mapping from display names to enum values - moved outside component to prevent re-creation
const paymentMethodMapping = {
  'Cash': 'cash',
  'Bank Transfer': 'bank_transfer',
  'Credit Card': 'credit_card',
  'Transfer to Mare Nostrum': 'transfer_to_mare_nostrum',
  'Transfer to Operator': 'transfer_to_operator',
  'Deposit to Hivago': 'deposit_to_hivago',
  'Deposit to Operator': 'deposit_to_operator',
  'Cheque': 'cheque',
  'Crypto': 'crypto',
  'Cryptocurrency': 'crypto'  // Also map 'Cryptocurrency' to 'crypto' for backward compatibility
};

const AdminInsightsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [sellerPerformance, setSellerPerformance] = useState([]);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  
  
  // Payment methods from database
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Seller activity states
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerActivity, setSellerActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    period: 'yearly',
    startDate: '',
    endDate: '',
    sellerId: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    paymentType: '',
    paymentMethod: '',
    currency: ''
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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
      if (filters.currency) params.append('currency', filters.currency);

      const response = await api.get(`/api/admin-insights/overview?${params}`);
      if (response.data.success) {
        setOverview(response.data.data.insights);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  }, [filters.period, filters.startDate, filters.endDate, filters.currency]);

  // Fetch seller performance data
  const fetchSellerPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.currency) params.append('currency', filters.currency);
      params.append('includeHistory', 'true');

      const response = await api.get(`/api/admin-insights/seller-performance?${params}`);
      if (response.data.success) {
        // Ensure we have a valid array and each seller has the expected structure
        const sellers = response.data.data.sellers || [];
        const validSellers = sellers.map(seller => ({
          ...seller,
          sellerName: seller.sellerName || 'Unknown Seller',
          sellerEmail: seller.sellerEmail || 'No email',
          // Backend returns data nested under performance object
          totalSales: seller.performance?.totalSales || 0,
          totalProfit: seller.performance?.totalProfit || 0,
          saleCount: seller.performance?.saleCount || 0,
          performance: {
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
  }, [filters.period, filters.startDate, filters.endDate, filters.sellerId, filters.currency]);

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
      if (filters.currency) params.append('currency', filters.currency);
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
      if (filters.currency) params.append('currency', filters.currency);

      const response = await api.get(`/api/admin-insights/monthly-trends?${params}`);
      if (response.data.success) {
        setMonthlyTrends(response.data.data.trends);
      }
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  }, [filters.sellerId, filters.currency]);

  // Fetch payment methods data
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.paymentType) params.append('paymentType', filters.paymentType);
      if (filters.paymentMethod) {
        // Map display name to enum value
        const enumValue = paymentMethodMapping[filters.paymentMethod] || filters.paymentMethod;
        params.append('paymentMethod', enumValue);
      }
      if (filters.currency) params.append('currency', filters.currency);

      const response = await api.get(`/api/reports/payment-methods?${params}`);
      if (response.data.success) {
        setPaymentMethodsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, [filters.period, filters.startDate, filters.endDate, filters.paymentType, filters.paymentMethod, filters.currency]);

  // Fetch sales and profit data for charts
  const fetchChartData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/admin-insights/overview?${params}`);
      if (response.data.success && response.data.data.insights) {
        const insights = response.data.data.insights;
        
        // Set sales data for Sales Over Time chart
        setSalesData({
          chartData: {
            labels: ['Total Sales'],
            values: [insights.businessMetrics?.totalRevenue || 0],
            profitValues: [insights.businessMetrics?.totalProfit || 0]
          }
        });
        
        // Set profit data for Profit by Seller chart
        setProfitData({
          chartData: {
            labels: ['Total Profit'],
            values: [insights.businessMetrics?.totalProfit || 0],
            saleValues: [insights.businessMetrics?.totalRevenue || 0]
          }
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }, [filters.period, filters.startDate, filters.endDate]);


  // Fetch payment methods from database
  const fetchPaymentMethodsFromDB = useCallback(async () => {
    try {
      const response = await api.get('/api/manage-currencies');
      if (response.data.success && response.data.data.paymentMethods) {
        setPaymentMethods(response.data.data.paymentMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods from database:', error);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        fetchOverview(),
        fetchSellerPerformance(),
        fetchTransactionDetails(),
        fetchMonthlyTrends(),
        fetchPaymentMethods(),
        fetchChartData(),
        fetchPaymentMethodsFromDB()
      ]);
    } catch (error) {
      setError('Failed to fetch insights data');
      console.error('Error fetching all data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchSellerPerformance, fetchTransactionDetails, fetchMonthlyTrends, fetchPaymentMethods, fetchChartData, fetchPaymentMethodsFromDB]);

  // Initial data fetch
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Refetch payment methods data when payment method filter changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPaymentMethods();
    }
  }, [filters.paymentMethod, filters.paymentType, filters.currency, user]);


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

  // Handle rows per page change
  const handleRowsPerPageChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(newLimit),
      page: 1 // Reset to first page when changing rows per page
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
      period: 'yearly', // Keep the default period as 'yearly'
      startDate: '',
      endDate: '',
      sellerId: '',
      status: '',
      minAmount: '',
      maxAmount: '',
      paymentType: '',
      paymentMethod: '',
      currency: ''
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors text-center break-words ${
                activeView === 'overview'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('sellers')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors text-center break-words ${
                activeView === 'sellers'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Seller Performance
            </button>
            <button
              onClick={() => setActiveView('transactions')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors text-center break-words ${
                activeView === 'transactions'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              Transaction Details
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors text-center break-words ${
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
          <div className="space-y-4">
            {/* First Row: Period, Start Date, End Date, Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="input-field"
                  style={{ wordWrap: 'break-word' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
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
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input-field"
                  style={{ wordWrap: 'break-word' }}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Second Row: Payment Type, Payment Method, Currency, Clear Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  Payment Type
                </label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                  className="input-field"
                  style={{ wordWrap: 'break-word' }}
                >
                  <option value="">All Types</option>
                  <option value="client">Customer Payments</option>
                  <option value="provider">Supplier Payments</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="input-field"
                  style={{ wordWrap: 'break-word' }}
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map((method) => (
                    <option key={method._id} value={method.name}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 break-words">
                  Currency
                </label>
                <select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                  className="input-field"
                  style={{ wordWrap: 'break-word' }}
                >
                  <option value="">All Currencies</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="ARS">ARS - Argentine Peso</option>
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
                valueType="currency"
              />
              <KPICard
                title="Total Profit"
                value={overview.businessMetrics?.totalProfit || 0}
                subtitle={`${overview.businessMetrics?.profitMargin || 0}% margin`}
                icon="chart"
                color="green"
                valueType="currency"
              />
              <KPICard
                title="Total Users"
                value={overview.businessMetrics?.totalClients || 0}
                subtitle={`${overview.businessMetrics?.newClients || 0} new`}
                icon="users"
                color="yellow"
                valueType="number"
              />
              <KPICard
                title="Avg Sale Value"
                value={overview.businessMetrics?.totalClients > 0 ? (overview.businessMetrics?.totalRevenue / overview.businessMetrics?.totalClients) : 0}
                subtitle="Per passenger"
                icon="dollar"
                color="purple"
                valueType="currency"
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

            </div>

            {/* Additional Charts Row - Sales Over Time and Profit by Seller */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Over Time */}
              {salesData && salesData.chartData && salesData.chartData.labels && salesData.chartData.values && salesData.chartData.profitValues && (
                <LineChart
                  title="Sales Over Time"
                  data={salesData.chartData.labels.map((label, index) => ({
                    label,
                    value: salesData.chartData.values[index] || 0,
                    profit: salesData.chartData.profitValues[index] || 0
                  }))}
                  lines={[
                    { dataKey: 'value', name: 'Sales', color: '#3B82F6' },
                    { dataKey: 'profit', name: 'Profit', color: '#10B981' }
                  ]}
                  height={350}
                />
              )}

              {/* Profit by Seller */}
              {profitData && profitData.chartData && profitData.chartData.labels && profitData.chartData.values && profitData.chartData.saleValues && (
                <BarChart
                  title="Profit by Seller"
                  data={profitData.chartData.labels.map((label, index) => ({
                    label,
                    value: profitData.chartData.values[index] || 0,
                    sales: profitData.chartData.saleValues[index] || 0
                  }))}
                  bars={[
                    { dataKey: 'value', name: 'Profit', color: '#10B981' },
                    { dataKey: 'sales', name: 'Sales', color: '#3B82F6' }
                  ]}
                  height={350}
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

            {/* Payment Methods Analysis */}
            {paymentMethodsData && (
              <div className="mt-8">
                <PaymentMethodsTable data={paymentMethodsData} />
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
                          {formatCurrencyCompact(seller.performance?.totalSales || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                          {formatCurrencyCompact(seller.performance?.totalProfit || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {seller.performance?.profitMargin || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {seller.performance?.saleCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          {formatCurrencyCompact(seller.performance?.averageSaleValue || 0)}
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
                        Passenger
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
                          {formatCurrencyCompact(transaction.totalSalePrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                          {formatCurrencyCompact(transaction.profit)}
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
              <div className="px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-dark-300">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-dark-300">Rows per page:</label>
                      <select
                        value={pagination.limit}
                        onChange={(e) => handleRowsPerPageChange(e.target.value)}
                        className="bg-dark-700 border border-dark-600 text-dark-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                  {pagination.totalPages > 1 && (
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
                  )}
                </div>
              </div>
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