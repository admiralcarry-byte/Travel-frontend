import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatCurrencyCompact, formatCurrency, formatCurrencyEllipsis } from '../utils/formatNumbers';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sales, setSales] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    usdSales: 0,
    arsSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch sales data and statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch recent sales for current seller (limit to 3)
        const salesResponse = await api.get('/api/sales/seller/monthly-sales?limit=3');

        // Fetch monthly stats for current salesperson (this also provides the stats data)
        const monthlyStatsResponse = await api.get('/api/sales/seller/monthly-stats');

        // Fetch currency-specific stats for current seller
        const currencyResponse = await api.get('/api/sales/currency-stats');

        if (salesResponse.data.success) {
          // Transform sales data to match component expectations
          const transformedSales = salesResponse.data.data.sales.map(sale => ({
            id: sale._id,
            customer: sale.clientId ? `${sale.clientId.name} ${sale.clientId.surname}` : 'Unknown Client',
            phone: sale.clientId?.phone || 'N/A',
            amount: sale.totalSalePrice || 0,
            profit: sale.profit || 0,
            date: sale.createdAt,
            status: sale.status === 'closed' ? 'completed' : sale.status === 'open' ? 'pending' : sale.status
          }));
          setSales(transformedSales);
        }

        if (monthlyStatsResponse.data.success) {
          const statsData = monthlyStatsResponse.data.data;
          const overview = statsData.overview;
          
          // Extract USD and ARS sales from currency stats
          let usdSales = 0;
          let arsSales = 0;
          
          if (currencyResponse.data.success && currencyResponse.data.data.currencyBreakdown) {
            const currencyData = currencyResponse.data.data.currencyBreakdown;
            const usdData = currencyData.find(item => item._id === 'USD');
            const arsData = currencyData.find(item => item._id === 'ARS');
            
            usdSales = usdData ? usdData.totalSalesInCurrency || 0 : 0;
            arsSales = arsData ? arsData.totalSalesInCurrency || 0 : 0;
          }
          
          setStats({
            totalRevenue: overview.totalRevenue || 0,
            totalSales: overview.totalSales || 0,
            usdSales: usdSales,
            arsSales: arsSales
          });
          
          setMonthlyStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.relative')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-dark-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Seller Dashboard
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Welcome back, <span className="font-semibold text-primary-400">{user?.username || 'Seller'}</span>! 
            Here's your comprehensive sales overview and performance metrics.
          </p>
        </div>
          

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* USD Sales Card */}
          <div className="card-neon hover-lift p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="icon-container bg-success-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-success-300 notranslate">USD Sales</div>
                <div className="text-xs text-success-400">All time</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-dark-100 mb-3 notranslate">Sales in USD</h3>
            <p className="text-5xl font-bold text-success-400 mb-3 notranslate">{formatCurrencyEllipsis(stats.usdSales, 'USD')}</p>
            <p className="text-sm text-success-300 notranslate">USD transactions</p>
          </div>

          {/* ARS Sales Card */}
          <div className="card-neon hover-lift p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="icon-container bg-warning-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-warning-300 notranslate">ARS Sales</div>
                <div className="text-xs text-warning-400">All time</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-dark-100 mb-3 notranslate">Sales in ARS</h3>
            <p className="text-5xl font-bold text-warning-400 mb-3 notranslate">{formatCurrencyEllipsis(stats.arsSales, 'ARS')}</p>
            <p className="text-sm text-warning-300 notranslate">ARS transactions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass p-8 mb-12">
          <h3 className="text-3xl font-bold text-dark-100 mb-8 flex items-center">
            <div className="icon-container bg-accent-500 mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Quick Actions
          </h3>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
            <button 
              onClick={() => navigate('/sales/new')}
              className="group card hover-lift p-8"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-primary-500 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-dark-100 mb-3 group-hover:text-primary-400 transition-colors">Add New Sale</div>
                  <div className="text-dark-300 group-hover:text-primary-300 transition-colors">Record a new travel booking and expand your business</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/sales/monthly')}
              className="group card hover-lift p-8"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-accent-500 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-dark-100 mb-3 group-hover:text-accent-400 transition-colors">Monthly Sales</div>
                  <div className="text-dark-300 group-hover:text-accent-300 transition-colors">View all sales and profit for this month</div>
                </div>
              </div>
            </button>
            </div>
          </div>
        </div>

        {/* Recent Sales Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-dark-100 flex items-center">
              <div className="icon-container bg-primary-500 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Recent Sales
            </h3>
            <button 
              onClick={() => navigate('/sales')}
              className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All →
            </button>
          </div>
            
          <div className="grid gap-6">
            {sales.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-dark-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark-200 mb-2">No Sales Yet</h3>
                <p className="text-dark-400 mb-4">Start by creating your first sale to see it here.</p>
                <button 
                  onClick={() => navigate('/sales/new')}
                  className="btn-primary"
                >
                  Create First Sale
                </button>
              </div>
            ) : (
              sales.map((sale, index) => (
              <div
                key={sale.id}
                className="card hover-lift p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-500 via-accent-500 to-success-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {sale.customer.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold text-dark-100 mb-2">
                        {sale.customer}
                      </div>
                      <div className="text-dark-300 flex items-center mb-2">
                        <svg className="w-4 h-4 mr-2 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sale.phone}
                      </div>
                      <div className="text-sm text-dark-400 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(sale.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-dark-100 mb-3 notranslate">
                        {formatCurrencyCompact(sale.amount)}
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === sale.id ? null : sale.id)}
                        className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {activeDropdown === sale.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-white/10 rounded-lg shadow-lg z-10">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                navigate(`/sales/${sale.id}`);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                navigate(`/sales/${sale.id}/edit`);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              Edit Sale
                            </button>
                            <button
                              onClick={() => {
                                // Handle delete functionality
                                // console.log('Delete sale:', sale.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-error-400 hover:bg-error-500/10 hover:text-error-300 transition-colors"
                            >
                              Delete Sale
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;