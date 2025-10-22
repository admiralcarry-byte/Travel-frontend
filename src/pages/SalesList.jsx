import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ComprehensiveSalesOverview from '../components/ComprehensiveSalesOverview';
import MonthlyProfitabilityChart from '../components/MonthlyProfitabilityChart';
import FinancialSummary from '../components/FinancialSummary';
import MultiCurrencySummary from '../components/MultiCurrencySummary';
import { t, getDropdownOptions } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import CurrencyDisplay from '../components/CurrencyDisplay';

// TruncatedText component with double-click to show scrollbar
const TruncatedText = ({ text, className = '', title = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  const handleDoubleClick = () => {
    if (isOverflowing) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      ref={textRef}
      className={`${className} ${isExpanded ? 'overflow-auto' : 'truncate'} ${isOverflowing ? 'cursor-pointer hover:bg-dark-700/20 rounded px-1 -mx-1' : ''}`}
      title={isOverflowing ? `${title || text} (Double-click to expand)` : (title || text)}
      onDoubleClick={handleDoubleClick}
      style={isExpanded ? { maxHeight: '100px', whiteSpace: 'normal' } : {}}
    >
      {text}
      {isOverflowing && !isExpanded && (
        <span className="text-xs text-dark-500 ml-1">...</span>
      )}
    </div>
  );
};

const SalesList = () => {
  const navigate = useNavigate();
  const { formatCurrencyJSX } = useCurrencyFormat();
  
  // Helper function to get earliest start date from all services
  const getEarliestStartDate = (sale) => {
    if (!sale.services || sale.services.length === 0) return null;
    
    const startDates = sale.services
      .filter(service => service.serviceDates && service.serviceDates.startDate)
      .map(service => new Date(service.serviceDates.startDate));
    
    if (startDates.length === 0) return null;
    
    return new Date(Math.min(...startDates));
  };
  
  // Helper function to get latest end date from all services
  const getLatestEndDate = (sale) => {
    if (!sale.services || sale.services.length === 0) return null;
    
    const endDates = sale.services
      .filter(service => service.serviceDates && service.serviceDates.endDate)
      .map(service => new Date(service.serviceDates.endDate));
    
    if (endDates.length === 0) return null;
    
    return new Date(Math.max(...endDates));
  };
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableQuotas, setAvailableQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalSales, setTotalSales] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [currencySummary, setCurrencySummary] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    includeNoSales: 'true',
    providerId: '',
    createdBy: '',
    currency: '',
    cupoId: ''
  });
  const [viewMode, setViewMode] = useState('comprehensive'); // 'comprehensive', 'monthly', 'financial', 'traditional'
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Default to USD to match currency summary
  const [debouncedFilters, setDebouncedFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
    includeNoSales: 'true',
    providerId: '',
    createdBy: '',
    currency: '',
    cupoId: ''
  });
  
  // Refs to track current values for stable fetchSales function
  const currentPageRef = useRef(currentPage);
  const rowsPerPageRef = useRef(rowsPerPage);
  const debouncedFiltersRef = useRef(debouncedFilters);
  
  // Update refs when values change
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  }, [rowsPerPage]);
  
  useEffect(() => {
    debouncedFiltersRef.current = debouncedFilters;
  }, [debouncedFilters]);

  // Get status options from i18n
  const statusOptions = getDropdownOptions.status();

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchSales = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      // Get current values from refs
      const params = new URLSearchParams({
        page: currentPageRef.current,
        limit: rowsPerPageRef.current,
        ...debouncedFiltersRef.current
      });

      console.log('Fetching sales with filters:', debouncedFiltersRef.current);
      console.log('API URL:', `/api/sales?${params}`);

      const response = await api.get(`/api/sales?${params}`);

      if (response.data.success) {
        setSales(response.data.data.sales);
        setTotalPages(response.data.data.pages);
        setTotalSales(response.data.data.total);
        setCurrencySummary(response.data.data.summary || []);
        setError('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch sales');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, []);

  const fetchClients = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      // Get current values from refs
      const params = new URLSearchParams({
        page: currentPageRef.current,
        limit: rowsPerPageRef.current,
        search: debouncedFiltersRef.current.search,
        includeNoSales: debouncedFiltersRef.current.includeNoSales
      });

      const response = await api.get(`/api/clients/with-sales?${params}`);

      if (response.data.success) {
        setClients(response.data.data.clients);
        setTotalPages(response.data.data.pages);
        setTotalClients(response.data.data.total);
        setError('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch passengers');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await api.get('/api/providers');
      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/users/sellers');
      if (response.data.success) {
        // The sellers endpoint already returns only sellers and admins
        setUsers(response.data.data.sellers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const fetchAvailableQuotas = useCallback(async () => {
    try {
      const response = await api.get('/api/sales/available-quotas');
      if (response.data.success) {
        setAvailableQuotas(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available quotas:', error);
    }
  }, []);

  // Initial load effect - fetch both sales and clients
  useEffect(() => {
    fetchProviders(); // Fetch providers on mount
    fetchUsers(); // Fetch team members on mount
    fetchAvailableQuotas(); // Fetch available quotas on mount
    fetchSales(true);
    fetchClients(true);
  }, []); // Run once on mount

  // Search and filter effect - fetch both when filters change
  useEffect(() => {
    if (loading) return; // Don't fetch if still on initial load
    fetchSales(false);
    fetchClients(false);
  }, [currentPage, debouncedFilters, rowsPerPage, loading]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setCurrentPage(1);
    // Reset filters when switching tabs
    if (tab === 'sales') {
      setFilters({
        status: '',
        startDate: '',
        endDate: '',
        search: '',
        includeNoSales: 'true',
        providerId: '',
        createdBy: '',
        currency: '',
        cupoId: ''
      });
      navigate('/sales');
    } else {
      setFilters({
        status: '',
        startDate: '',
        endDate: '',
        search: '',
        includeNoSales: 'true',
        providerId: '',
        createdBy: '',
        currency: '',
        cupoId: ''
      });
      navigate('/sales?tab=passengers');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      search: '',
      includeNoSales: 'true',
      providerId: '',
      createdBy: '',
      currency: '',
      cupoId: ''
    });
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    // Handle null, undefined, NaN, or invalid numbers
    if (amount === null || amount === undefined || isNaN(amount)) {
      return currency === 'ARS' ? 'AR$0.00' : 'U$0.00';
    }
    
    if (currency === 'ARS') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        currencyDisplay: 'symbol'
      }).format(amount).replace('$', 'AR$');
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'symbol'
      }).format(amount).replace('$', 'U$');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name, surname) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading sales...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Sales
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Manage sales and reservations
          </p>
          

          <button
            onClick={() => navigate('/sales/new')}
            className="btn-primary"
          >
            Create New Sale
          </button>
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
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-500 mr-2"></div>
              <span className="text-sm text-dark-300">Searching...</span>
            </div>
          )}
          
          {/* Sales Filters */}
          <div className="mb-6">
            {/* <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-200">{t('salesFilters')}</h3>
              <LanguageSwitcher />
            </div> */}
            
            {/* Active Filters Summary */}
            {(filters.startDate || filters.endDate || filters.status || filters.providerId || filters.createdBy || filters.currency || filters.cupoId) && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-300">Active Filters:</span>
                    {filters.startDate && (
                      <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                        From: {new Date(filters.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                        To: {new Date(filters.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {filters.status && (
                      <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
                        Status: {filters.status}
                      </span>
                    )}
                    {filters.currency && (
                      <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                        Currency: {filters.currency}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
            <div className="sales-filter-grid">
              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input-field"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('currency')}
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="input-field"
                >
                  <option value="ARS"><CurrencyDisplay>ARS (AR$)</CurrencyDisplay></option>
                  <option value="USD"><CurrencyDisplay>USD (U$)</CurrencyDisplay></option>
                </select>
              </div>


              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('startDate')} {filters.startDate && <span className="text-green-400">●</span>}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input-field"
                  placeholder="Select start date"
                />
              </div>

              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('endDate')} {filters.endDate && <span className="text-green-400">●</span>}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                  placeholder="Select end date"
                />
              </div>

              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('provider')}
                </label>
                <select
                  value={filters.providerId}
                  onChange={(e) => handleFilterChange('providerId', e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('allProviders')}</option>
                  {providers.map(provider => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words">
                  {t('salesperson')}
                </label>
                <select
                  value={filters.createdBy}
                  onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('allSalespeople')}</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-dropdown-container">
                <label className="block text-sm font-semibold text-dark-200 mb-4 break-words notranslate">
                  Cupo Filter
                </label>
                <select
                  value={filters.cupoId}
                  onChange={(e) => handleFilterChange('cupoId', e.target.value)}
                  className="input-field"
                >
                  <option value="" className="notranslate">All Sales</option>
                  <option value="none" className="notranslate">No-Cupo Sales</option>
                  <option value="all_quotas" className="notranslate">All Cupo Sales</option>
                  {availableQuotas.map(quota => (
                    <option key={quota._id} value={quota._id} className="notranslate">
                      {quota.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Multi-Currency Summary */}
        {currencySummary && currencySummary.length > 0 && (
          <div className="mb-8">
            <MultiCurrencySummary 
              currencyData={currencySummary}
              title="Sales Summary by Currency"
            />
          </div>
        )}

        {/* View Mode Selector */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Sales Overview</h2>
              <p className="text-dark-300">Comprehensive financial data and profitability analysis</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode('comprehensive')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'comprehensive'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Comprehensive
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Monthly Analysis
              </button>
              <button
                onClick={() => setViewMode('financial')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'financial'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Financial Summary
              </button>
              <button
                onClick={() => setViewMode('traditional')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'traditional'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                Traditional View
              </button>
            </div>
          </div>
        </div>

        {/* Comprehensive Sales Overview */}
        {viewMode === 'comprehensive' && (
          <ComprehensiveSalesOverview
            sales={sales}
            onSaleClick={(sale) => navigate(`/sales/${sale.id || sale._id}`)}
            loading={loading}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Monthly Profitability Chart */}
        {viewMode === 'monthly' && (
          <MonthlyProfitabilityChart
            sales={sales}
            selectedCurrency={selectedCurrency}
            onMonthClick={(month) => {
              // Filter sales by month and show in comprehensive view
              const monthSales = sales.filter(sale => {
                const saleDate = new Date(sale.createdAt);
                return saleDate.getFullYear() === month.year && saleDate.getMonth() + 1 === month.month;
              });
              // You could implement a modal or navigate to filtered view
              console.log('Month clicked:', month, 'Sales:', monthSales);
            }}
          />
        )}

        {/* Financial Summary */}
        {viewMode === 'financial' && (
          <FinancialSummary
            sales={sales}
            selectedCurrency={selectedCurrency}
            period="all"
          />
        )}

        {/* Traditional View */}
        {viewMode === 'traditional' && (
          <>
            {/* Passengers Table - Moved above Sales Table for better UX */}
            <div className="card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-dark-100">Sales by Passengers</h2>
          </div>
          {clients.length === 0 ? (
            <div className="py-20 px-6">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  {Object.values(debouncedFilters).some(f => f) ? 'No passengers found' : 'No passengers yet'}
                </h3>
              </div>
              <div className="text-center">
                <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                  {Object.values(debouncedFilters).some(f => f) ? 'Try adjusting your filter criteria' : 'Get started by creating your first passenger'}
                </p>
                {!Object.values(debouncedFilters).some(f => f) && (
                  <button
                    onClick={() => navigate('/clients')}
                    className="btn-primary"
                  >
                    Go to Passengers
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="w-full">
                <table className="w-full divide-y divide-white/10 table-fixed">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="w-48 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th className="w-24 px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Sales Count
                      </th>
                      <th className="w-32 px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="w-32 px-6 py-3 text-right text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Total Profit
                      </th>
                      <th className="w-32 px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Latest Sale
                      </th>
                      <th className="w-24 px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-32 px-6 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {clients.filter(client => {
                      // Filter clients that have sales in the selected currency
                      return client.sales && client.sales.some(sale => sale.saleCurrency === selectedCurrency);
                    }).map((client) => {
                      // Filter sales by selected currency
                      const filteredSales = client.sales.filter(sale => sale.saleCurrency === selectedCurrency);
                      
                      return (
                      <tr key={client._id} className="table-row cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {getInitials(client.name, client.surname)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-dark-100 truncate">
                                {client.name.toUpperCase()} {client.surname.toUpperCase()}
                                {!client.isMainClient && (
                                  <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                    Acompañante
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-dark-400 truncate">
                                DNI: {client.dni || 'No DNI'} | {client.email || 'No email'}
                              </div>
                              <div className="text-sm text-dark-400 truncate">
                                Phone: {client.phone || 'No phone'} | Passport: {client.passportNumber || 'No passport'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100 text-center">
                          {filteredSales.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100 text-right">
                          <CurrencyDisplay>
                            {(() => {
                              const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalSalePrice || 0), 0);
                              return formatCurrencyJSX(totalSales, selectedCurrency, 'en-US', '');
                            })()}
                          </CurrencyDisplay>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-100 text-right">
                          <CurrencyDisplay>
                            {(() => {
                              const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
                              return formatCurrencyJSX(totalProfit, selectedCurrency, 'en-US', '');
                            })()}
                          </CurrencyDisplay>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-400 text-center">
                          {client.latestSale ? formatDate(client.latestSale.createdAt) : 'No sales'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`badge ${client.hasSales ? 'badge-success' : 'badge-secondary'} justify-center`}>
                            {client.hasSales ? 'HAS SALES' : 'NO SALES'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                          <div className="flex flex-col space-y-1">
                            {client.hasSales ? (
                              <button
                                onClick={() => navigate(`/sales/${client.latestSale._id}`)}
                                className="text-primary-400 hover:text-primary-300 text-xs"
                              >
                                View Latest Sale
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/sales/wizard?clientId=${client._id}`)}
                                className="text-primary-400 hover:text-primary-300 text-xs"
                              >
                                Create Sale
                              </button>
                            )}
                            {!client.isMainClient && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await api.post(`/api/clients/${client._id}/promote`);
                                    if (response.data.success) {
                                      // Refresh the data
                                      fetchClients(false);
                                    }
                                  } catch (error) {
                                    console.error('Error promoting Acompañante:', error);
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                                title="Promote to Main Passenger"
                              >
                                Promote
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls for Passengers */}
              {totalClients > 0 && (
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Rows per page selector */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-dark-300">Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                        className="input-field text-sm py-1 px-2 w-16"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-dark-300">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalClients)} of {totalClients} passengers
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-dark-300 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sales Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-dark-100">Sales Overview</h2>
          </div>
          {sales.length === 0 ? (
            <div className="py-20 px-6">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  {Object.values(debouncedFilters).some(f => f) ? 'No sales found' : 'No sales yet'}
                </h3>
              </div>
              <div className="text-center">
                <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                  {Object.values(debouncedFilters).some(f => f) ? 'Try adjusting your filter criteria' : 'Get started by creating your first sale'}
                </p>
                {!Object.values(debouncedFilters).some(f => f) && (
                  <button
                    onClick={() => navigate('/sales/new')}
                    className="btn-primary"
                  >
                    Create First Sale
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full divide-y divide-white/10 table-fixed min-w-[1200px]">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="w-48 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Acompañantes
                      </th>
                      <th className="w-28 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Services
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Total Sale
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Salesperson
                      </th>
                      <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sales.filter(sale => sale.saleCurrency === selectedCurrency).map((sale) => {
                      const earliestStartDate = getEarliestStartDate(sale);
                      const latestEndDate = getLatestEndDate(sale);
                      
                      return (
                      <tr key={sale.id || sale._id || Math.random()} className="table-row cursor-pointer">
                        <td className="px-6 py-4">
                          <div>
                            <TruncatedText 
                              text={`${sale.clientId?.name} ${sale.clientId?.surname}`}
                              className="text-sm font-medium text-dark-100"
                              title={`${sale.clientId?.name} ${sale.clientId?.surname}`}
                            />
                            <TruncatedText 
                              text={sale.clientId?.email}
                              className="text-sm text-dark-400"
                              title={sale.clientId?.email}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-100">
                            {sale.passengers.length} Passenger{sale.passengers.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-100">
                            {sale.services.length} service{sale.services.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-100">
                            <CurrencyDisplay>{formatCurrencyJSX(sale.totalSalePrice, selectedCurrency, 'en-US', '')}</CurrencyDisplay>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-100">
                            <CurrencyDisplay>{formatCurrencyJSX(sale.totalCost, selectedCurrency, 'en-US', '')}</CurrencyDisplay>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            sale.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <CurrencyDisplay>{formatCurrencyJSX(sale.profit, selectedCurrency, 'en-US', '')}</CurrencyDisplay>
                          </div>
                          <div className="text-xs text-dark-400">
                            {sale.totalSalePrice > 0 ? Math.round((sale.profit / sale.totalSalePrice) * 100) : 0}% margin
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <span className="badge badge-primary w-20 justify-center">
                              {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/sales/${sale.id || sale._id}`)}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            View Details
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-dark-100">
                            {earliestStartDate ? earliestStartDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-dark-100">
                            {latestEndDate ? latestEndDate.toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <TruncatedText 
                            text={sale.createdBy?.fullName || sale.createdBy?.username || 'Unknown'}
                            className="text-sm text-dark-100"
                            title={sale.createdBy?.fullName || sale.createdBy?.username || 'Unknown'}
                          />
                          <TruncatedText 
                            text={sale.createdBy?.role || ''}
                            className="text-xs text-dark-400"
                            title={sale.createdBy?.role || ''}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <TruncatedText 
                            text={new Date(sale.createdAt).toLocaleDateString()}
                            className="text-sm text-dark-400"
                            title={new Date(sale.createdAt).toLocaleDateString()}
                          />
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalSales > 0 && (
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Rows per page selector */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-dark-300">Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                        className="input-field text-sm py-1 px-2 w-16"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-dark-300">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalSales)} of {totalSales} sales
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-dark-300 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesList;