import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatNumbers';

const MonthlySales = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedCurrency, setSelectedCurrency] = useState('ARS'); // Default to ARS as requested
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState(false);

  // Fetch monthly sales data
  const fetchMonthlySales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: filters.year,
        month: filters.month,
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        currency: selectedCurrency
      });

      const response = await api.get(`/api/sales/seller/monthly-sales?${params}`);

      if (response.data.success) {
        setSales(response.data.data.sales);
        setSummary(response.data.data.summary);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to load monthly sales data');
      }
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
      setError('Failed to load monthly sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySales();
  }, [filters, pagination.page, selectedCurrency]);

  // Close currency tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCurrencyTooltip && !event.target.closest('.currency-tooltip-container')) {
        setShowCurrencyTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCurrencyTooltip]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatCurrencyValue = (amount) => {
    // Use exact formatting to show precise values instead of abbreviations
    return formatCurrency(amount, selectedCurrency);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-warning-500', text: 'Open' },
      closed: { color: 'bg-success-500', text: 'Closed' },
      cancelled: { color: 'bg-error-500', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-success-400';
    if (profit < 0) return 'text-error-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading monthly sales...</p>
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
          <p className="text-dark-300 mb-4">{error}</p>
          <button 
            onClick={() => fetchMonthlySales()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-dark-100 mb-2">Monthly Sales</h1>
            <p className="text-dark-300">
              View all your sales and profit for {new Date(filters.year, filters.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Currency Selection Tooltip */}
            <div className="relative currency-tooltip-container">
              <button
                onClick={() => setShowCurrencyTooltip(!showCurrencyTooltip)}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-dark-100 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-sm font-medium notranslate">{getCurrencySymbol(selectedCurrency)}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCurrencyTooltip && (
                <div className="absolute z-50 right-0 mt-2 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setSelectedCurrency('ARS');
                        setShowCurrencyTooltip(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-200 ${
                        selectedCurrency === 'ARS' ? 'bg-primary-600 text-white' : 'text-dark-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium notranslate">AR$</span>
                        <span className="text-xs text-dark-300">Argentine Peso</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCurrency('USD');
                        setShowCurrencyTooltip(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-200 ${
                        selectedCurrency === 'USD' ? 'bg-primary-600 text-white' : 'text-dark-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium notranslate">U$</span>
                        <span className="text-xs text-dark-300 notranslate">U$</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-neon p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container bg-primary-500">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">Total Sales</h3>
              <p className="text-3xl font-bold text-primary-400">{summary.totalSales}</p>
              <p className="text-sm text-primary-300">This month</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container bg-accent-500">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-accent-400 notranslate">{formatCurrencyValue(summary.totalRevenue)}</p>
              <p className="text-sm text-accent-300">This month</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container bg-success-500">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">Total Profit</h3>
              <p className={`text-3xl font-bold ${getProfitColor(summary.totalProfit)} notranslate`}>
                {formatCurrencyValue(summary.totalProfit)}
              </p>
              <p className="text-sm text-success-300">{summary.avgProfitMargin}% margin</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="icon-container bg-info-500">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">Avg Sale Value</h3>
              <p className="text-3xl font-bold text-info-400 notranslate">{formatCurrencyValue(summary.avgSaleValue)}</p>
              <p className="text-sm text-info-300">Per transaction</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-dark-100 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800 text-dark-100"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Month</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800 text-dark-100"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800 text-dark-100"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800 text-dark-100"
              >
                <option value="createdAt">Date</option>
                <option value="totalSalePrice">Revenue</option>
                <option value="profit">Profit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800 text-dark-100"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-dark-100 mb-4">Sales List</h3>
          
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-dark-300 text-lg">No sales found for this month</p>
              <p className="text-dark-400">Try adjusting your filters or create a new sale</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-dark-200">Client</th>
                      <th className="text-left py-3 px-4 font-semibold text-dark-200">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-dark-200">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-dark-200">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-dark-200">Profit</th>
                      <th className="text-right py-3 px-4 font-semibold text-dark-200">Margin</th>
                      <th className="text-center py-3 px-4 font-semibold text-dark-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => {
                      const profitMargin = sale.totalSalePrice > 0 ? ((sale.profit / sale.totalSalePrice) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={sale._id} className="border-b border-gray-100 hover:bg-dark-700 transition-colors duration-200">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-dark-100">
                                {sale.clientId ? `${sale.clientId.name} ${sale.clientId.surname}` : 'Unknown Client'}
                              </div>
                              <div className="text-sm text-dark-400">
                                {sale.passengers?.length || 0} passenger(s)
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-300">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(sale.status)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-dark-100">
                            <span className="notranslate">{formatCurrencyValue(sale.totalSalePrice)}</span>
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${getProfitColor(sale.profit)}`}>
                            <span className="notranslate">{formatCurrencyValue(sale.profit)}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-dark-300">
                            {profitMargin}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => navigate(`/sales/${sale._id}`)}
                              className="text-primary-500 hover:text-primary-600 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-dark-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sales
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-md text-sm font-medium ${
                            page === pagination.page
                              ? 'bg-primary-500 text-white border-primary-500'
                              : 'border-gray-300 text-dark-300 hover:bg-dark-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlySales;