import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ServicePartnershipManager = ({ service, onPartnershipUpdate }) => {
  const [partnerships, setPartnerships] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartnership, setNewPartnership] = useState({
    providerId: '',
    costProvider: 0,
    currency: 'USD',
    paymentTerms: 'net_30',
    notes: ''
  });
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [conversionLoading, setConversionLoading] = useState(false);

  useEffect(() => {
    if (service?._id) {
      fetchPartnerships();
      fetchAvailableProviders();
    }
  }, [service?._id]);

  const fetchPartnerships = async () => {
    try {
      const response = await api.get(`/api/service-providers/service/${service._id}`);
      if (response.data.success) {
        setPartnerships(response.data.data.serviceProviders);
      }
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      setError('Failed to fetch partnerships');
    }
  };

  const fetchAvailableProviders = async () => {
    try {
      const response = await api.get(`/api/providers?limit=100`);
      if (response.data.success) {
        // Filter out providers that already have partnerships
        const existingProviderIds = partnerships.map(p => p.providerId._id);
        const available = response.data.data.providers.filter(
          provider => !existingProviderIds.includes(provider._id)
        );
        setAvailableProviders(available);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to fetch available providers');
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount, fromCurrency, toCurrency = 'USD') => {
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      return amount;
    }

    // Manual conversion - user must provide exchange rate
    if (exchangeRate && exchangeRate > 0) {
      const converted = amount * exchangeRate;
      setConvertedAmount(converted);
      return converted;
    }
    return amount;
  };

  const handleCostChange = (value) => {
    const amount = parseFloat(value) || 0;
    setNewPartnership(prev => ({ ...prev, costProvider: amount }));
    
    // Trigger conversion if currency is not USD
    if (newPartnership.currency !== 'USD' && amount > 0) {
      convertCurrency(amount, newPartnership.currency, 'USD');
    } else {
      setConvertedAmount(amount);
    }
  };

  const handleCurrencyChange = (currency) => {
    setNewPartnership(prev => ({ ...prev, currency }));
    
    // Trigger conversion if amount is greater than 0
    if (newPartnership.costProvider > 0) {
      convertCurrency(newPartnership.costProvider, currency, 'USD');
    } else {
      setConvertedAmount(0);
    }
  };

  const handleAddPartnership = async (e) => {
    e.preventDefault();
    
    try {
      // Always convert to USD before storing
      const costInUSD = newPartnership.currency === 'USD' 
        ? newPartnership.costProvider 
        : await convertCurrency(newPartnership.costProvider, newPartnership.currency, 'USD');

      const partnershipData = {
        ...newPartnership,
        serviceId: service._id,
        costProvider: costInUSD, // Always store in USD
        currency: 'USD' // Always store as USD
      };

      const response = await api.post('/api/service-providers', partnershipData);
      
      if (response.data.success) {
        await fetchPartnerships();
        await fetchAvailableProviders();
        setShowAddForm(false);
        setNewPartnership({
          providerId: '',
          costProvider: 0,
          currency: 'USD',
          paymentTerms: 'net_30',
          notes: ''
        });
        setConvertedAmount(0);
        setExchangeRate(null);
        
        if (onPartnershipUpdate) {
          onPartnershipUpdate();
        }
      }
    } catch (error) {
      console.error('Error adding partnership:', error);
      setError('Failed to add partnership');
    }
  };

  const handleRemovePartnership = async (partnershipId) => {
    if (!window.confirm('Are you sure you want to remove this partnership?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/service-providers/${partnershipId}`);
      
      if (response.data.success) {
        await fetchPartnerships();
        await fetchAvailableProviders();
        
        if (onPartnershipUpdate) {
          onPartnershipUpdate();
        }
      }
    } catch (error) {
      console.error('Error removing partnership:', error);
      setError('Failed to remove partnership');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-sm text-dark-300">Loading partnerships...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-dark-100">Provider Partnerships</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
        >
          Add Provider Partnership
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Existing Partnerships */}
      <div className="space-y-3">
        {partnerships.map((partnership) => (
          <div
            key={partnership._id}
            className="p-4 bg-dark-700/30 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-dark-100">
                  {partnership.providerId.name}
                </h4>
                <p className="text-sm text-dark-300">
                  Type: {partnership.providerId.type}
                </p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-dark-400">Cost:</span>
                    <span className="text-dark-200 ml-1">
                      {partnership.currency} {partnership.costProvider.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400">Payment:</span>
                    <span className="text-dark-200 ml-1">
                      {partnership.paymentTerms}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-400">Status:</span>
                    <span className={`ml-1 ${
                      partnership.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {partnership.status}
                    </span>
                  </div>
                </div>
                {partnership.notes && (
                  <p className="text-xs text-dark-400 mt-2">
                    Notes: {partnership.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemovePartnership(partnership._id)}
                className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Partnership Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-3">
            Add New Provider Partnership
          </h4>
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-medium text-blue-400">Currency Conversion</p>
                <p className="text-xs text-blue-300 mt-1">
                  All provider costs are automatically converted to USD for storage. 
                  If you select ARS, the system will convert the amount using current exchange rates.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleAddPartnership} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Select Provider *
                </label>
                <select
                  value={newPartnership.providerId}
                  onChange={(e) => setNewPartnership(prev => ({
                    ...prev,
                    providerId: e.target.value
                  }))}
                  required
                  className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Choose a provider</option>
                  {availableProviders.map(provider => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} ({provider.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Provider Cost *
                </label>
                <input
                  type="number"
                  value={newPartnership.costProvider}
                  onChange={(e) => handleCostChange(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                {newPartnership.currency !== 'USD' && newPartnership.costProvider > 0 && (
                  <div className="mt-1 text-xs text-blue-400">
                    {conversionLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Converting...
                      </span>
                    ) : (
                      <span>
                        = USD {convertedAmount.toFixed(2)} 
                        {exchangeRate && (
                          <span className="text-dark-400 ml-1">
                            (Rate: 1 {newPartnership.currency} = {exchangeRate.toFixed(4)} USD)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Currency
                </label>
                <select
                  value={newPartnership.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
                <div className="mt-1 text-xs text-dark-400">
                  Cost will be converted to USD for storage
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Payment Terms
                </label>
                <select
                  value={newPartnership.paymentTerms}
                  onChange={(e) => setNewPartnership(prev => ({
                    ...prev,
                    paymentTerms: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Notes
                </label>
                <textarea
                  value={newPartnership.notes}
                  onChange={(e) => setNewPartnership(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm bg-dark-800/50 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Additional notes about this partnership..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
              >
                Add Partnership
              </button>
            </div>
          </form>
        </div>
      )}

      {partnerships.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-dark-400">
          <p>No provider partnerships found for this service.</p>
          <p className="text-sm mt-1">Add partnerships to allow multiple providers to offer this service.</p>
        </div>
      )}
    </div>
  );
};

export default ServicePartnershipManager;