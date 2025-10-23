import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ServicesList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load effect
  useEffect(() => {
    fetchServices(true);
    fetchProviders();
    fetchServiceTypes();
  }, []);

  // Search and filter effect
  useEffect(() => {
    fetchServices(false);
  }, [currentPage, debouncedSearchTerm, typeFilter, providerFilter]);


  const fetchServiceTypes = async () => {
    try {
      const response = await api.get('/api/provider-types/active');
      if (response.data.success) {
        const types = response.data.data.providerTypes.map(type => ({
          value: type.name,
          label: type.name
        }));
        setServiceTypes([{ value: '', label: 'All Types' }, ...types]);
      }
    } catch (error) {
      console.error('Failed to fetch service types:', error);
    }
  };

  const fetchServices = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 6 // Show 6 services per page (3 rows × 2 columns)
      });

      // Only add search and filter parameters if they have values
      if (debouncedSearchTerm.trim() !== '') {
        params.append('search', debouncedSearchTerm.trim());
      }
      if (typeFilter !== '') {
        params.append('type', typeFilter);
      }
      if (providerFilter !== '') {
        params.append('providerId', providerFilter);
      }

      const response = await api.get(`/api/services?${params}`);

      if (response.data.success) {
        // Show all services without filtering by hard-coded types
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
      const response = await api.get('/api/providers?limit=100');

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

  const getServiceTypeIcon = (type) => {
    const icons = {
      hotel: '🏨',
      airline: '✈️',
      transfer: '🚗',
      excursion: '🎯',
      insurance: '🛡️',
      restaurant: '🍽️',
      tour_guide: '👨‍🏫',
      car_rental: '🚙',
      medical_assistance: '🏥'
    };
    return icons[type] || '📋';
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
                  <option key={provider._id || provider.id} value={provider._id || provider.id}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {services.map((service) => (
                <div key={service._id || service.id} className="card overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  {/* Service Image */}
                  {service.type === 'hotel' ? (
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src="/hotel/1.jpg"
                        alt="Hotel service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7l8-4v18" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V11l-6-4" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v.01" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12v.01" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15v.01" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18v.01" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium">Hotel</div>
                        </div>
                      </div>
                    </div>
                  ) : service.type === 'airline' ? (
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src="/airline/1.jpg"
                        alt="Airline service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l10 5 10-5" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium">Airline</div>
                        </div>
                      </div>
                    </div>
                  ) : service.type === 'excursion' ? (
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src="/excursion/1.jpg"
                        alt="Excursion service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l10 5 10-5" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium">Excursion</div>
                        </div>
                      </div>
                    </div>
                  ) : service.type === 'transfer' ? (
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src="/transfer/1.jpeg"
                        alt="Transfer service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium">Transfer</div>
                        </div>
                      </div>
                    </div>
                  ) : service.type === 'insurance' ? (
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src="/insurance/1.webp"
                        alt="Insurance service"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium">Insurance</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 1v6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 1v6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17v6" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium">
                          {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Content */}
                  <div className="p-6 notranslate" translate="no">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-dark-100 line-clamp-2">
                        {service.destino}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(service.type)}`}>
                        {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                      </span>
                    </div>

                    <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {/* Providers Badge */}
                    <div className="mb-4">
                      <div className="text-sm text-dark-400">
                        <span className="font-medium">Providers:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {service.allProviders && service.allProviders.length > 0 ? (
                            service.allProviders.map((provider, index) => (
                              <span 
                                key={provider._id || index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30"
                              >
                                {provider.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-primary-400 font-medium">
                              {service.providerId?.name || 'Unknown Provider'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-dark-100">
                        {service.formattedCost}
                      </div>
                      <button
                        onClick={() => navigate(`/services/${service._id || service.id}`)}
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
                {/* Mobile pagination */}
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-dark-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                
                {/* Desktop pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-dark-300">
                      Showing <span className="font-medium text-dark-100">{((currentPage - 1) * 6) + 1}</span> to{' '}
                      <span className="font-medium text-dark-100">{Math.min(currentPage * 6, services.length + ((currentPage - 1) * 6))}</span> of{' '}
                      <span className="font-medium text-dark-100">{totalPages * 6}</span> results
                    </p>
                    <p className="text-xs text-dark-400 mt-1">
                      Page <span className="font-medium text-dark-100">{currentPage}</span> of{' '}
                      <span className="font-medium text-dark-100">{totalPages}</span> (6 cards per page)
                    </p>
                  </div>
                  
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {/* First page */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/20 bg-dark-800/50 text-sm font-medium text-dark-300 hover:bg-dark-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">First</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Previous page */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-white/20 bg-dark-800/50 text-sm font-medium text-dark-300 hover:bg-dark-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-primary-600 border-primary-500 text-white'
                                : 'bg-dark-800/50 border-white/20 text-dark-300 hover:bg-dark-700/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {/* Next page */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-white/20 bg-dark-800/50 text-sm font-medium text-dark-300 hover:bg-dark-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Last page */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/20 bg-dark-800/50 text-sm font-medium text-dark-300 hover:bg-dark-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Last</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
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