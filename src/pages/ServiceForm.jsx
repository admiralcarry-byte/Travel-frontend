import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    destino: '',
    type: '',
    description: '',
    providerId: '',
    costProvider: 0,
    currency: 'USD',
    paymentTerms: 'net_30',
    providerNotes: '',
    metadata: {}
  });
  const [providers, setProviders] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Currency conversion state
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);


  useEffect(() => {
    if (isEditing) {
      fetchService();
    } else {
      // Reset form when creating a new service
      setFormData({
        destino: '',
        type: '',
        description: '',
        providerId: '',
        costProvider: 0,
        currency: 'USD',
        paymentTerms: 'net_30',
        providerNotes: '',
        metadata: {}
      });
    }
    fetchProviders();
    fetchServiceTypes();
  }, [id, isEditing]);

  // Currency conversion effects
  useEffect(() => {
    if (formData.currency === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
    }
  }, [formData.currency]);

  useEffect(() => {
    if (exchangeRate && formData.costProvider && formData.currency && formData.currency !== 'USD') {
      setConvertedAmount(parseFloat(formData.costProvider) / parseFloat(exchangeRate));
    } else if (formData.currency === 'USD') {
      setConvertedAmount(parseFloat(formData.costProvider));
    }
  }, [exchangeRate, formData.costProvider, formData.currency]);



  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/services/${id}`);

      if (response.data.success) {
        const service = response.data.data.service;
        setFormData({
          destino: service.destino || '',
          type: service.type || '',
          description: service.description || '',
          providerId: service.providerId?._id || service.providerId?.id || '',
          costProvider: service.costProvider || 0,
          currency: service.currency || 'USD',
          paymentTerms: service.paymentTerms || 'net_30',
          providerNotes: service.providerNotes || '',
          metadata: service.metadata || {}
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get('/api/provider-types/active');
      if (response.data.success) {
        const types = response.data.data.providerTypes.map(type => ({
          value: type.name,
          label: type.name
        }));
        setServiceTypes(types);
      }
    } catch (error) {
      console.error('Failed to fetch service types:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      const response = await api.get('/api/providers?limit=100');

      if (response.data.success) {
        // console.log('Providers fetched:', response.data.data.providers);
        setProviders(response.data.data.providers);
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


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };


  const handleExchangeRateChange = (e) => {
    const value = e.target.value;
    setExchangeRate(value);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const serviceData = {
        ...formData
      };

      // Include exchange rate information if currency is not USD (now mandatory)
      if (formData.currency !== 'USD') {
        if (!exchangeRate) {
          setError('Exchange rate is required for non-USD currencies');
          setLoading(false);
          return;
        }
        serviceData.exchangeRate = parseFloat(exchangeRate);
        serviceData.baseCurrency = 'USD';
        serviceData.originalAmount = parseFloat(formData.costProvider);
        serviceData.originalCurrency = formData.currency;
        // Store the converted USD amount as the costProvider
        serviceData.costProvider = convertedAmount || parseFloat(formData.costProvider) / parseFloat(exchangeRate);
        serviceData.currency = 'USD'; // Always store as USD
      }

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
                  <label htmlFor="destino" className="block text-sm font-medium text-dark-200">
                    Destino (Destination) *
                  </label>
                  <input
                    type="text"
                    id="destino"
                    name="destino"
                    value={formData.destino}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                    placeholder="Enter destination (country or city)"
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

            {/* Provider Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Provider Selection</h3>
              
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
                  disabled={providersLoading}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 disabled:bg-dark-700/50 disabled:text-dark-400"
                >
                  <option value="">
                    {providersLoading 
                      ? 'Loading providers...' 
                      : providers.length === 0
                        ? 'No providers available'
                        : 'Select provider'
                    }
                  </option>
                  {providers.map(provider => (
                    <option key={provider._id || provider.id} value={provider._id || provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Partnership Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="costProvider" className="block text-sm font-medium text-dark-200">
                    Provider Cost *
                  </label>
                  <input
                    type="number"
                    id="costProvider"
                    name="costProvider"
                    value={formData.costProvider}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-dark-200">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="ARS">ARS - Argentine Peso</option>
                  </select>
                </div>
              </div>

              {/* Currency Conversion Section */}
              {formData.currency && formData.currency !== 'USD' && (
                <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-dark-200">Currency Conversion *</h4>
                    <p className="text-xs text-dark-400 mt-1">
                      Manual exchange rate entry is required for non-USD currencies
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="exchangeRate" className="block text-sm font-medium text-dark-200 mb-2">
                        Exchange Rate *
                      </label>
                      <input
                        type="number"
                        id="exchangeRate"
                        value={exchangeRate}
                        onChange={handleExchangeRateChange}
                        required
                        min="0"
                        step="0.0001"
                        className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                        placeholder={`Enter exchange rate (1 USD = ? ${formData.currency})`}
                      />
                      <p className="mt-1 text-xs text-dark-400">
                        Enter the rate for 1 USD = ? {formData.currency}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        USD Equivalent
                      </label>
                      <div className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm bg-gray-100 text-gray-700">
                        {convertedAmount ? `U$${convertedAmount.toFixed(2)} USD` : 'Enter amount and rate'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Partnership Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="paymentTerms" className="block text-sm font-medium text-dark-200">
                    Payment Terms
                  </label>
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="providerNotes" className="block text-sm font-medium text-dark-200">
                  Partnership Notes
                </label>
                <textarea
                  id="providerNotes"
                  name="providerNotes"
                  value={formData.providerNotes}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Additional notes about this provider partnership..."
                />
              </div>
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