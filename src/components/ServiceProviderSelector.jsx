import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ServiceProviderSelector = ({ 
  service, 
  selectedProviderIds = [], 
  onProviderChange, 
  disabled = false 
}) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (service?._id) {
      fetchProvidersForService();
    }
  }, [service?._id]);

  const fetchProvidersForService = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/service-providers/service/${service._id}`);
      
      if (response.data.success) {
        setProviders(response.data.data.serviceProviders);
      } else {
        setError('Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to fetch providers for this service');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId, isSelected) => {
    const selectedProvider = providers.find(p => p.providerId._id === providerId);
    
    if (isSelected) {
      // Add provider to selection
      const newSelectedIds = [...selectedProviderIds, providerId];
      const newSelectedProviders = newSelectedIds.map(id => {
        const provider = providers.find(p => p.providerId._id === id);
        return {
          providerId: id,
          serviceProviderId: provider._id,
          providerName: provider.providerId.name,
          costProvider: provider.costProvider,
          currency: provider.currency,
          commissionRate: 0 // Commission disabled
        };
      });
      onProviderChange(newSelectedIds, newSelectedProviders);
    } else {
      // Remove provider from selection
      const newSelectedIds = selectedProviderIds.filter(id => id !== providerId);
      const newSelectedProviders = newSelectedIds.map(id => {
        const provider = providers.find(p => p.providerId._id === id);
        return {
          providerId: id,
          serviceProviderId: provider._id,
          providerName: provider.providerId.name,
          costProvider: provider.costProvider,
          currency: provider.currency,
          commissionRate: 0 // Commission disabled
        };
      });
      onProviderChange(newSelectedIds, newSelectedProviders);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-sm text-dark-300">Loading providers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
        <p className="text-red-400 text-sm">{error}</p>
        <button 
          onClick={fetchProvidersForService}
          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
        <p className="text-yellow-400 text-sm">No providers available for this service</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-dark-200">
        Select Providers (Multiple Selection Allowed)
      </label>
      
      <div className="space-y-2">
        {providers.map((serviceProvider) => {
          const provider = serviceProvider.providerId;
          const isSelected = selectedProviderIds.includes(provider._id);
          
          return (
            <div
              key={provider._id}
              className={`p-3 border rounded-lg transition-colors ${
                isSelected 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-white/20 hover:border-white/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => !disabled && handleProviderChange(provider._id, e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-primary-600 bg-dark-800 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-dark-100">{provider.name}</h4>
                    <p className="text-sm text-dark-300">{provider.type}</p>
                    {provider.contactInfo?.email && (
                      <p className="text-xs text-dark-400">{provider.contactInfo.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-dark-100">
                    {serviceProvider.currency} {serviceProvider.costProvider.toFixed(2)}
                  </div>
                  <div className="text-xs text-dark-400">Base Cost</div>
                </div>
              </div>
              
              {serviceProvider.notes && (
                <div className="mt-2 text-xs text-dark-400">
                  {serviceProvider.notes}
                </div>
              )}
              
              {!serviceProvider.isAvailable && (
                <div className="mt-2 text-xs text-red-400">
                  Currently unavailable
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedProviderIds.length > 0 && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-xs text-green-400">
            {selectedProviderIds.length} provider{selectedProviderIds.length !== 1 ? 's' : ''} selected. You can customize pricing in the pricing section.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderSelector;