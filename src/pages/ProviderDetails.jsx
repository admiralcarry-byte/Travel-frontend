import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProviderDetails = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/providers/${providerId}`);

      if (response.data.success) {
        setProvider(response.data.data.provider);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch provider details');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="icon-container">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        <p className="text-dark-300 text-lg font-medium ml-4">Loading provider details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="notification">
          <div className="flex items-center space-x-4">
            <div className="icon-container bg-error-500">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-error-400 font-medium text-lg">{error}</span>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => navigate('/providers')}
              className="btn-secondary"
            >
              Back to Providers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="icon-container bg-primary-500 mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-3xl font-semibold text-dark-100 mb-4">Provider not found</h3>
          <p className="text-dark-300 mb-8 text-lg">The provider you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/providers')}
            className="btn-primary"
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/providers')}
              className="flex items-center text-dark-300 hover:text-dark-100 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Providers
            </button>
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-2 font-poppins">
              {provider.name}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-dark-400">
                Created {new Date(provider.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/providers/${providerId}/dashboard`)}
              className="btn-primary"
            >
              View Dashboard
            </button>
            <button
              onClick={() => navigate('/providers/new')}
              className="btn-secondary"
            >
              Add New Provider
            </button>
          </div>
        </div>

        {/* Provider Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="card-glass p-6">
            <h2 className="text-2xl font-semibold text-dark-100 mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                <div className="flex items-center space-x-3">
                  <div className="icon-container bg-primary-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-dark-100">{provider.contactInfo?.email || 'No email provided'}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Phone</label>
                <div className="flex items-center space-x-3">
                  <div className="icon-container bg-primary-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-dark-100">{provider.contactInfo?.phone || 'No phone provided'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Website</label>
                <div className="flex items-center space-x-3">
                  <div className="icon-container bg-primary-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  {provider.contactInfo?.website ? (
                    <a 
                      href={provider.contactInfo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      {provider.contactInfo.website}
                    </a>
                  ) : (
                    <span className="text-dark-100">No website provided</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Address</label>
                <div className="flex items-start space-x-3">
                  <div className="icon-container bg-primary-500 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-dark-100">
                    {provider.contactInfo?.address ? 
                      `${provider.contactInfo.address.street || ''}, ${provider.contactInfo.address.city || ''}, ${provider.contactInfo.address.state || ''} ${provider.contactInfo.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') :
                      'No address provided'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="card-glass p-6">
            <h2 className="text-2xl font-semibold text-dark-100 mb-6">Provider Information</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-dark-300">Provider ID</div>
                <div className="text-dark-100 font-mono text-sm bg-dark-700 px-3 py-2 rounded ml-6">
                  {provider.id || provider._id}
                </div>
              </div>
              


              <div>
                <div className="text-sm font-medium text-dark-300">Payment Terms</div>
                <div className="text-dark-100 ml-6">
                  {provider.paymentTerms ? 
                    provider.paymentTerms.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                    'Net 30 Days'
                  }
                </div>
              </div>

              {provider.description && (
                <div>
                  <div className="text-sm font-medium text-dark-300">Notas/Descripción</div>
                  <div className="text-dark-100 ml-6">
                    {provider.description}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-dark-300">Created Date</div>
                <div className="text-dark-100 ml-6">
                  {new Date(provider.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-dark-300">Last Updated</div>
                <div className="text-dark-100 ml-6">
                  {new Date(provider.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetails;