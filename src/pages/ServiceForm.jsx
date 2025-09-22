import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    providerId: '',
    cost: '',
    currency: 'USD',
    metadata: {}
  });
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [manualExchangeRate, setManualExchangeRate] = useState(false);

  const serviceTypes = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'airline', label: 'Airline' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'excursion', label: 'Excursion' },
    { value: 'insurance', label: 'Insurance' },
    // { value: 'car_rental', label: 'Car Rental' },
    // { value: 'medical_assistance', label: 'Medical Assistance' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'ARS', label: 'ARS - Argentine Peso' }
  ];

  useEffect(() => {
    if (isEditing) {
      fetchService();
    } else {
      // Reset form when creating a new service
      setFormData({
        title: '',
        type: '',
        description: '',
        providerId: '',
        cost: '',
        currency: 'USD',
        metadata: {}
      });
    }
    fetchProviders();
  }, [id, isEditing]);

  // Currency conversion effects
  useEffect(() => {
    if (formData.currency && formData.currency !== 'USD' && !manualExchangeRate) {
      fetchExchangeRate();
    } else if (formData.currency === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
      setManualExchangeRate(false);
    }
  }, [formData.currency, formData.cost, manualExchangeRate]);

  useEffect(() => {
    if (manualExchangeRate && exchangeRate && formData.cost) {
      setConvertedAmount(parseFloat(formData.cost) * parseFloat(exchangeRate));
    } else if (!manualExchangeRate && exchangeRate && formData.cost) {
      setConvertedAmount(parseFloat(formData.cost) * parseFloat(exchangeRate));
    }
  }, [exchangeRate, formData.cost, manualExchangeRate]);

  useEffect(() => {
    // Filter providers based on selected service type
    if (formData.type) {
      const filtered = providers.filter(provider => provider.type === formData.type);
      setFilteredProviders(filtered);
      
      // Reset provider selection if current provider doesn't match the new type
      if (formData.providerId) {
        const currentProvider = providers.find(p => (p._id || p.id) === formData.providerId);
        if (currentProvider && currentProvider.type !== formData.type) {
          setFormData(prev => ({ ...prev, providerId: '' }));
        }
      }
    } else {
      setFilteredProviders(providers);
    }
  }, [formData.type, providers]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/services/${id}`);

      if (response.data.success) {
        const service = response.data.data.service;
        setFormData({
          title: service.title || '',
          type: service.type || '',
          description: service.description || '',
          providerId: service.providerId?._id || service.providerId?.id || '',
          cost: service.cost || '',
          currency: service.currency || 'USD',
          metadata: service.metadata || {}
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      const response = await api.get('/api/providers?limit=100');

      if (response.data.success) {
        // console.log('Providers fetched:', response.data.data.providers);
        setProviders(response.data.data.providers);
        setFilteredProviders(response.data.data.providers);
      } else {
        console.error('Failed to fetch providers:', response.data.message);
        setError('Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to fetch providers: ' + (error.response?.data?.message || error.message));
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await api.get(`/api/payments/exchange-rate?from=${formData.currency}&to=USD`);

      if (response.data.success) {
        setExchangeRate(response.data.data.rate.toString());
        if (formData.cost) {
          setConvertedAmount(parseFloat(formData.cost) * response.data.data.rate);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
      setExchangeRate('');
      setConvertedAmount(null);
    }
  };

  const handleExchangeRateChange = (e) => {
    const value = e.target.value;
    setExchangeRate(value);
  };

  const toggleManualExchangeRate = () => {
    setManualExchangeRate(!manualExchangeRate);
    if (!manualExchangeRate) {
      // Switching to manual mode - clear auto-fetched rate
      setExchangeRate('');
      setConvertedAmount(null);
    } else {
      // Switching back to auto mode - fetch rate
      if (formData.currency && formData.currency !== 'USD') {
        fetchExchangeRate();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert cost to number and include exchange rate data
      const serviceData = {
        ...formData,
        cost: parseFloat(formData.cost),
        // Include exchange rate information if not USD
        ...(formData.currency !== 'USD' && exchangeRate && {
          exchangeRate: parseFloat(exchangeRate),
          baseCurrency: 'USD'
        })
      };

      let response;
      if (isEditing) {
        response = await api.put(`/api/services/${id}`, serviceData);
      } else {
        response = await api.post('/api/services', serviceData);
      }

      if (response.data.success) {
        setSuccess(isEditing ? 'Service updated successfully!' : 'Service created successfully!');
        setTimeout(() => {
          navigate('/services');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || (isEditing ? 'Failed to update service' : 'Failed to create service'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">
          {isEditing ? 'Edit Service' : 'Add New Service'}
        </h1>
        <p className="mt-1 text-sm text-dark-400">
          {isEditing ? 'Update service information' : 'Create a new service offered by a provider'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Service Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-dark-200">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                    placeholder="Enter service title"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-dark-200">
                    Service Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  >
                    <option value="">Select service type</option>
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-dark-200">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter service description"
                />
              </div>
            </div>

            {/* Provider and Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Provider & Pricing</h3>
              
              <div>
                <label htmlFor="providerId" className="block text-sm font-medium text-dark-200">
                  Provider *
                </label>
                <select
                  id="providerId"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  required
                  disabled={providersLoading || !formData.type}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 disabled:bg-dark-700/50 disabled:text-dark-400"
                >
                  <option value="">
                    {providersLoading 
                      ? 'Loading providers...' 
                      : !formData.type 
                        ? 'Select service type first' 
                        : filteredProviders.length === 0
                          ? 'No providers available'
                          : 'Select provider'
                    }
                  </option>
                  {filteredProviders.map(provider => (
                    <option key={provider._id || provider.id} value={provider._id || provider.id}>
                      {provider.name} ({provider.type.charAt(0).toUpperCase() + provider.type.slice(1)})
                    </option>
                  ))}
                </select>
                {!formData.type && (
                  <p className="mt-1 text-sm text-dark-400">
                    Please select a service type to see available providers
                  </p>
                )}
                {formData.type && filteredProviders.length === 0 && !providersLoading && (
                  <p className="mt-1 text-sm text-warning-400">
                    No providers found for {formData.type} type. Total providers: {providers.length}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-dark-200">
                    Cost *
                  </label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                    placeholder="Enter cost"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-dark-200">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exchange Rate Section */}
              {formData.currency && formData.currency !== 'USD' && (
                <div className="space-y-4 p-4 bg-dark-700/30 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-dark-200">Currency Conversion</h4>
                    <button
                      type="button"
                      onClick={toggleManualExchangeRate}
                      className="text-xs text-primary-400 hover:text-primary-300 underline"
                    >
                      {manualExchangeRate ? 'Use Auto Rate' : 'Set Manual Rate'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="exchangeRate" className="block text-sm font-medium text-dark-300">
                        Exchange Rate ({formData.currency} to USD) *
                      </label>
                      <input
                        type="number"
                        id="exchangeRate"
                        value={exchangeRate}
                        onChange={handleExchangeRateChange}
                        required
                        min="0"
                        step="0.000001"
                        className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                        placeholder="Enter exchange rate"
                      />
                      <p className="mt-1 text-xs text-dark-400">
                        {manualExchangeRate ? 'Manual rate' : 'Auto-fetched rate'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300">
                        Converted Amount (USD)
                      </label>
                      <div className="mt-1 px-3 py-2 bg-dark-600/50 border border-white/10 rounded-md text-dark-100">
                        {convertedAmount ? `$${convertedAmount.toFixed(2)}` : 'Enter cost and rate'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Service' : 'Create Service')}
              </button>
            </div>
          </form>
    </div>
  );
};

export default ServiceForm;