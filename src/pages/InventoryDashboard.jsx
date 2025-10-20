import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSeller, loading: authLoading } = useAuth();
  const [cupos, setCupos] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    serviceId: '',
    status: '',
    minAvailableSeats: '',
    date: '',
    completionDate: ''
  });
  const [debouncedFilters, setDebouncedFilters] = useState({
    serviceId: '',
    status: '',
    minAvailableSeats: '',
    date: '',
    completionDate: ''
  });

  const debouncedFiltersRef = useRef(debouncedFilters);
  const currentPageRef = useRef(currentPage);

  // Update refs when values change
  useEffect(() => {
    debouncedFiltersRef.current = debouncedFilters;
  }, [debouncedFilters]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const dismissError = () => {
    setError('');
  };

  const statusOptions = useMemo(() => [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'sold_out', label: 'Sold Out' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ], []);

  const fetchCupos = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // Filter out empty values from filters
      const activeFilters = Object.fromEntries(
        Object.entries(debouncedFiltersRef.current).filter(([_, value]) => value !== '')
      );
      
      const params = new URLSearchParams({
        page: currentPageRef.current,
        limit: 12,
        ...activeFilters
      });

      const response = await api.get(`/api/cupos?${params}`);

      if (response.data.success) {
        setCupos(response.data.data.cupos);
        setTotalPages(response.data.data.pages);
        setError('');
      }
    } catch (error) {
      console.error('Failed to fetch cupos:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        // Redirect to login if not authenticated
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('Access denied. You need admin or seller permissions to view cupos.');
      } else if (error.response?.status === 404) {
        setError('Cupos endpoint not found. Please check your connection.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch cupos');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get('/api/services?limit=100');

      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  }, []);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  // Check authentication and role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (!isAdmin && !isSeller) {
        setError('Access denied. You need admin or seller permissions to view cupos.');
        return;
      }
      
      // Only fetch data if user has proper role
      if (isAdmin || isSeller) {
        fetchCupos(true);
        fetchServices();
      }
    }
  }, [authLoading, user, isAdmin, isSeller, navigate, fetchCupos, fetchServices]);

  // Search and filter effect
  useEffect(() => {
    if (loading) return; // Don't fetch if still on initial load
    fetchCupos(false);
  }, [currentPage, debouncedFilters, fetchCupos, loading]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      serviceId: '',
      status: '',
      minAvailableSeats: '',
      date: '',
      completionDate: ''
    });
    setCurrentPage(1);
  }, []);

  const handleReserve = useCallback((cupo) => {
    // Check if required data exists
    if (!cupo.serviceId || (!cupo.serviceId.id && !cupo.serviceId._id)) {
      setError('Invalid service data. Cannot create reservation.');
      return;
    }

    if (!cupo.serviceId.providerId || (!cupo.serviceId.providerId.id && !cupo.serviceId.providerId._id)) {
        setError(`Invalid provider data. Service: ${cupo.serviceId.destino}, Provider: ${cupo.serviceId.providerId ? 'exists but no ID' : 'missing'}. Cannot create reservation.`);
      return;
    }

    // Navigate to unified SaleWizard with cupo data
    navigate('/sales/new', { 
      state: { 
        cupo: cupo
      }
    });
  }, [navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-dark-300">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (loading && cupos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading slots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Cupos Dashboard
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Manage pre-purchased cupos and reservations
          </p>
          <button
            onClick={() => navigate('/cupos/new')}
            className="btn-primary"
          >
            Add New Cupo
          </button>
        </div>

        {error && (
          <div className="notification">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container bg-error-500">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-error-400 font-medium text-lg">{error}</span>
              </div>
              <button
                onClick={dismissError}
                className="text-error-400 hover:text-error-300 transition-colors p-1 rounded-full hover:bg-error-500/10"
                title="Dismiss error"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card-glass p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Service
              </label>
              <select
                value={filters.serviceId}
                onChange={(e) => handleFilterChange('serviceId', e.target.value)}
                className="input-field"
              >
                <option value="">All Services</option>
                {services.map((service, index) => (
                  <option key={service._id || service.id || `service-${index}`} value={service._id || service.id}>
                        {service.destino}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                {statusOptions.map((option, index) => (
                  <option key={option.value || `status-${index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Min Available Seats
              </label>
              <input
                type="number"
                value={filters.minAvailableSeats}
                onChange={(e) => handleFilterChange('minAvailableSeats', e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Start Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Completion Date
              </label>
              <input
                type="date"
                value={filters.completionDate}
                onChange={(e) => handleFilterChange('completionDate', e.target.value)}
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

        {/* Inventory Grid */}
        {cupos.length === 0 ? (
          <div className="card">
            <div className="py-12">
              <div className="flex items-center justify-center mb-6">
                <div className="icon-container bg-primary-500 mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-dark-200 text-xl font-bold">No cupos found</div>
              </div>
              <div className="text-center">
                <p className="text-dark-400 text-sm mb-6">
                  {Object.values(filters).some(f => f) ? 'Try adjusting your filter criteria' : 'Get started by adding your first cupo'}
                </p>
                {!Object.values(filters).some(f => f) && (
                  <button
                    onClick={() => navigate('/cupos/new')}
                    className="btn-primary"
                  >
                    Add First Cupo
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {cupos.map((cupo, index) => (
                <div key={cupo.id || cupo._id || `cupo-${index}`} className="card hover-lift">
                  {/* Service Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-dark-100 line-clamp-2">
                          {cupo.serviceId?.destino}
                        </h3>
                        <p className="text-sm text-dark-300 mt-1">
                          {cupo.serviceId?.providerId?.name}
                        </p>
                        <p className="text-sm text-dark-400">
                          {cupo.serviceId?.typeId?.name || cupo.serviceId?.type} • {cupo.formattedDate}
                        </p>
                        {cupo.metadata.completionDate && (
                          <p className="text-sm text-dark-400">
                            Completion: {new Date(cupo.metadata.completionDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1 min-w-0">
                        <span className={`badge ${
                          cupo.status === 'active' ? 'badge-success' : 
                          cupo.status === 'inactive' ? 'badge-warning' : 
                          cupo.status === 'completed' ? 'badge-secondary' :
                          'badge-error'
                        } justify-center`}>
                          {cupo.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`badge ${cupo.availabilityStatus === 'available' ? 'badge-success' : cupo.availabilityStatus === 'limited_availability' ? 'badge-warning' : 'badge-error'} justify-center`}>
                          {cupo.availabilityStatus === 'limited_availability' ? 'LIMITED AVAIL...' : cupo.availabilityStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Information */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-dark-100">{cupo.totalSeats}</div>
                        <div className="text-xs text-dark-400">Total Seats</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-400">{cupo.reservedSeats}</div>
                        <div className="text-xs text-dark-400">Reserved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success-400">{cupo.availableSeats}</div>
                        <div className="text-xs text-dark-400">Available</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-dark-400 mb-1">
                        <span>Occupancy</span>
                        <span>{cupo.occupancyPercentage}%</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${cupo.occupancyPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {cupo.metadata.roomType && (
                      <div className="text-sm text-dark-300 mb-2">
                        <span className="font-medium">Room Type:</span> {cupo.metadata.roomType}
                      </div>
                    )}
                    {cupo.metadata.flightName && (
                      <div className="text-sm text-dark-300 mb-2">
                        <span className="font-medium">Flight:</span> {cupo.metadata.flightName}
                      </div>
                    )}
                    {cupo.metadata.destination && (
                      <div className="text-sm text-dark-300 mb-2">
                        <span className="font-medium">Destination:</span> {cupo.metadata.destination}
                      </div>
                    )}
                    {cupo.metadata.value && (
                      <div className="text-sm text-dark-300 mb-2">
                        <span className="font-medium">Value:</span> {cupo.metadata.currency === 'USD' ? 'U$' : cupo.metadata.currency === 'ARS' ? 'AR$' : cupo.metadata.currency} {cupo.metadata.value.toLocaleString()}
                      </div>
                    )}
                    {cupo.metadata.providerRef && (
                      <div className="text-sm text-dark-300 mb-4">
                        <span className="font-medium">Provider Ref:</span> {cupo.metadata.providerRef}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReserve(cupo)}
                        disabled={
                          cupo.status === 'completed' ||
                          cupo.availableSeats === 0 || 
                          !cupo.serviceId || 
                          (!cupo.serviceId.id && !cupo.serviceId._id) || 
                          !cupo.serviceId.providerId || 
                          (!cupo.serviceId.providerId.id && !cupo.serviceId.providerId._id)
                        }
                        className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-300 ${
                          cupo.status === 'completed' ||
                          cupo.availableSeats === 0 || 
                          !cupo.serviceId || 
                          (!cupo.serviceId.id && !cupo.serviceId._id) || 
                          !cupo.serviceId.providerId || 
                          (!cupo.serviceId.providerId.id && !cupo.serviceId.providerId._id)
                            ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                            : 'btn-primary'
                        }`}
                        title={
                          cupo.status === 'completed'
                            ? 'Service completed'
                            : !cupo.serviceId || (!cupo.serviceId.id && !cupo.serviceId._id)
                            ? 'Missing service data'
                            : !cupo.serviceId.providerId || (!cupo.serviceId.providerId.id && !cupo.serviceId.providerId._id)
                            ? 'Missing provider data'
                            : cupo.availableSeats === 0
                            ? 'Sold out'
                            : 'Click to reserve'
                        }
                      >
                        {cupo.status === 'completed'
                          ? 'Completed'
                          : cupo.availableSeats === 0 
                          ? 'Sold Out' 
                          : !cupo.serviceId || (!cupo.serviceId.id && !cupo.serviceId._id)
                          ? 'No Service'
                          : !cupo.serviceId.providerId || (!cupo.serviceId.providerId.id && !cupo.serviceId.providerId._id)
                          ? 'No Provider'
                          : 'Reserve'
                        }
                      </button>
                      <button
                        onClick={() => navigate(`/cupos/${cupo.id || cupo._id}`)}
                        disabled={cupo.status === 'completed'}
                        className={`px-3 py-2 text-sm rounded-md border border-white/10 transition-all duration-300 ${
                          cupo.status === 'completed'
                            ? 'bg-dark-800 text-dark-500 cursor-not-allowed'
                            : 'bg-dark-700 text-dark-200 hover:bg-dark-600'
                        }`}
                        title={cupo.status === 'completed' ? 'Service completed' : 'View details'}
                      >
                        View
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
                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-dark-200 bg-dark-700/50 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-dark-200 bg-dark-700/50 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-dark-700/50 text-sm font-medium text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-dark-700/50 text-sm font-medium text-dark-300 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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

export default InventoryDashboard;