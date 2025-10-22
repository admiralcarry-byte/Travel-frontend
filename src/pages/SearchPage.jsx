import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { t } from '../utils/i18n';
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

const SearchPage = () => {
  const navigate = useNavigate();
  const { formatCurrencyJSX } = useCurrencyFormat();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalSales, setTotalSales] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Refs to track current values for stable fetchSales function
  const currentPageRef = useRef(currentPage);
  const rowsPerPageRef = useRef(rowsPerPage);
  const debouncedSearchTermRef = useRef(debouncedSearchTerm);
  
  // Update refs when values change
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  }, [rowsPerPage]);
  
  useEffect(() => {
    debouncedSearchTermRef.current = debouncedSearchTerm;
  }, [debouncedSearchTerm]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        search: debouncedSearchTermRef.current
      });

      console.log('Fetching sales with search term:', debouncedSearchTermRef.current);
      console.log('API URL:', `/api/sales/search?${params}`);

      const response = await api.get(`/api/sales/search?${params}`);

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

  // Initial load effect - fetch all sales
  useEffect(() => {
    fetchSales(true);
  }, []); // Run once on mount

  // Search effect - fetch when search term changes
  useEffect(() => {
    if (loading) return; // Don't fetch if still on initial load
    fetchSales(false);
  }, [currentPage, debouncedSearchTerm, rowsPerPage, loading]);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            Quick Search
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Search sales by passenger name, email, DNI, or acompañante information
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

        {/* Search Input */}
        <div className="card-glass p-6 mb-6">
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-500 mr-2"></div>
              <span className="text-sm text-dark-300">Searching...</span>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Search Sales
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by passenger name, email, DNI, or acompañante information..."
                className="input-field w-full"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="px-4 py-3 text-sm font-medium text-white bg-dark-600 hover:bg-dark-500 border border-white/20 rounded-md h-12"
              >
                Clear Search
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-dark-100">Search Results</h2>
            <p className="text-sm text-dark-300 mt-1">
              {totalSales > 0 ? `Found ${totalSales} sales` : 'No sales found'}
            </p>
          </div>
          {sales.length === 0 ? (
            <div className="py-20 px-6">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  {searchTerm ? 'No sales found' : 'No sales yet'}
                </h3>
              </div>
              <div className="text-center">
                <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first sale'}
                </p>
                {!searchTerm && (
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
                        Main Passenger
                      </th>
                      <th className="w-32 px-6 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider">
                        Companions
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
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sales.map((sale) => {
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
                              <TruncatedText 
                                text={`DNI: ${sale.clientId?.dni || 'No DNI'}`}
                                className="text-sm text-dark-400"
                                title={`DNI: ${sale.clientId?.dni || 'No DNI'}`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-100">
                              {sale.passengers.length} Passenger{sale.passengers.length !== 1 ? 's' : ''}
                            </div>
                            {sale.passengers.length > 1 && (
                              <div className="text-xs text-dark-400 mt-1">
                                {sale.passengers.slice(1).map((passenger, index) => (
                                  <div key={index}>
                                    {passenger.name} {passenger.surname}
                                    {passenger.email && ` (${passenger.email})`}
                                    {passenger.dni && ` - DNI: ${passenger.dni}`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-dark-100">
                              {sale.services.length} service{sale.services.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-dark-100">
                              {formatCurrencyJSX(sale.totalSalePrice, sale.saleCurrency, 'en-US', '')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-dark-100">
                              {formatCurrencyJSX(sale.totalCost, sale.saleCurrency, 'en-US', '')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              sale.profit >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrencyJSX(sale.profit, sale.saleCurrency, 'en-US', '')}
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
                            <TruncatedText 
                              text={formatDate(sale.createdAt)}
                              className="text-sm text-dark-400"
                              title={formatDate(sale.createdAt)}
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
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
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
      </div>
    </div>
  );
};

export default SearchPage;
