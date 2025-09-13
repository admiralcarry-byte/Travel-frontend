import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      
      // Validate ID before making request
      if (!id || id === 'undefined' || id === 'null') {
        setError('Invalid service ID provided');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/services/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setService(response.data.data.service);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch service data');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      hotel: 'bg-blue-100 text-blue-800',
      airline: 'bg-green-100 text-green-800',
      transfer: 'bg-yellow-100 text-yellow-800',
      excursion: 'bg-purple-100 text-purple-800',
      insurance: 'bg-red-100 text-red-800',
      restaurant: 'bg-orange-100 text-orange-800',
      tour_guide: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      hotel: '🏨',
      airline: '✈️',
      transfer: '🚗',
      excursion: '🎯',
      insurance: '🛡️',
      restaurant: '🍽️',
      tour_guide: '👨‍🏫'
    };
    return icons[type] || '📋';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-error-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-100 mb-2">Error Loading Service</h3>
          <p className="text-dark-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/services')}
            className="btn-primary"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-dark-100 mb-2">Service Not Found</h3>
          <p className="text-dark-400 mb-4">The service you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/services')}
            className="btn-primary"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/services')}
              className="flex items-center text-primary-400 hover:text-primary-300 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Services
            </button>
            <h1 className="text-3xl font-bold text-dark-100">{service.title}</h1>
            <p className="text-dark-400 mt-2">Service Details</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(service.type)}`}>
              {getTypeIcon(service.type)} {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <div className="card-glass p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark-100 mb-4">
                  {service.title}
                </h2>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  {service.description}
                </p>
              </div>
              <div className="text-right ml-6">
                <div className="text-4xl font-bold text-primary-400 mb-1">
                  {service.formattedCost || `${service.currency} ${service.cost?.toLocaleString()}`}
                </div>
                <div className="text-sm text-dark-400">
                  {service.currency}
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
                      {service._id || service.id || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Type:</span>
                    <span className="text-dark-100">
                      {service.type?.charAt(0).toUpperCase() + service.type?.slice(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Created:</span>
                    <span className="text-dark-100">
                      {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Updated:</span>
                    <span className="text-dark-100">
                      {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-100 mb-4">Pricing Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Cost:</span>
                    <span className="text-dark-100 font-semibold">
                      {service.cost ? `${service.currency} ${service.cost.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Currency:</span>
                    <span className="text-dark-100">
                      {service.currency || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Status:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Information */}
        <div className="lg:col-span-1">
          <div className="card-glass p-6 mb-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Provider Information</h3>
            
            {service.providerId ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">
                      {service.providerId.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-100">
                        {service.providerId.name || 'Unknown Provider'}
                      </h4>
                      <p className="text-sm text-dark-400">
                        {service.providerId.type?.charAt(0).toUpperCase() + service.providerId.type?.slice(1) || 'Provider'}
                      </p>
                    </div>
                  </div>
                </div>

                {service.providerId.contactInfo && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-dark-300">Email:</span>
                      <p className="text-dark-100 text-sm">
                        {service.providerId.contactInfo.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-dark-300">Phone:</span>
                      <p className="text-dark-100 text-sm">
                        {service.providerId.contactInfo.phone || 'N/A'}
                      </p>
                    </div>
                    {service.providerId.contactInfo.website && (
                      <div>
                        <span className="text-sm font-medium text-dark-300">Website:</span>
                        <p className="text-primary-400 text-sm hover:text-primary-300">
                          <a href={service.providerId.contactInfo.website} target="_blank" rel="noopener noreferrer">
                            {service.providerId.contactInfo.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => navigate(`/providers/${service.providerId._id || service.providerId.id}`)}
                    className="w-full btn-primary text-sm"
                  >
                    View Provider Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-dark-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-dark-400">No provider information available</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card-glass p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/services/${service._id || service.id}/edit`)}
                className="w-full btn-secondary text-sm"
              >
                Edit Service
              </button>
              <button
                onClick={() => navigate('/services')}
                className="w-full btn-primary text-sm"
              >
                Back to Services
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;