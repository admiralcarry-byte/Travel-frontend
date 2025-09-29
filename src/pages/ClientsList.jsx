import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ClientsList = () => {
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
    // Always fetch clients when search term, page, or rows per page changes
    // This ensures that clearing the search (empty string) also triggers a fetch
    fetchClients(false);
  }, [currentPage, debouncedSearchTerm, rowsPerPage]);

  const fetchClients = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const response = await api.get('/api/clients/all-passengers', {
        params: {
          page: currentPage,
          limit: rowsPerPage,
          search: debouncedSearchTerm,
          type: 'all'
        }
      });
      setClients(response.data.data.passengers || []);
      setTotalClients(response.data.data.total || 0);
      setTotalPages(response.data.data.pages || 1);
      setError('');
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load passengers. Please try again.');
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

  const handleClientClick = (clientId, client) => {
    // If it's a companion (Passenger record), navigate to the main client's details
    if (client && client.relationshipType === 'companion' && client.clientId) {
      navigate(`/clients/${client.clientId._id || client.clientId}`);
    } else {
      // If it's a main client, navigate to its details
      navigate(`/clients/${clientId}`);
    }
  };

  const handlePromoteCompanion = async (clientId) => {
    try {
      const response = await api.post(`/api/clients/${clientId}/promote`);
      if (response.data.success) {
        // Refresh the list
        fetchClients(false);
        setError(''); // Clear any previous errors
      }
    } catch (error) {
      console.error('Error promoting companion:', error);
      const errorMessage = error.response?.data?.message || 'Failed to promote Acompañante. Please try again.';
      setError(errorMessage);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading Passengers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Modern Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Passenger Management
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto">
            Manage your passenger records, track passenger information, and maintain comprehensive travel documentation
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

        {/* Modern Search Section */}
        <div className="card-glass p-6">
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-500 mr-2"></div>
              <span className="text-sm text-dark-300">Searching...</span>
            </div>
          )}
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* Search Input */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-dark-200 mb-4">
                  Search Passengers
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by name, DNI/CUIT, email, or passport number..."
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
                <button
                  onClick={() => navigate('/clients/new')}
                  className="btn-primary w-full lg:w-auto"
                >
                  <span className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add New Passenger</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-dark-100">Travel Passengers</h4>
              <button
                onClick={() => navigate('/clients/new')}
                className="btn-primary text-sm"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Passenger</span>
                </span>
              </button>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="py-20 px-6">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-accent-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  {searchTerm ? 'No passengers found' : 'No passengers yet'}
                </h3>
              </div>
              <div className="text-center">
                <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                  {searchTerm 
                    ? 'Try adjusting your search terms or clear the search to see all passengers.' 
                    : 'Get started by adding your first passenger to begin managing your travel business.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/clients/new')}
                    className="btn-primary"
                  >
                    Add Your First Passenger
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/10">
                {clients.map((client) => (
                  <div key={client._id || client.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg">
                          <span className="text-lg font-bold text-white">
                            {client.name?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-dark-100">
                            {client.name || 'Unknown Passenger'} {client.surname || ''}
                            {!client.isMainClient && (
                              <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                Acompañante
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-dark-300">
                            DNI: {client.dni || 'No DNI'} | {client.email || 'No email'}
                          </div>
                          <div className="text-xs text-dark-400">
                            Phone: {client.phone || 'No phone'} | Passport: {client.passportNumber || 'No passport'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`badge ${client.status === 'active'
                            ? 'badge-success'
                            : 'badge-warning'
                          }`}>
                          {client.status || 'active'}
                        </span>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleClientClick(client._id || client.id, client)}
                            className="btn-primary text-sm"
                          >
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View Details</span>
                            </span>
                          </button>
                          
                          {!client.isMainClient && (
                            <button
                              onClick={() => handlePromoteCompanion(client._id || client.id)}
                              className="btn-secondary text-sm"
                              title="Promote to Main Passenger"
                            >
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <span>Promote</span>
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalClients)} of {totalClients} passenger
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

export default ClientsList;