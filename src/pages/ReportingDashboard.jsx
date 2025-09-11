import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import TopServicesTable from '../components/TopServicesTable';

const ReportingDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [balancesData, setBalancesData] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    period: 'monthly',
    startDate: '',
    endDate: '',
    sellerId: ''
  });

  const [debouncedFilters, setDebouncedFilters] = useState({
    period: 'monthly',
    startDate: '',
    endDate: '',
    sellerId: ''
  });

  const [sellers, setSellers] = useState([]);

  const fetchSellers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSellers(response.data.data.users.filter(user => user.role === 'seller'));
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (debouncedFilters.period) params.append('period', debouncedFilters.period);
      if (debouncedFilters.startDate) params.append('startDate', debouncedFilters.startDate);
      if (debouncedFilters.endDate) params.append('endDate', debouncedFilters.endDate);
      if (debouncedFilters.sellerId) params.append('sellerId', debouncedFilters.sellerId);

      const [kpisRes, salesRes, profitRes, balancesRes, topServicesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/reports/kpis?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:5000/api/reports/sales?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:5000/api/reports/profit?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:5000/api/reports/balances?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`http://localhost:5000/api/reports/top-services?${params}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (kpisRes.data.success) setKpis(kpisRes.data.data);
      if (salesRes.data.success) setSalesData(salesRes.data.data);
      if (profitRes.data.success) setProfitData(profitRes.data.data);
      if (balancesRes.data.success) setBalancesData(balancesRes.data.data);
      if (topServicesRes.data.success) setTopServices(topServicesRes.data.data.topServices);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch reporting data');
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

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

  // Fetch data only when debounced filters change
  useEffect(() => {
    fetchAllData();
  }, [debouncedFilters, fetchAllData]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      period: 'monthly',
      startDate: '',
      endDate: '',
      sellerId: ''
    });
  }, []);

  const getDefaultDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, []);

  // Set default dates only once on mount
  useEffect(() => {
    const defaultDates = getDefaultDateRange();
    setFilters(prev => ({
      ...prev,
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate
    }));
  }, [getDefaultDateRange]);

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
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Reporting Dashboard
          </h1>
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
        <div className="card-glass p-6 mb-6"
          style={{display: 'none'}}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Sales"
              value={kpis.totalSales}
              subtitle={`${kpis.saleCount} sales`}
              icon="💰"
              color="blue"
            />
            <KPICard
              title="Total Profit"
              value={kpis.totalProfit}
              subtitle={`${kpis.profitMargin}% margin`}
              icon="📈"
              color="green"
            />
            <KPICard
              title="Client Balances"
              value={kpis.totalClientBalance}
              subtitle="Outstanding amounts"
              icon="👥"
              color="yellow"
            />
            <KPICard
              title="Provider Balances"
              value={Math.abs(kpis.totalProviderBalance)}
              subtitle="Amounts owed"
              icon="🏢"
              color="red"
            />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Over Time */}
          {salesData && (
            <LineChart
              title="Sales Over Time"
              data={salesData.chartData.labels.map((label, index) => ({
                label,
                value: salesData.chartData.values[index],
                profit: salesData.chartData.profitValues[index]
              }))}
              lines={[
                { dataKey: 'value', name: 'Sales', color: '#3B82F6' },
                { dataKey: 'profit', name: 'Profit', color: '#10B981' }
              ]}
              height={350}
            />
          )}

          {/* Profit by Seller */}
          {profitData && (
            <BarChart
              title="Profit by Seller"
              data={profitData.chartData.labels.map((label, index) => ({
                label,
                value: profitData.chartData.values[index],
                sales: profitData.chartData.saleValues[index]
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
          {balancesData && (
            <PieChart
              title="Balance Distribution"
              data={[
                { name: 'Client Balances', value: balancesData.summary.totalClientBalance },
                { name: 'Provider Balances', value: Math.abs(balancesData.summary.totalProviderBalance) }
              ]}
              height={350}
            />
          )}

          {/* Top Services Revenue */}
          {topServices.length > 0 && (
            <BarChart
              title="Top Services Revenue"
              data={topServices.slice(0, 8).map(service => ({
                label: service.serviceName.length > 15 
                  ? service.serviceName.substring(0, 15) + '...' 
                  : service.serviceName,
                value: service.totalRevenue,
                profit: service.totalProfit
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

        {/* Balance Details */}
        {balancesData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Client Balances */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-medium text-dark-100">Top Client Balances</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-dark-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {balancesData.topClientBalances.map((client, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-100">{client.clientName}</div>
                          <div className="text-sm text-dark-400">{client.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                          ${client.totalBalance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                          {client.saleCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
      </div>
    </div>
  );
};

export default ReportingDashboard;