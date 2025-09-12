import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalSales, setTotalSales] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    minProfit: '',
    maxProfit: '',
    startDate: '',
    endDate: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState({
    status: '',
    minProfit: '',
    maxProfit: '',
    startDate: '',
    endDate: ''
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

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

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

      const response = await axios.get(`http://localhost:5000/api/sales?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSales(response.data.data.sales);
        setTotalPages(response.data.data.pages);
        setTotalSales(response.data.data.total);
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

  // Initial load effect
  useEffect(() => {
    fetchSales(true);
  }, []); // Only run on mount

  // Search and filter effect
  useEffect(() => {
    if (loading) return; // Don't fetch if still on initial load
    fetchSales(false);
  }, [currentPage, debouncedFilters, rowsPerPage, loading]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      minProfit: '',
      maxProfit: '',
      startDate: '',
      endDate: ''
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Status
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

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Min Profit
              </label>
              <input
                type="number"
                value={filters.minProfit}
                onChange={(e) => handleFilterChange('minProfit', e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Max Profit
              </label>
              <input
                type="number"
                value={filters.maxProfit}
                onChange={(e) => handleFilterChange('maxProfit', e.target.value)}
                placeholder="10000"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
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
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="card overflow-hidden">
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
              <div className="w-full">
                <table className="w-full divide-y divide-white/10 table-fixed">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Sale ID
                      </th>
                      <th className="w-48 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Passengers
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Services
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Total Sale
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sales.map((sale) => (
                      <tr key={sale.id || sale._id || Math.random()} className="table-row cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-100">
                            #{(sale.id || sale._id || 'unknown').toString().slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-dark-100 truncate">
                              {sale.clientId?.name} {sale.clientId?.surname}
                            </div>
                            <div className="text-sm text-dark-400 truncate">
                              {sale.clientId?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-100">
                            {sale.passengers.length} passenger{sale.passengers.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-100">
                            {sale.services.length} service{sale.services.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-100">
                            {formatCurrency(sale.totalSalePrice)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            sale.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(sale.profit)}
                          </div>
                          <div className="text-xs text-dark-400">
                            {sale.profitMargin}% margin
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="badge badge-primary w-24 justify-center">
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-400">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/sales/${sale.id || sale._id}`)}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
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
      </div>
    </div>
  );
};

export default SalesList;