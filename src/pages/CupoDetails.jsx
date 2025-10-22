import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CupoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cupo, setCupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCupoData();
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
          <button
            onClick={() => navigate('/inventory')}
            className="btn-secondary"
          >
            ← Back to Cupos
          </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CupoDetails;