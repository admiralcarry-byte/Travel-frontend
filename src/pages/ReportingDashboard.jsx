import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TopServicesTable from '../components/TopServicesTable';
import PaymentMethodsTable from '../components/PaymentMethodsTable';
import TopPassengerBalancesTable from '../components/TopPassengerBalancesTable';
import CurrencyReport from '../components/CurrencyReport';
import PaymentReports from '../components/PaymentReports';
import { formatCurrencyCompact } from '../utils/formatNumbers';

const ReportingDashboard = () => {
  const { token, user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [balancesData, setBalancesData] = useState(null);
  const [clientBalanceData, setClientBalanceData] = useState(null);
  const [providerBalanceData, setProviderBalanceData] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize filters with default date range to prevent race condition
  const getInitialFilters = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
    
    return {
      period: 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      sellerId: '',
      currency: null
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());
  const [debouncedFilters, setDebouncedFilters] = useState(getInitialFilters());

  const [sellers, setSellers] = useState([]);

  const fetchSellers = useCallback(async () => {
    try {
      const response = await api.get('/api/users/sellers');

      if (response.data.success) {
        setSellers(response.data.data.sellers);
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    }
  }, [token]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (debouncedFilters.period) params.append('period', debouncedFilters.period);
      if (debouncedFilters.startDate) params.append('startDate', debouncedFilters.startDate);
      if (debouncedFilters.endDate) params.append('endDate', debouncedFilters.endDate);
      if (debouncedFilters.sellerId) params.append('sellerId', debouncedFilters.sellerId);
      if (debouncedFilters.currency) params.append('currency', debouncedFilters.currency);

      // Use AdminInsights endpoint which has real data
      const [adminInsightsRes, paymentMethodsRes] = await Promise.all([
        api.get(`/api/admin-insights/overview?${params}`),
        api.get(`/api/reports/payment-methods?${params}`)
      ]);

      if (adminInsightsRes.data.success && adminInsightsRes.data.data.insights) {
        const insights = adminInsightsRes.data.data.insights;
        
        // Extract KPIs from AdminInsights data
        const kpisData = {
          totalSales: insights.businessMetrics?.totalRevenue || 0,
          totalProfit: insights.businessMetrics?.totalProfit || 0,
          saleCount: insights.businessMetrics?.saleCount || 0,
          profitMargin: insights.businessMetrics?.profitMargin || 0,
          totalClientBalance: insights.businessMetrics?.totalClients || 0,
          totalProviderBalance: 0 // Will be calculated separately
        };
        
        setKpis(kpisData);
        
        // Set additional data for charts (simplified for now)
        setSalesData({
          chartData: {
            labels: ['Total Sales'],
            values: [insights.businessMetrics?.totalRevenue || 0],
            profitValues: [insights.businessMetrics?.totalProfit || 0]
          }
        });
        
        setProfitData({
          chartData: {
            labels: ['Total Profit'],
            values: [insights.businessMetrics?.totalProfit || 0],
            saleValues: [insights.businessMetrics?.totalRevenue || 0]
          }
        });
        
        // Set top services data
        if (insights.serviceMetrics && insights.serviceMetrics.length > 0) {
          setTopServices(insights.serviceMetrics.slice(0, 5));
        }
        
        // Set client balance data
        setClientBalanceData({
          totalClientBalance: insights.businessMetrics?.totalClients || 0
        });
        
        // Set provider balance data
        setProviderBalanceData({
          totalProviderBalance: 0
        });
        
        // Set balances data for pie chart
        setBalancesData({
          summary: {
            totalClientBalance: insights.businessMetrics?.totalClients || 0,
            totalProviderBalance: 0
          }
        });
      } else {
        console.error('❌ AdminInsights API failed:', adminInsightsRes.data);
      }
      
      if (paymentMethodsRes.data.success) {
        setPaymentMethodsData(paymentMethodsRes.data.data);
      }

    } catch (error) {
      console.error('Reporting data fetch error:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in to view reports.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view reports.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch reporting data');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, token]);

  // Debounce filters to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch sellers only once on mount
  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  // Fetch data only when debounced filters change and user is authenticated
  useEffect(() => {
    if (token && user) {
      fetchAllData();
    } else {
      setLoading(false);
      setError('Please log in to view reports.');
    }
  }, [debouncedFilters, fetchAllData, token, user]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    const initialFilters = getInitialFilters();
    setFilters(initialFilters);
  }, []);

  const refreshData = useCallback(() => {
    console.log('🔄 Manually refreshing report data...');
    fetchAllData();
  }, [fetchAllData]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text font-poppins">
              Reporting Dashboard
            </h1>
            <button
              onClick={refreshData}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Comprehensive analytics and insights for your travel business
          </p>
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

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Seller
              </label>
              <select
                value={filters.sellerId}
                onChange={(e) => handleFilterChange('sellerId', e.target.value)}
                className="input-field"
              >
                <option value="">All Sellers</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Currency
              </label>
              <select
                value={filters.currency || ''}
                onChange={(e) => handleFilterChange('currency', e.target.value || null)}
                className="input-field"
              >
                <option value="">All Currencies</option>
                <option value="USD">U$</option>
                <option value="ARS">AR$</option>
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

        {/* KPIs */}
        {loading && (
          <div className="mb-8 p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <p className="text-blue-800 dark:text-blue-200">Loading reporting data...</p>
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 rounded">
            <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          </div>
        )}
        
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* {console.log('🎯 Rendering KPIs Cards with values:', {
              totalSales: kpis.totalSales,
              totalProfit: kpis.totalProfit,
              saleCount: kpis.saleCount,
              profitMargin: kpis.profitMargin,
              totalClientBalance: kpis.totalClientBalance,
              totalProviderBalance: kpis.totalProviderBalance
            })} */}
            {/* {console.log('🔧 DEBUG: KPIs state object:', kpis)}
            {console.log('🔧 DEBUG: Individual values for KPICard components:', {
              'Total Sales value': kpis.totalSales,
              'Total Profit value': kpis.totalProfit,
              'Client Balance value': JSON.stringify(clientBalanceData),
              'Provider Balance value': providerBalanceData?.totalProviderBalance || 0
            })} */}
            <KPICard
              title="Total Sales"
              value={kpis.totalSales}
              subtitle={`${kpis.saleCount} sales`}
              icon="money"
              color="blue"
            />
            <KPICard
              title="Total Profit"
              value={kpis.totalProfit}
              subtitle={`${kpis.profitMargin}% margin`}
              icon="chart"
              color="green"
            />
            <KPICard
              title="Passenger Balances"
              value={Math.abs(clientBalanceData?.totalClientBalance || 0)}
              subtitle="Outstanding amounts"
              icon="users"
              color="yellow"
            />
            <KPICard
              title="Provider Balances"
              value={Math.abs(providerBalanceData?.totalProviderBalance || 0)}
              subtitle="Amounts owed"
              icon="building"
              color="red"
            />
          </div>
        )}
        
        {/* Debug info - temporary display of raw values - HIDDEN */}
        {/* {kpis && (
          <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <h4 className="font-bold text-blue-800 dark:text-blue-200">🔧 DEBUG - Raw Data:</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Total Sales:</strong> {kpis.totalSales} (Type: {typeof kpis.totalSales})</p>
              <p><strong>Total Profit:</strong> {kpis.totalProfit} (Type: {typeof kpis.totalProfit})</p>
              <p><strong>Sale Count:</strong> {kpis.saleCount} (Type: {typeof kpis.saleCount})</p>
              <p><strong>Profit Margin:</strong> {kpis.profitMargin}% (Type: {typeof kpis.profitMargin})</p>
              <hr className="my-2" />
              <p><strong>Client Balance (Separate):</strong> {clientBalanceData?.totalClientBalance || 0} (Type: {typeof clientBalanceData?.totalClientBalance})</p>
              <p><strong>Provider Balance (Separate):</strong> {providerBalanceData?.totalProviderBalance || 0} (Type: {typeof providerBalanceData?.totalProviderBalance})</p>
              <p><strong>Client Balance (KPI):</strong> {kpis.totalClientBalance} (Type: {typeof kpis.totalClientBalance})</p>
              <p><strong>Provider Balance (KPI):</strong> {kpis.totalProviderBalance} (Type: {typeof kpis.totalProviderBalance})</p>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400">Full JSON Data</summary>
              <div className="text-xs mt-2 bg-white dark:bg-gray-800 p-2 rounded overflow-auto">
                <h5 className="font-bold">KPIs:</h5>
                <pre>{JSON.stringify(kpis, null, 2)}</pre>
                <h5 className="font-bold mt-2">Client Balance Data:</h5>
                <pre>{JSON.stringify(clientBalanceData, null, 2)}</pre>
                <h5 className="font-bold mt-2">Provider Balance Data:</h5>
                <pre>{JSON.stringify(providerBalanceData, null, 2)}</pre>
              </div>
            </details>
          </div>
        )} */}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Balance Distribution */}
          {balancesData && balancesData.summary && (
            <PieChart
              title="Balance Distribution"
              data={[
                { name: 'Passenger Balances', value: balancesData.summary.totalClientBalance },
                { name: 'Provider Balances', value: Math.abs(balancesData.summary.totalProviderBalance) }
              ]}
              height={350}
            />
          )}

          {/* Top Services Revenue */}
          {topServices && topServices.length > 0 && (
            <BarChart
              title="Top Services Revenue"
              data={topServices.slice(0, 8).map(service => ({
                label: service.serviceName && service.serviceName.length > 15 
                  ? service.serviceName.substring(0, 15) + '...' 
                  : service.serviceName || 'Unknown Service',
                value: service.totalRevenue || 0,
                profit: service.totalProfit || 0
              }))}
              bars={[
                { dataKey: 'value', name: 'Revenue', color: '#3B82F6' },
                { dataKey: 'profit', name: 'Profit', color: '#10B981' }
              ]}
              height={350}
            />
          )}
        </div>

        {/* Top Services Table */}
        <div className="mb-8">
          <TopServicesTable 
            services={topServices} 
            title="Top Selling Services"
          />
        </div>

        {/* Currency Report */}
        <div className="mb-8">
          <CurrencyReport 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Payment Reports */}
        <div className="mb-8">
          <PaymentReports 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Balance Details */}
        {balancesData && balancesData.topClientBalances && balancesData.topProviderBalances && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Client Balances */}
            <TopPassengerBalancesTable 
              balances={balancesData.topClientBalances} 
              title="Top Passenger Balances"
            />

            {/* Top Provider Balances */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-dark-100">Amounts Owed to Providers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Amount Owed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {balancesData.topProviderBalances.map((provider, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100">
                          {provider.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-error-400">
                          ${provider.totalOwed.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {provider.saleCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Analysis */}
        {paymentMethodsData && (
          <div className="mt-8">
            <PaymentMethodsTable data={paymentMethodsData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingDashboard;