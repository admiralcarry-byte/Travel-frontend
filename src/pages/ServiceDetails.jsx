import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ServicePartnershipManager from '../components/ServicePartnershipManager';

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
      
      const response = await api.get(`/api/services/${id}`);

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
    const iconProps = {
      className: "w-4 h-4 mr-1",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    switch (type) {
      case 'hotel':
        return (
          <svg {...iconProps}>
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
        );
      case 'airline':
        return (
          <svg {...iconProps}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        );
      case 'transfer':
        return (
          <svg {...iconProps}>
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
            <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
            <path d="M6 8H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M8 12h8" />
          </svg>
        );
      case 'excursion':
        return (
          <svg {...iconProps}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 'insurance':
        return (
          <svg {...iconProps}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'restaurant':
        return (
          <svg {...iconProps}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4v2H5c-1.1 0-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2h-4v-2h4c1.1 0 2-.9 2-2V2H3z" />
            <path d="M8 22h8" />
          </svg>
        );
      case 'tour_guide':
        return (
          <svg {...iconProps}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h.5" />
          </svg>
        );
      case 'car_rental':
        return (
          <svg {...iconProps}>
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 9h-1V7c0-.5-.4-1-1-1H8c-.5 0-1 .4-1 1v2H6l-1.5 2.1C4.2 11.3 3.5 12.1 3.5 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M9 17h6" />
          </svg>
        );
      case 'medical_assistance':
        return (
          <svg {...iconProps}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            <path d="M12 2v20" />
            <path d="M8 8h8" />
            <path d="M8 16h8" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M9 1v6" />
            <path d="M15 1v6" />
            <path d="M9 17v6" />
            <path d="M15 17v6" />
          </svg>
        );
    }
  };

  const getProviderIcon = (type) => {
    const iconProps = {
      className: "w-6 h-6",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    switch (type) {
      case 'hotel':
        return (
          <svg {...iconProps}>
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
        );
      case 'airline':
        return (
          <svg {...iconProps}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        );
      case 'transfer':
        return (
          <svg {...iconProps}>
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
            <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
            <path d="M6 8H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M8 12h8" />
          </svg>
        );
      case 'excursion':
        return (
          <svg {...iconProps}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 'insurance':
        return (
          <svg {...iconProps}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'restaurant':
        return (
          <svg {...iconProps}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4v2H5c-1.1 0-2 .9-2 2v2h16v-2c0-1.1-.9-2-2-2h-4v-2h4c1.1 0 2-.9 2-2V2H3z" />
            <path d="M8 22h8" />
          </svg>
        );
      case 'tour_guide':
        return (
          <svg {...iconProps}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h.5" />
          </svg>
        );
      case 'car_rental':
        return (
          <svg {...iconProps}>
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 9h-1V7c0-.5-.4-1-1-1H8c-.5 0-1 .4-1 1v2H6l-1.5 2.1C4.2 11.3 3.5 12.1 3.5 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M9 17h6" />
          </svg>
        );
      case 'medical_assistance':
        return (
          <svg {...iconProps}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            <path d="M12 2v20" />
            <path d="M8 8h8" />
            <path d="M8 16h8" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 9h6v6H9z" />
            <path d="M9 1v6" />
            <path d="M15 1v6" />
            <path d="M9 17v6" />
            <path d="M15 17v6" />
          </svg>
        );
    }
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
            <h1 className="text-3xl font-bold text-dark-100">{service.destino}</h1>
            <p className="text-dark-400 mt-2">Service Details</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/services/${service._id || service.id}/edit`)}
              className="btn-secondary text-sm"
            >
              Edit Service
            </button>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(service.type)}`}>
              {getTypeIcon(service.type)} {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <div className="card-glass p-6 mb-6 h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-dark-100 mb-4">
                  {service.destino}
                </h2>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  {service.description}
                </p>
              </div>
              <div className="text-right ml-6">
                <div className="text-4xl font-bold text-primary-400 mb-1">
                  Pricing
                </div>
                <div className="text-sm text-dark-400">
                  Set at sale level
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
                <h3 className="text-lg font-semibold text-dark-100 mb-4">Service Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Status:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Pricing:</span>
                    <span className="text-dark-100">
                      Set at sale level
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional spacing to match Provider Information card height */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <div className="text-center text-dark-400 text-sm">
                Service management and partnership details below
              </div>
            </div>
          </div>
        </div>

        {/* Provider Information */}
        <div className="lg:col-span-1">
          <div className="card-glass p-6 mb-6 h-full">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Provider Information</h3>
            
            {service.providerId ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg">
                      {getProviderIcon(service.providerId.type)}
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

        </div>
      </div>

      {/* Provider Partnerships Management */}
      <div className="mt-8">
        <div className="card-glass p-6">
          <ServicePartnershipManager 
            service={service} 
            onPartnershipUpdate={() => {
              // Refresh service data if needed
              fetchService();
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;