import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import EditCupoModal from '../components/EditCupoModal';

const CupoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cupo, setCupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCupoData();
  }, [id]);

  // Listen for cupo updates from other components
  useEffect(() => {
    const handleCupoUpdated = (event) => {
      if (event.detail.cupoId === id) {
        // Refresh cupo data when updated from other components
        fetchCupoData();
      }
    };

    window.addEventListener('cupoUpdated', handleCupoUpdated);
    
    return () => {
      window.removeEventListener('cupoUpdated', handleCupoUpdated);
    };
  }, [id]);

  const fetchCupoData = async () => {
    try {
      setLoading(true);
      
      // Validate ID before making request
      if (!id || id === 'undefined' || id === 'null') {
        setError('Invalid cupo ID provided');
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/api/cupos/${id}`);

      if (response.data.success) {
        console.log('Cupo data received:', response.data.data.cupo);
        console.log('Service data:', response.data.data.cupo.serviceId);
        console.log('Provider data:', response.data.data.cupo.serviceId?.providerId);
        setCupo(response.data.data.cupo);
      }
    } catch (error) {
      console.error('Failed to fetch cupo data:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('Access denied. You need admin or seller permissions to view cupo details.');
      } else if (error.response?.status === 404) {
        setError('Cupo not found or you do not have permission to view it.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch cupo data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-warning';
      case 'sold_out': return 'badge-danger';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const getAvailabilityStatus = (cupo) => {
    if (cupo.availableSeats === 0) return 'Sold Out';
    if (cupo.availableSeats <= 5) return 'Limited Availability';
    return 'Available';
  };

  const getAvailabilityColor = (cupo) => {
    if (cupo.availableSeats === 0) return 'text-red-400';
    if (cupo.availableSeats <= 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const openEditModal = () => {
    setShowEditModal(true);
  };

  const handleDeleteCupo = async () => {
    try {
      setDeleting(true);
      await api.delete(`/api/cupos/${id}`);
      
      // Navigate back to inventory page after successful deletion
      navigate('/inventory');
    } catch (error) {
      console.error('Failed to delete cupo:', error);
      setError(error.response?.data?.message || 'Failed to delete cupo');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCupoUpdate = async (updatedCupo) => {
    // Fetch the complete updated cupo data from the server to ensure all information is current
    try {
      const response = await api.get(`/api/cupos/${id}`);
      if (response.data.success) {
        const completeCupoData = response.data.data.cupo;
        
        // Update local state with complete data from server
        setCupo(completeCupoData);
        
        // Emit custom event to notify other components of the update
        window.dispatchEvent(new CustomEvent('cupoUpdated', {
          detail: {
            cupoId: id,
            updatedCupo: completeCupoData
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch updated cupo data:', error);
      // Fallback to local update if server fetch fails
      setCupo(prevCupo => ({
        ...prevCupo,
        ...updatedCupo,
        availableSeats: updatedCupo.totalSeats - updatedCupo.reservedSeats,
        occupancyPercentage: updatedCupo.totalSeats > 0 ? 
          ((updatedCupo.totalSeats - updatedCupo.reservedSeats) / updatedCupo.totalSeats * 100).toFixed(1) : 0
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading cupo details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-dark-100 mb-2">Error</h2>
          <p className="text-dark-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/inventory')}
            className="btn-primary"
          >
            Back to Cupos
          </button>
        </div>
      </div>
    );
  }

  if (!cupo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-400 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-dark-100 mb-2">Cupo Not Found</h2>
          <p className="text-dark-300 mb-6">The requested cupo could not be found.</p>
          <button
            onClick={() => navigate('/inventory')}
            className="btn-primary"
          >
            Back to Cupos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-100 mb-2">Cupo Details</h1>
            <p className="text-dark-300">View detailed information about this cupo item</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inventory')}
              className="btn-secondary"
            >
              ← Back to Cupos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <div className="card-glass p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-dark-100 mb-2">
                    {cupo.serviceId?.destino || 'Unknown Service'}
                  </h2>
                  <p className="text-dark-300 mb-4">
                    {cupo.serviceId?.description || 'No description available'}
                  </p>
                  <div className="flex items-center space-x-4">
                    <span className={`badge ${getStatusColor(cupo.status)}`}>
                      {cupo.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className={`text-sm font-medium ${getAvailabilityColor(cupo)}`}>
                      {getAvailabilityStatus(cupo)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {/* <div className="text-3xl font-bold text-primary-400 mb-1">
                    {cupo.serviceId?.sellingPrice ? 
                      `${cupo.serviceId?.baseCurrency || 'USD'} ${cupo.serviceId.sellingPrice.toLocaleString()}` : 
                      'Price N/A'
                    }
                  </div> */}
                  <div className="text-sm text-dark-400">
                    {(cupo.serviceId?.typeId?.name || cupo.serviceId?.type)?.charAt(0).toUpperCase() + (cupo.serviceId?.typeId?.name || cupo.serviceId?.type)?.slice(1) || 'Service'}
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">Service Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-dark-300">Service ID:</span>
                      <span className="text-dark-100 font-mono text-sm">
                        {cupo.serviceId?._id || cupo.serviceId?.id || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-300">Provider:</span>
                      <span className="text-dark-100">
                        {cupo.serviceId?.providerId?.name || 'Unknown Provider'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">Seat Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-dark-300">Total Seats:</span>
                      <span className="text-dark-100 font-semibold">{cupo.totalSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-300">Reserved:</span>
                      <span className="text-yellow-400 font-semibold">{cupo.reservedSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-300">Available:</span>
                      <span className="text-green-400 font-semibold">{cupo.availableSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-300">Occupancy:</span>
                      <span className="text-dark-100 font-semibold">
                        {cupo.occupancyPercentage || '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-dark-300 mb-2">
                  <span>Occupancy</span>
                  <span>{cupo.occupancyPercentage || '0.0'}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${cupo.occupancyPercentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Metadata Information */}
            {cupo.metadata && (
              <div className="card-glass p-6">
                <h3 className="text-lg font-semibold text-dark-100 mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 notranslate" translate="no">
                  {cupo.metadata.date && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Start Date:</span>
                      <span className="text-dark-100">
                        {new Date(cupo.metadata.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.completionDate && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Completion Date:</span>
                      <span className="text-dark-100">
                        {new Date(cupo.metadata.completionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.roomType && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Room Type:</span>
                      <span className="text-dark-100">{cupo.metadata.roomType}</span>
                    </div>
                  )}
                  {cupo.metadata.flightName && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Flight Name:</span>
                      <span className="text-dark-100">
                        {cupo.metadata.flightName}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.destination && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Destination:</span>
                      <span className="text-dark-100">
                        {cupo.metadata.destination}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.value && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Value/Cost:</span>
                      <span className="text-dark-100">
                        {cupo.metadata.currency} {cupo.metadata.value.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.providerRef && (
                    <div className="flex justify-between">
                      <span className="text-dark-300">Provider Ref:</span>
                      <span className="text-dark-100 font-mono text-sm">
                        {cupo.metadata.providerRef}
                      </span>
                    </div>
                  )}
                  {cupo.metadata.notes && (
                    <div className="col-span-full">
                      <span className="text-dark-300 block mb-2">Notes:</span>
                      <p className="text-dark-100 bg-dark-800 p-3 rounded-md">
                        {cupo.metadata.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Actions */}
            <div className="card-glass p-6 mb-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/sales/new', { state: { cupo: cupo } })}
                  disabled={cupo.availableSeats === 0}
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    cupo.availableSeats === 0 
                      ? 'bg-dark-700 text-dark-400 cursor-not-allowed' 
                      : 'btn-primary'
                  }`}
                >
                  {cupo.availableSeats === 0 ? 'Sold Out' : 'Make Reservation'}
                </button>
                <button
                  onClick={() => navigate('/inventory')}
                  className="w-full px-4 py-2 bg-dark-700 text-dark-200 rounded-md hover:bg-dark-600 border border-white/10 transition-all duration-300"
                >
                  Back to Cupos
                </button>
              </div>
            </div>

            {/* System Information */}
            <div className="card-glass p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">System Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-300">Cupo ID:</span>
                  <span className="text-dark-100 font-mono text-xs">
                    {cupo._id || cupo.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Created:</span>
                  <span className="text-dark-100">
                    {new Date(cupo.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Last Updated:</span>
                  <span className="text-dark-100">
                    {new Date(cupo.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Created By:</span>
                  <span className="text-dark-100">
                    {cupo.createdBy?.username || 'Unknown User'}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={openEditModal}
                  className="flex items-center justify-center w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  title="Edit Cupo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  title="Delete Cupo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditCupoModal
        cupo={cupo}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleCupoUpdate}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-800/95 backdrop-blur-md rounded-lg p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-dark-100">Delete Cupo</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-dark-300">
                Are you sure you want to delete this cupo? This action cannot be undone.
              </p>
              <p className="text-dark-400 text-sm mt-2">
                Service: {cupo?.serviceId?.destino || 'Unknown Service'}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-dark-700 text-dark-200 rounded-md hover:bg-dark-600 border border-white/10 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCupo}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CupoDetails;