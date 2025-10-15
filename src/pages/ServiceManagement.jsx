import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ServiceTemplateCategoryManager from '../components/ServiceTemplateCategoryManager';

const ServiceManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Services state
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    type: '',
    description: '',
    providerId: '',
    cost: '',
    currency: 'USD',
    exchangeRate: ''
  });

  // Provider form state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerFormData, setProviderFormData] = useState({
    name: '',
    type: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      }
    },
    description: ''
  });

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
    { value: 'ARS', label: 'ARS - Argentine Peso' }
  ];

  useEffect(() => {
    fetchServices();
    fetchProviders();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, serviceTypeFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/services?limit=100');
      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/api/providers?limit=100');
      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (error) {
      setError('Failed to fetch providers');
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.providerId?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (serviceTypeFilter) {
      filtered = filtered.filter(service => service.type === serviceTypeFilter);
    }

    setFilteredServices(filtered);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate exchange rate for ARS
      if (serviceFormData.currency === 'ARS' && (!serviceFormData.exchangeRate || parseFloat(serviceFormData.exchangeRate) <= 0)) {
        setError('Please provide a valid exchange rate for ARS to USD conversion');
        setLoading(false);
        return;
      }

      // Prepare data with currency conversion
      let serviceData = { ...serviceFormData };
      
      if (serviceFormData.currency === 'ARS') {
        const originalAmount = parseFloat(serviceFormData.cost);
        const exchangeRate = parseFloat(serviceFormData.exchangeRate);
        const convertedAmount = originalAmount / exchangeRate;
        
        serviceData = {
          ...serviceFormData,
          cost: convertedAmount, // Store converted amount in USD
          currency: 'USD', // Always store as USD in database
          originalCurrency: 'ARS', // Keep track of original currency
          originalAmount: originalAmount, // Keep track of original amount
          exchangeRate: exchangeRate // Store exchange rate used
        };
      } else {
        serviceData = {
          ...serviceFormData,
          cost: parseFloat(serviceFormData.cost)
        };
      }

      let response;
      if (editingService) {
        response = await api.put(`/api/services/${editingService._id}`, serviceData);
      } else {
        response = await api.post('/api/services', serviceData);
      }

      if (response.data.success) {
        setSuccess(editingService ? 'Service updated successfully!' : 'Service created successfully!');
        setShowServiceForm(false);
        setEditingService(null);
        setServiceFormData({
          title: '',
          type: '',
          description: '',
          providerId: '',
          cost: '',
          currency: 'USD',
          exchangeRate: ''
        });
        fetchServices();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (editingProvider) {
        response = await api.put(`/api/providers/${editingProvider._id}`, providerFormData);
      } else {
        response = await api.post('/api/providers', providerFormData);
      }

      if (response.data.success) {
        setSuccess(editingProvider ? 'Provider updated successfully!' : 'Provider created successfully!');
        setShowProviderForm(false);
        setEditingProvider(null);
        setProviderFormData({
          name: '',
          type: '',
          contactInfo: {
            phone: '',
            email: '',
            website: '',
            address: {
              street: '',
              city: '',
              state: '',
              country: '',
              zipCode: ''
            }
          },
          description: ''
        });
        fetchProviders();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save provider');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
        destino: service.destino,
      type: service.type,
      description: service.description,
      providerId: service.providerId._id || service.providerId
    });
    setShowServiceForm(true);
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderFormData({
      name: provider.name,
      type: provider.type,
      contactInfo: provider.contactInfo,
      description: provider.description || ''
    });
    setShowProviderForm(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await api.delete(`/api/services/${serviceId}`);
      if (response.data.success) {
        setSuccess('Service deleted successfully!');
        fetchServices();
      }
    } catch (error) {
      setError('Failed to delete service');
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await api.delete(`/api/providers/${providerId}`);
      if (response.data.success) {
        setSuccess('Provider deleted successfully!');
        fetchProviders();
      }
    } catch (error) {
      setError('Failed to delete provider');
    }
  };

  const resetForms = () => {
    setShowServiceForm(false);
    setShowProviderForm(false);
    setEditingService(null);
    setEditingProvider(null);
    setServiceFormData({
      title: '',
      type: '',
      description: '',
      providerId: '',
      cost: '',
      currency: 'USD'
    });
    setProviderFormData({
      name: '',
      type: '',
      contactInfo: {
        phone: '',
        email: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      },
      description: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Service Management</h1>
        <p className="mt-1 text-sm text-dark-400">
          Manage services and providers in one unified interface
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-white/10">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-300 hover:text-dark-200 hover:border-white/20'
              }`}
            >
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'providers'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-300 hover:text-dark-200 hover:border-white/20'
              }`}
            >
              Providers ({providers.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-300 hover:text-dark-200 hover:border-white/20'
              }`}
            >
              Categories
            </button>
          </nav>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Services Header */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-64"
              />
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="input-field w-48"
              >
                <option value="">All Types</option>
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                resetForms();
                setShowServiceForm(true);
              }}
              className="btn-primary"
            >
              Add Service
            </button>
          </div>

          {/* Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <div key={service._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-dark-100">{service.destino}</h3>
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">
                    {service.type}
                  </span>
                </div>
                <p className="text-sm text-dark-300 mb-4">{service.description}</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Provider:</strong> {service.providerId?.name}</p>
                  <p><strong>Cost:</strong> {service.formattedCost}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 ${
                      service.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {service.status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEditService(service)}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Providers Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-dark-100">Providers</h2>
            <button
              onClick={() => {
                resetForms();
                setShowProviderForm(true);
              }}
              className="btn-primary"
            >
              Add Provider
            </button>
          </div>

          {/* Providers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(provider => (
              <div key={provider._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-dark-100">{provider.name}</h3>
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">
                  </span>
                </div>
                <p className="text-sm text-dark-300 mb-4">{provider.description}</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> {provider.contactInfo?.email || 'No email'}</p>
                  <p><strong>Phone:</strong> {provider.contactInfo?.phone || 'No phone'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 ${
                      provider.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {provider.status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEditProvider(provider)}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(provider._id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-dark-100 mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Destino (Destination) *
                  </label>
                  <input
                    type="text"
                    value={serviceFormData.destino}
                    onChange={(e) => setServiceFormData({...serviceFormData, destino: e.target.value})}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Service Type *
                  </label>
                  <select
                    value={serviceFormData.type}
                    onChange={(e) => setServiceFormData({...serviceFormData, type: e.target.value})}
                    required
                    className="input-field"
                  >
                    <option value="">Select type</option>
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Description *
                </label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                  required
                  rows={3}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Provider *
                </label>
                <select
                  value={serviceFormData.providerId}
                  onChange={(e) => setServiceFormData({...serviceFormData, providerId: e.target.value})}
                  required
                  className="input-field"
                >
                  <option value="">Select provider</option>
                  {providers.map(provider => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    value={serviceFormData.cost}
                    onChange={(e) => setServiceFormData({...serviceFormData, cost: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Currency *
                  </label>
                  <select
                    value={serviceFormData.currency}
                    onChange={(e) => {
                      setServiceFormData({...serviceFormData, currency: e.target.value, exchangeRate: ''});
                    }}
                    required
                    className="input-field"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exchange Rate Input for ARS */}
              {serviceFormData.currency === 'ARS' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-green-300">Currency Conversion</h4>
                  </div>
                  <p className="text-sm text-green-200 mb-4">
                    Since you selected ARS, please provide the exchange rate to convert to USD. 
                    The amount will be stored in USD in the database for consistency.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-200 mb-2">
                        Exchange Rate (1 USD = ? ARS) *
                      </label>
                      <input
                        type="number"
                        value={serviceFormData.exchangeRate || ''}
                        onChange={(e) => setServiceFormData({...serviceFormData, exchangeRate: e.target.value})}
                        className="input-field"
                        placeholder="e.g., 1000"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    
                    {serviceFormData.cost && serviceFormData.exchangeRate && (
                      <div>
                        <label className="block text-sm font-medium text-green-200 mb-2">
                          Converted Amount (USD)
                        </label>
                        <div className="input-field bg-dark-700 text-dark-100 cursor-not-allowed">
                          U${(parseFloat(serviceFormData.cost) / parseFloat(serviceFormData.exchangeRate)).toFixed(2)} USD
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Form Modal */}
      {showProviderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-dark-100 mb-4">
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </h3>
            <form onSubmit={handleProviderSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    value={providerFormData.name}
                    onChange={(e) => setProviderFormData({...providerFormData, name: e.target.value})}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Provider Type *
                  </label>
                  <select
                    value={providerFormData.type}
                    onChange={(e) => setProviderFormData({...providerFormData, type: e.target.value})}
                    required
                    className="input-field"
                  >
                    <option value="">Select type</option>
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Description
                </label>
                <textarea
                  value={providerFormData.description}
                  onChange={(e) => setProviderFormData({...providerFormData, description: e.target.value})}
                  rows={3}
                  className="input-field"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-dark-200">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={providerFormData.contactInfo.phone}
                      onChange={(e) => setProviderFormData({
                        ...providerFormData,
                        contactInfo: {...providerFormData.contactInfo, phone: e.target.value}
                      })}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={providerFormData.contactInfo.email}
                      onChange={(e) => setProviderFormData({
                        ...providerFormData,
                        contactInfo: {...providerFormData.contactInfo, email: e.target.value}
                      })}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={providerFormData.contactInfo.website}
                    onChange={(e) => setProviderFormData({
                      ...providerFormData,
                      contactInfo: {...providerFormData.contactInfo, website: e.target.value}
                    })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingProvider ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <ServiceTemplateCategoryManager />
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;