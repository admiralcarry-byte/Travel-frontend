import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServiceForm = () => {
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

  const navigate = useNavigate();

  const serviceTypes = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'airline', label: 'Airline' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'excursion', label: 'Excursion' },
    { value: 'insurance', label: 'Insurance' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ];

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    // Filter providers based on selected service type
    if (formData.type) {
      const filtered = providers.filter(provider => provider.type === formData.type);
      setFilteredProviders(filtered);
      
      // Reset provider selection if current provider doesn't match the new type
      if (formData.providerId) {
        const currentProvider = providers.find(p => p.id === formData.providerId);
        if (currentProvider && currentProvider.type !== formData.type) {
          setFormData(prev => ({ ...prev, providerId: '' }));
        }
      }
    } else {
      setFilteredProviders(providers);
    }
  }, [formData.type, providers]);

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      const response = await axios.get('http://localhost:5000/api/providers?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setProviders(response.data.data.providers);
        setFilteredProviders(response.data.data.providers);
      }
    } catch (error) {
      setError('Failed to fetch providers');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert cost to number
      const serviceData = {
        ...formData,
        cost: parseFloat(formData.cost)
      };

      const response = await axios.post('http://localhost:5000/api/services', serviceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess('Service created successfully!');
        setTimeout(() => {
          navigate('/services');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Add New Service</h1>
        <p className="mt-1 text-sm text-dark-400">
          Create a new service offered by a provider
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
                        : 'Select provider'
                    }
                  </option>
                  {filteredProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type.charAt(0).toUpperCase() + provider.type.slice(1)})
                    </option>
                  ))}
                </select>
                {!formData.type && (
                  <p className="mt-1 text-sm text-dark-400">
                    Please select a service type to see available providers
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
                {loading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
    </div>
  );
};

export default ServiceForm;