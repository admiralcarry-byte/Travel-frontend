import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProviderCreationModal from '../components/ProviderCreationModal';
import AddServiceTypeModal from '../components/AddServiceTypeModal';
import ServiceTypeService from '../services/serviceTypeService';

const CupoForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceTemplateId: '',
    providerId: '',
    totalSeats: '',
    metadata: {
      date: '',
      completionDate: '',
      roomType: '',
      flightName: '',
      destination: '',
      value: '',
      currency: 'USD',
      exchangeRate: '',
      providerRef: '',
      notes: ''
    },
    status: 'active'
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Service Template management state
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceInformation, setServiceInformation] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Provider management state
  const [providers, setProviders] = useState([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'ARS', label: 'ARS' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchServiceTemplates();
    fetchProviders();
    fetchServiceTypes();
    
    // Set up periodic refresh for real-time synchronization
    const interval = setInterval(() => {
      fetchServiceTemplates();
      fetchProviders();
      fetchServiceTypes();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowServiceTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchServiceTemplates = async () => {
    try {
      setServiceLoading(true);
      const response = await api.get('/api/service-templates/sale-wizard');
      if (response.data.success) {
        setServiceTemplates(response.data.data.serviceTemplates);
      }
    } catch (error) {
      console.error('Failed to fetch service templates:', error);
      setError('Failed to fetch service templates');
    } finally {
      setServiceLoading(false);
    }
  };

  const addService = async () => {
    if (serviceName?.trim()) {
      try {
        const requestData = {
          name: serviceName.trim(),
          description: serviceInformation?.trim() || '',
          category: 'Other'
        };
        
        console.log('Creating service template with data:', requestData);
        
        const response = await api.post('/api/service-templates', requestData);
        
        if (response.data.success) {
          // Refresh service templates to ensure real-time sync
          await fetchServiceTemplates();
          setServiceName('');
          setServiceInformation('');
          setShowAddServiceModal(false);
        }
      } catch (error) {
        console.error('Failed to create service:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        setError(error.response?.data?.message || 'Failed to create service');
      }
    }
  };

  const editService = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceInformation(service.description || '');
    setShowEditServiceModal(true);
  };

  const updateService = async () => {
    if (serviceName?.trim() && editingService) {
      try {
        const response = await api.put(`/api/service-templates/${editingService._id}`, {
          name: serviceName.trim(),
          description: serviceInformation?.trim() || ''
        });
        
        if (response.data.success) {
          // Refresh service templates to ensure real-time sync
          await fetchServiceTemplates();
          setServiceName('');
          setServiceInformation('');
          setEditingService(null);
          setShowEditServiceModal(false);
        }
      } catch (error) {
        console.error('Failed to update service:', error);
        setError(error.response?.data?.message || 'Failed to update service');
      }
    }
  };

  const cancelEdit = () => {
    setServiceName('');
    setServiceInformation('');
    setEditingService(null);
    setShowEditServiceModal(false);
  };

  const openAddServiceModal = () => {
    setServiceName('');
    setServiceInformation('');
    setShowAddServiceModal(true);
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await ServiceTypeService.getAllServiceTypes({ active: true });
      if (response.success) {
        setServiceTypes(response.data.serviceTypes);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleServiceTypeAdded = (newServiceType) => {
    // Add to service types list if not already present
    setServiceTypes(prev => {
      const exists = prev.some(st => st._id === newServiceType._id);
      if (!exists) {
        return [...prev, newServiceType];
      }
      return prev;
    });
    setServiceInformation(newServiceType.name);
    setIsServiceTypeModalOpen(false);
    setShowServiceTypeDropdown(false);
  };

  const openServiceTypeModal = () => {
    setIsServiceTypeModalOpen(true);
  };

  const handleServiceTypeSelect = (serviceType) => {
    setServiceInformation(serviceType.name);
    setShowServiceTypeDropdown(false);
  };

  const toggleServiceTypeDropdown = () => {
    setShowServiceTypeDropdown(!showServiceTypeDropdown);
  };

  const fetchProviders = async () => {
    try {
      setProviderLoading(true);
      const response = await api.get('/api/providers?limit=100');
      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setError('Failed to fetch providers');
    } finally {
      setProviderLoading(false);
    }
  };

  const handleProviderCreated = (newProvider) => {
    // Add the new provider to the providers list and refresh the list for real-time sync
    setProviders(prev => [...prev, newProvider]);
    // Also refresh providers to ensure real-time sync
    fetchProviders();
    setShowProviderModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const metadataField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate exchange rate for ARS
      if (formData.metadata.currency === 'ARS' && (!formData.metadata.exchangeRate || parseFloat(formData.metadata.exchangeRate) <= 0)) {
        setError('Please provide a valid exchange rate for ARS to USD conversion');
        setLoading(false);
        return;
      }

      // Prepare data with currency conversion
      let submissionData = { ...formData };
      
      if (formData.metadata.currency === 'ARS') {
        const originalAmount = parseFloat(formData.metadata.value);
        const exchangeRate = parseFloat(formData.metadata.exchangeRate);
        const convertedAmount = originalAmount / exchangeRate;
        
        submissionData.metadata = {
          ...formData.metadata,
          value: convertedAmount, // Store converted amount in USD
          currency: 'USD', // Always store as USD in database
          originalCurrency: 'ARS', // Keep track of original currency
          originalAmount: originalAmount, // Keep track of original amount
          exchangeRate: exchangeRate // Store exchange rate used
        };
      }

      const response = await api.post('/api/cupos', submissionData);

      if (response.data.success) {
        setSuccess('Cupo created successfully!');
        setTimeout(() => {
          navigate('/inventory');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create cupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-dark-100">Add New Cupo</h1>
            <p className="mt-1 text-sm text-dark-300">
              Create inventory for a service with seat allocation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="notification bg-error-500/10 border border-error-500/20 text-error-400">
                {error}
              </div>
            )}

            {success && (
              <div className="notification bg-success-500/10 border border-success-500/20 text-success-400">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="serviceTemplateId" className="block text-sm font-medium text-dark-200">
                      Service *
                    </label>
                    <button
                      type="button"
                      onClick={openAddServiceModal}
                      className="text-xs text-primary-400 hover:text-primary-300 underline"
                    >
                      + Add New Service
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      id="serviceTemplateId"
                      name="serviceTemplateId"
                      value={formData.serviceTemplateId}
                      onChange={handleChange}
                      required
                      disabled={serviceLoading}
                      className="input-field mt-1 pr-16"
                    >
                      <option value="">
                        {serviceLoading ? 'Loading services...' : 'Select service'}
                      </option>
                      {serviceTemplates.map((service, index) => (
                        <option key={service._id || `service-${index}`} value={service._id}>
                          {service.name} - {service.description}
                        </option>
                      ))}
                    </select>
                    {/* Edit button positioned to the left of the dropdown arrow */}
                    {formData.serviceTemplateId && (
                      <button
                        type="button"
                        onClick={() => {
                          const selectedService = serviceTemplates.find(s => s._id === formData.serviceTemplateId);
                          if (selectedService) editService(selectedService);
                        }}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-300"
                        title="Edit selected service"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="providerId" className="block text-sm font-medium text-dark-200">
                      Provider *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProviderModal(true)}
                      className="text-xs text-primary-400 hover:text-primary-300 underline"
                    >
                      + Add New Provider
                    </button>
                  </div>
                  <select
                    id="providerId"
                    name="providerId"
                    value={formData.providerId}
                    onChange={handleChange}
                    required
                    disabled={providerLoading}
                    className="input-field mt-1"
                  >
                    <option value="">
                      {providerLoading ? 'Loading providers...' : 'Select provider'}
                    </option>
                    {providers.map((provider, index) => (
                      <option key={provider._id || `provider-${index}`} value={provider._id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="totalSeats" className="block text-sm font-medium text-dark-200">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    id="totalSeats"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    required
                    min="1"
                    className="input-field mt-1"
                    placeholder="Enter total number of seats"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-dark-200">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  {statusOptions.map((option, index) => (
                    <option key={option.value || `status-${index}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Service Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="metadata-date" className="block text-sm font-medium text-dark-200">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="metadata-date"
                    name="metadata.date"
                    value={formData.metadata.date}
                    onChange={handleChange}
                    required
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="metadata-completionDate" className="block text-sm font-medium text-dark-200">
                    Completion Date *
                  </label>
                  <input
                    type="date"
                    id="metadata-completionDate"
                    name="metadata.completionDate"
                    value={formData.metadata.completionDate}
                    onChange={handleChange}
                    required
                    min={formData.metadata.date ? new Date(new Date(formData.metadata.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''}
                    className="input-field mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="metadata-flightName" className="block text-sm font-medium text-dark-200">
                    Flight Name
                  </label>
                  <input
                    type="text"
                    id="metadata-flightName"
                    name="metadata.flightName"
                    value={formData.metadata.flightName}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="e.g., American Airlines 1234"
                  />
                </div>

                <div>
                  <label htmlFor="metadata-destination" className="block text-sm font-medium text-dark-200">
                    Destination
                  </label>
                  <input
                    type="text"
                    id="metadata-destination"
                    name="metadata.destination"
                    value={formData.metadata.destination}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="e.g., New York, USA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="metadata-value" className="block text-sm font-medium text-dark-200">
                    Value/Cost
                  </label>
                  <input
                    type="number"
                    id="metadata-value"
                    name="metadata.value"
                    value={formData.metadata.value}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="metadata-currency" className="block text-sm font-medium text-dark-200">
                    Currency
                  </label>
                  <select
                    id="metadata-currency"
                    name="metadata.currency"
                    value={formData.metadata.currency}
                    onChange={handleChange}
                    className="input-field mt-1"
                  >
                    {currencyOptions.map((option, index) => (
                      <option key={option.value || `currency-${index}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exchange Rate Input for ARS */}
              {formData.metadata.currency === 'ARS' && (
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
                        name="metadata.exchangeRate"
                        value={formData.metadata.exchangeRate}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g., 1000"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    
                    {formData.metadata.value && formData.metadata.exchangeRate && (
                      <div>
                        <label className="block text-sm font-medium text-green-200 mb-2">
                          Converted Amount (USD)
                        </label>
                        <div className="input-field bg-dark-700 text-dark-100 cursor-not-allowed">
                          ${(parseFloat(formData.metadata.value) / parseFloat(formData.metadata.exchangeRate)).toFixed(2)} USD
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="metadata-roomType" className="block text-sm font-medium text-dark-200">
                    Room Type
                  </label>
                  <input
                    type="text"
                    id="metadata-roomType"
                    name="metadata.roomType"
                    value={formData.metadata.roomType}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="e.g., Deluxe, Standard, Suite"
                  />
                </div>

                <div>
                  <label htmlFor="metadata-providerRef" className="block text-sm font-medium text-dark-200">
                    Provider Reference
                  </label>
                  <input
                    type="text"
                    id="metadata-providerRef"
                    name="metadata.providerRef"
                    value={formData.metadata.providerRef}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="Provider's reference number"
                  />
                </div>
              </div>

              <div>
                  <label htmlFor="metadata-notes" className="block text-sm font-medium text-dark-200">
                    Notes
                  </label>
                  <textarea
                    id="metadata-notes"
                  name="metadata.notes"
                  value={formData.metadata.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input-field mt-1"
                  placeholder="Additional notes about this cupo..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Cupo'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Add New Service Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Enter service name"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-dark-200">
                    Service Type
                  </label>
                  <button
                    type="button"
                    onClick={openServiceTypeModal}
                    className="text-primary-400 hover:text-primary-300 transition-colors"
                    title="Add new service type"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="input-field cursor-pointer flex items-center justify-between"
                    onClick={toggleServiceTypeDropdown}
                  >
                    <span className={serviceInformation ? 'text-dark-100' : 'text-dark-400'}>
                      {serviceInformation || 'Select or enter service type'}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-dark-400 transition-transform ${showServiceTypeDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {showServiceTypeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-white/10 rounded-md shadow-lg max-h-60 overflow-auto">
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map((serviceType) => (
                          <div
                            key={serviceType._id}
                            className="px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 cursor-pointer border-b border-white/5 last:border-b-0"
                            onClick={() => handleServiceTypeSelect(serviceType)}
                          >
                            {serviceType.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-dark-400">
                          No service types added yet
                        </div>
                      )}
                    </div>
                  )}
                  
                  {serviceInformation && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3">
                      <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        {serviceInformation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-dark-100 mb-4">Edit Service Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Enter service name"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-dark-200">
                    Service Type
                  </label>
                  <button
                    type="button"
                    onClick={openServiceTypeModal}
                    className="text-primary-400 hover:text-primary-300 transition-colors"
                    title="Add new service type"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="input-field cursor-pointer flex items-center justify-between"
                    onClick={toggleServiceTypeDropdown}
                  >
                    <span className={serviceInformation ? 'text-dark-100' : 'text-dark-400'}>
                      {serviceInformation || 'Select or enter service type'}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-dark-400 transition-transform ${showServiceTypeDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {showServiceTypeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-white/10 rounded-md shadow-lg max-h-60 overflow-auto">
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map((serviceType) => (
                          <div
                            key={serviceType._id}
                            className="px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 cursor-pointer border-b border-white/5 last:border-b-0"
                            onClick={() => handleServiceTypeSelect(serviceType)}
                          >
                            {serviceType.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-dark-400">
                          No service types added yet
                        </div>
                      )}
                    </div>
                  )}
                  
                  {serviceInformation && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3">
                      <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        {serviceInformation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateService}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                Update Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Creation Modal */}
      <ProviderCreationModal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onProviderCreated={handleProviderCreated}
      />
      
      {/* Add Service Type Modal */}
      <AddServiceTypeModal
        isOpen={isServiceTypeModalOpen}
        onClose={() => setIsServiceTypeModalOpen(false)}
        onServiceTypeAdded={handleServiceTypeAdded}
      />
    </div>
  );
};

export default CupoForm;