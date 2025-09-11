import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServicesList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const serviceTypes = [
    { value: '', label: 'All Types' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'airline', label: 'Airlines' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'excursion', label: 'Excursions' },
    { value: 'insurance', label: 'Insurance' }
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load effect
  useEffect(() => {
    fetchServices(true);
    fetchProviders();
  }, []);

  // Search and filter effect
  useEffect(() => {
    if (debouncedSearchTerm !== '' || typeFilter !== '' || providerFilter !== '' || currentPage !== 1) {
      fetchServices(false);
    }
  }, [currentPage, debouncedSearchTerm, typeFilter, providerFilter]);

  const fetchServices = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12, // Show 12 services per page for card layout
        search: debouncedSearchTerm,
        type: typeFilter,
        providerId: providerFilter
      });

      const response = await axios.get(`http://localhost:5000/api/services?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setServices(response.data.data.services);
        setTotalPages(response.data.data.pages);
        setError('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch services');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, [currentPage, debouncedSearchTerm, typeFilter, providerFilter]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/providers?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleProviderFilter = (e) => {
    setProviderFilter(e.target.value);
    setCurrentPage(1);
  };

  const getTypeColor = (type) => {
    const colors = {
      hotel: 'bg-blue-100 text-blue-800',
      airline: 'bg-green-100 text-green-800',
      transfer: 'bg-yellow-100 text-yellow-800',
      excursion: 'bg-purple-100 text-purple-800',
      insurance: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Services
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Browse and manage available services
          </p>
          <button
            onClick={() => navigate('/services/new')}
            className="btn-primary"
          >
            Add New Service
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

        {/* Search and Filters */}
        <div className="card-glass p-6">
          {searchLoading && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-500 mr-2"></div>
              <span className="text-sm text-dark-300">Searching...</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-dark-200 mb-4">
                Search Services
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by title or description..."
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-semibold text-dark-200 mb-4">
                Filter by Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={handleTypeFilter}
                className="input-field"
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="providerFilter" className="block text-sm font-semibold text-dark-200 mb-4">
                Filter by Provider
              </label>
              <select
                id="providerFilter"
                value={providerFilter}
                onChange={handleProviderFilter}
                className="input-field"
              >
                <option value="">All Providers</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="card overflow-hidden">
            <div className="py-20 px-6">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-semibold text-dark-100">
                  {debouncedSearchTerm || typeFilter || providerFilter ? 'No services found' : 'No services yet'}
                </h3>
              </div>
              <div className="text-center">
                <p className="text-dark-300 mb-8 max-w-md mx-auto text-lg">
                  {debouncedSearchTerm || typeFilter || providerFilter ? 'Try adjusting your search or filter criteria' : 'Get started by adding your first service'}
                </p>
                {!debouncedSearchTerm && !typeFilter && !providerFilter && (
                  <button
                    onClick={() => navigate('/services/new')}
                    className="btn-primary"
                  >
                    Add First Service
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {services.map((service) => (
                <div key={service.id} className="card overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  {/* Service Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">
                        {service.type === 'hotel' && '🏨'}
                        {service.type === 'airline' && '✈️'}
                        {service.type === 'transfer' && '🚗'}
                        {service.type === 'excursion' && '🎯'}
                        {service.type === 'insurance' && '🛡️'}
                      </div>
                      <div className="text-sm font-medium">
                        {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Service Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-dark-100 line-clamp-2">
                        {service.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(service.type)}`}>
                        {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                      </span>
                    </div>

                    <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {/* Provider Badge */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-dark-400">
                        <span className="font-medium">Provider:</span>
                        <span className="ml-1 text-primary-400 font-medium">
                          {service.providerId?.name || 'Unknown Provider'}
                        </span>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-dark-100">
                        {service.formattedCost}
                      </div>
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="btn-primary text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card px-4 py-3 flex items-center justify-between border-t border-white/10 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-dark-300">
                      Page <span className="font-medium text-dark-100">{currentPage}</span> of{' '}
                      <span className="font-medium text-dark-100">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServicesList;