import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ClientSalesView = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalClients, setTotalClients] = useState(0);
  const [filters, setFilters] = useState({
    includeNoSales: 'true',
    search: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState({
    includeNoSales: 'true',
    search: ''
  });
  
  // Column width state
  const [columnWidths, setColumnWidths] = useState({
    client: 280,
    salesCount: 100,
    totalSales: 120,
    totalProfit: 120,
    latestSale: 120,
    status: 100,
    created: 100,
    action: 120
  });
  
  // Refs to track current values for stable fetchClients function
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

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

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
        ...debouncedFiltersRef.current
      });

      const response = await api.get(`/api/clients/with-sales?${params}`);

      if (response.data.success) {
        setClients(response.data.data.clients);
        setTotalPages(response.data.data.pages);
        setTotalClients(response.data.data.total);
        setError('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch clients');
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
    fetchClients(true);
  }, []); // Only run on mount

  // Search and filter effect
  useEffect(() => {
    if (loading) return; // Don't fetch if still on initial load
    fetchClients(false);
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
      includeNoSales: 'true',
      search: ''
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

  const handleColumnResize = (columnKey) => {
    const expansionSizes = {
      client: { normal: 280, expanded: 400 },
      salesCount: { normal: 100, expanded: 150 },
      totalSales: { normal: 120, expanded: 180 },
      totalProfit: { normal: 120, expanded: 180 },
      latestSale: { normal: 120, expanded: 180 },
      status: { normal: 100, expanded: 150 },
      created: { normal: 100, expanded: 150 },
      action: { normal: 120, expanded: 180 }
    };
    
    const currentWidth = columnWidths[columnKey];
    const sizes = expansionSizes[columnKey];
    const newWidth = currentWidth === sizes.normal ? sizes.expanded : sizes.normal;
    
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: newWidth
    }));
  };

  const getStatusColor = (hasSales) => {
    if (hasSales) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name, surname) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Client Sales Overview
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            View all clients and their sales information
          </p>
        </div>

        {/* Filters */}
        <div className="card-glass p-6 mb-6">
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-500 mr-2"></div>
              <span className="text-sm text-dark-300">Searching...</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Search Clients
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name, email, or passport..."
                className="input-field w-full"
              />
            </div>

            {/* Include No Sales Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Show Clients
              </label>
              <select
                value={filters.includeNoSales}
                onChange={(e) => handleFilterChange('includeNoSales', e.target.value)}
                className="input-field w-full"
              >
                <option value="true">All Clients (with and without sales)</option>
                <option value="false">Only Clients with Sales</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-dark-300">Loading clients...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-dark-400">No clients found matching your criteria.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full divide-y divide-white/10" style={{ minWidth: '1000px' }}>
                  <thead className="bg-dark-700">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.client}px` }}
                        onDoubleClick={() => handleColumnResize('client')}
                        title="Double-click to expand/collapse column"
                      >
                        CLIENT
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.salesCount}px` }}
                        onDoubleClick={() => handleColumnResize('salesCount')}
                        title="Double-click to expand/collapse column"
                      >
                        SALES COUNT
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.totalSales}px` }}
                        onDoubleClick={() => handleColumnResize('totalSales')}
                        title="Double-click to expand/collapse column"
                      >
                        TOTAL SALES
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.totalProfit}px` }}
                        onDoubleClick={() => handleColumnResize('totalProfit')}
                        title="Double-click to expand/collapse column"
                      >
                        TOTAL PROFIT
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.latestSale}px` }}
                        onDoubleClick={() => handleColumnResize('latestSale')}
                        title="Double-click to expand/collapse column"
                      >
                        LATEST SALE
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.status}px` }}
                        onDoubleClick={() => handleColumnResize('status')}
                        title="Double-click to expand/collapse column"
                      >
                        STATUS
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.created}px` }}
                        onDoubleClick={() => handleColumnResize('created')}
                        title="Double-click to expand/collapse column"
                      >
                        CREATED
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider cursor-pointer hover:bg-dark-600 transition-colors"
                        style={{ width: `${columnWidths.action}px` }}
                        onDoubleClick={() => handleColumnResize('action')}
                        title="Double-click to expand/collapse column"
                      >
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {clients.map((client) => (
                      <tr key={client._id} className="table-row cursor-pointer">
                        <td 
                          className="px-4 py-4 text-sm"
                          style={{ width: `${columnWidths.client}px` }}
                        >
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
                              </div>
                              <div className="text-sm text-dark-400 truncate">
                                {client.email}
                              </div>
                              <div className="text-sm text-dark-400 truncate">
                                Phone: {client.phone} | Passport: {client.passportNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td 
                          className="px-4 py-4 text-sm text-dark-300 text-center"
                          style={{ width: `${columnWidths.salesCount}px` }}
                        >
                          {client.salesCount}
                        </td>
                        <td 
                          className="px-4 py-4 text-sm text-dark-300 text-right"
                          style={{ width: `${columnWidths.totalSales}px` }}
                        >
                          {formatCurrency(client.totalSales)}
                        </td>
                        <td 
                          className="px-4 py-4 text-sm text-dark-300 text-right"
                          style={{ width: `${columnWidths.totalProfit}px` }}
                        >
                          {formatCurrency(client.totalProfit)}
                        </td>
                        <td 
                          className="px-4 py-4 text-sm text-dark-300 text-center"
                          style={{ width: `${columnWidths.latestSale}px` }}
                        >
                          {client.latestSale ? formatDate(client.latestSale.createdAt) : 'No sales'}
                        </td>
                        <td 
                          className="px-4 py-4 text-center"
                          style={{ width: `${columnWidths.status}px` }}
                        >
                          <span className={`badge ${client.hasSales ? 'badge-success' : 'badge-secondary'} justify-center`}>
                            {client.hasSales ? 'HAS SALES' : 'NO SALES'}
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 text-sm text-dark-400 text-center"
                          style={{ width: `${columnWidths.created}px` }}
                        >
                          {formatDate(client.createdAt)}
                        </td>
                        <td 
                          className="px-4 py-4 text-sm font-medium text-center"
                          style={{ width: `${columnWidths.action}px` }}
                        >
                          {client.hasSales ? (
                            <button
                              onClick={() => navigate(`/sales/${client.latestSale._id}`)}
                              className="text-primary-400 hover:text-primary-300 truncate block w-full"
                              title="View Latest Sale"
                            >
                              View Latest Sale
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/sales/wizard?clientId=${client._id}`)}
                              className="text-primary-400 hover:text-primary-300 truncate block w-full"
                              title="Create Sale"
                            >
                              Create Sale
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
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
                      </select>
                    </div>

                    {/* Page info */}
                    <div className="text-sm text-dark-300">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalClients)} of {totalClients} clients
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`btn-secondary text-sm px-3 py-1 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-dark-300 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`btn-secondary text-sm px-3 py-1 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default ClientSalesView;