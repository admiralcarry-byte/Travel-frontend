import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Button from '../components/Button';
import DataTable from '../components/DataTable';

const ClientsListImproved = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalClients, setTotalClients] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load effect
  useEffect(() => {
    fetchClients(true);
  }, []);

  // Search and pagination effect
  useEffect(() => {
    fetchClients(false);
  }, [currentPage, debouncedSearchTerm, rowsPerPage]);

  const fetchClients = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const response = await api.get('/api/clients', {
        params: {
          page: currentPage,
          limit: rowsPerPage,
          search: debouncedSearchTerm
        }
      });
      
      setClients(response.data.data.clients || []);
      setTotalClients(response.data.data.total || 0);
      setTotalPages(response.data.data.pages || 1);
      setError('');
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again.');
      setClients([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, [currentPage, debouncedSearchTerm, rowsPerPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClientClick = (client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRetry = () => {
    fetchClients(true);
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-dark-100">
            {row.name} {row.surname}
          </div>
          <div className="text-sm text-dark-400">{row.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => (
        <span className="text-dark-300">{value || 'N/A'}</span>
      )
    },
    {
      key: 'passportNumber',
      header: 'Passport',
      render: (value) => (
        <span className="text-dark-300 font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'nationality',
      header: 'Nationality',
      render: (value) => (
        <span className="text-dark-300">{value}</span>
      )
    },
    {
      key: 'expirationDate',
      header: 'Passport Expiry',
      render: (value) => {
        const expiryDate = new Date(value);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let badgeClass = 'badge-success';
        if (daysUntilExpiry < 0) {
          badgeClass = 'badge-error';
        } else if (daysUntilExpiry < 90) {
          badgeClass = 'badge-warning';
        }
        
        return (
          <div>
            <span className={`badge ${badgeClass}`}>
              {expiryDate.toLocaleDateString()}
            </span>
            {daysUntilExpiry < 90 && (
              <div className="text-xs text-dark-400 mt-1">
                {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days left`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (value) => (
        <span className="text-dark-100 font-medium">
          ${value ? value.toLocaleString() : '0'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading clients..." />
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <ErrorDisplay
        error={error}
        title="Failed to Load Clients"
        onRetry={handleRetry}
        retryText="Retry"
        backButtonPath="/dashboard"
        backButtonText="Go to Dashboard"
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Client Management
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto">
            Manage your client records, track passenger information, and maintain comprehensive travel documentation
          </p>
        </div>

        {/* Search and Actions */}
        <div className="card-glass p-6">
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <LoadingSpinner size="small" message="Searching..." />
            </div>
          )}
          
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* Search Input */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-dark-200 mb-4">
                  Search Clients
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by name, email, or passport number..."
                    className="input-field pl-12"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Add New Client Button */}
              <div className="lg:ml-6">
                <Button
                  onClick={() => navigate('/clients/new')}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                  iconPosition="left"
                >
                  Add New Client
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display (if there's an error but we have some data) */}
        {error && clients.length > 0 && (
          <div className="bg-warning-500/10 border border-warning-500/20 text-warning-400 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Clients Table */}
        <DataTable
          data={clients}
          columns={columns}
          loading={false} // We handle loading at the page level
          error={null} // We handle errors at the page level
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalClients}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleClientClick}
          emptyMessage="No clients found. Try adjusting your search criteria or add a new client."
          className="min-h-96"
        />
      </div>
    </div>
  );
};

export default ClientsListImproved;