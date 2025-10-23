import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getCurrencySymbol } from '../utils/formatNumbers';

const AddServiceModal = ({ isOpen, onClose, onServiceAdded, saleId, existingServiceTemplateIds = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Service data
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [currentServiceTemplate, setCurrentServiceTemplate] = useState(null);
  const [serviceInfo, setServiceInfo] = useState('');
  const [serviceDates, setServiceDates] = useState({ checkIn: '', checkOut: '' });
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCurrency, setServiceCurrency] = useState('USD');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [destination, setDestination] = useState({ city: '', country: '' });
  
  // Available data
  const [providers, setProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerLoading, setProviderLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchServiceTemplates();
      fetchProviders();
      resetForm();
    }
  }, [isOpen]);

  // Currency conversion state
  const [serviceExchangeRate, setServiceExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);

  // Currency conversion effects
  useEffect(() => {
    if (serviceCurrency === 'USD') {
      setServiceExchangeRate('');
      setConvertedAmount(null);
    }
  }, [serviceCurrency]);

  useEffect(() => {
    if (serviceExchangeRate && serviceCost && serviceCurrency && serviceCurrency !== 'USD') {
      setConvertedAmount(parseFloat(serviceCost) / parseFloat(serviceExchangeRate));
    } else if (serviceCurrency === 'USD') {
      setConvertedAmount(parseFloat(serviceCost));
    }
  }, [serviceExchangeRate, serviceCost, serviceCurrency]);

  const resetForm = () => {
    setCurrentStep(1);
    setCurrentServiceTemplate(null);
    setServiceInfo('');
    setServiceDates({ checkIn: '', checkOut: '' });
    setServiceCost('');
    setServiceCurrency('USD');
    setServiceExchangeRate('');
    setConvertedAmount(null);
    setSelectedProvider(null);
    setSelectedProviders([]);
    setDestination({ city: '', country: '' });
    setError('');
  };

  const fetchServiceTemplates = async () => {
    try {
      const response = await api.get('/api/service-templates/sale-wizard');
      if (response.data.success) {
        const templates = response.data.data.serviceTemplates;
        setServiceTemplates(templates);
      }
    } catch (error) {
      console.error('Failed to fetch service templates:', error);
      setError('Failed to load service templates');
    }
  };

  const fetchProviders = async () => {
    try {
      setProviderLoading(true);
      const response = await api.get(`/api/providers?search=${providerSearch}&limit=50`);
      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setProviderLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 3) {
      // Service Cost step validation
      // Allow cost of 0 as valid - cost is optional and defaults to 0
      if (serviceCost === undefined || serviceCost === null || serviceCost === '' || isNaN(parseFloat(serviceCost)) || parseFloat(serviceCost) < 0) {
        setError('Please enter a valid service cost (0 or greater)');
        return;
      }
      
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError(''); // Clear any previous errors
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProviderToggle = (provider) => {
    setSelectedProviders(prev => {
      const isSelected = prev.some(p => p._id === provider._id);
      
      if (isSelected) {
        // Remove provider
        const newProviders = prev.filter(p => p._id !== provider._id);
        // Update single provider to first remaining or null
        setSelectedProvider(newProviders.length > 0 ? newProviders[0] : null);
        return newProviders;
      } else {
        // Add provider
        const newProviders = [...prev, provider];
        // Update single provider to the first one for backward compatibility
        setSelectedProvider(provider);
        return newProviders;
      }
    });
  };

  const handleSubmit = async () => {
    if (!currentServiceTemplate || !serviceInfo || !serviceDates.checkIn || !serviceDates.checkOut || selectedProviders.length === 0) {
      setError('Please complete all required fields, including selecting at least one provider');
      return;
    }
    
    // Validate service cost (allow 0 as valid)
    if (serviceCost === undefined || serviceCost === null || serviceCost === '' || isNaN(parseFloat(serviceCost)) || parseFloat(serviceCost) < 0) {
      setError('Please enter a valid service cost (0 or greater)');
      return;
    }

    // Validate exchange rate for non-USD currencies
    if (serviceCurrency !== 'USD' && (!serviceExchangeRate || isNaN(parseFloat(serviceExchangeRate)) || parseFloat(serviceExchangeRate) <= 0)) {
      setError('Please enter a valid exchange rate for non-USD currencies');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Calculate cost in USD
      let costInUSD = parseFloat(serviceCost);
      let originalCurrency = serviceCurrency;
      let originalAmount = parseFloat(serviceCost);
      let exchangeRate = null;

      if (serviceCurrency !== 'USD') {
        exchangeRate = parseFloat(serviceExchangeRate);
        costInUSD = originalAmount / exchangeRate;
      }

      // Format providers array for backend
      const formattedProviders = selectedProviders.map(provider => ({
        providerId: provider._id,
        costProvider: costInUSD, // Use actual provider cost in USD
        currency: 'USD', // Always store provider costs in USD
        commissionRate: 0
      }));

      const serviceData = {
        serviceTemplateId: currentServiceTemplate._id,
        serviceName: serviceInfo,
        serviceInfo: serviceInfo, // Add serviceInfo for compatibility
        checkIn: serviceDates.checkIn,
        checkOut: serviceDates.checkOut,
        cost: costInUSD, // Always store in USD
        costProvider: costInUSD, // Add costProvider for compatibility
        currency: 'USD', // Always store as USD in database
        originalCurrency: originalCurrency, // Keep track of original currency
        originalAmount: originalAmount, // Keep track of original amount
        exchangeRate: exchangeRate, // Store exchange rate used for conversion
        providerId: selectedProviders[0]?._id, // Keep first provider for backward compatibility
        providers: formattedProviders, // Include multiple providers
        notes: `${destination.city}, ${destination.country}`,
        destination: destination,
        serviceDates: {
          startDate: serviceDates.checkIn,
          endDate: serviceDates.checkOut
        }
      };

      console.log('Adding service with data:', serviceData);

      const response = await api.post(`/api/sales/${saleId}/services-from-template`, serviceData);
      
      if (response.data.success) {
        console.log('Service added successfully:', response.data.data.service);
        onServiceAdded(response.data.data.service);
        onClose();
        resetForm();
      } else {
        throw new Error(response.data.message || 'Failed to add service');
      }
    } catch (error) {
      console.error('Failed to add service:', error);
      setError(error.response?.data?.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Step 3: Select Service Template
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Select Service Template</h3>
            <p className="text-sm text-dark-400">Choose a service template to add to this sale</p>
            
            {serviceTemplates.filter(template => !existingServiceTemplateIds.includes(template.name)).length === 0 ? (
              <div className="text-center py-8 bg-dark-700 rounded-lg border border-dark-600">
                <div className="text-dark-400 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-3 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-dark-300">All available service templates are already added to this sale</p>
                  <p className="text-sm text-dark-400 mt-2">No additional service templates available</p>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {serviceTemplates
                .filter(template => !existingServiceTemplateIds.includes(template.name))
                .map((template) => (
                  <div
                    key={template._id}
                    onClick={() => {
                      setCurrentServiceTemplate(template);
                      setServiceInfo(template.name); // Auto-fill service info
                      setCurrentStep(2);
                    }}
                    className="p-4 border border-dark-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-500/10 transition-colors"
                  >
                    <h4 className="font-medium text-dark-100">{template.name}</h4>
                    <p className="text-sm text-dark-400 mt-1">{template.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded">
                      {template.category}
                    </span>
                  </div>
                ))}
            </div>
            )}
          </div>
        );

      case 2: // Step 4: Service Dates
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Service Dates</h3>
            <p className="text-sm text-dark-400">Set check-in and check-out dates for this service</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  value={serviceDates.checkIn}
                  onChange={(e) => setServiceDates(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  value={serviceDates.checkOut}
                  onChange={(e) => setServiceDates(prev => ({ ...prev, checkOut: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3: // Step 5: Service Cost & Provider
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Service Cost & Provider</h3>
            <p className="text-sm text-dark-400">Set the cost and select providers for this service</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Currency
                </label>
                <select
                  value={serviceCurrency}
                  onChange={(e) => setServiceCurrency(e.target.value)}
                  className="input-field"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
            </div>

            {/* Exchange Rate for non-USD currencies */}
            {serviceCurrency !== 'USD' && (
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Exchange Rate to USD *
                </label>
                <input
                  type="number"
                  value={serviceExchangeRate}
                  onChange={(e) => setServiceExchangeRate(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 1000 for 1000 ARS = 1 USD"
                  step="0.01"
                  required
                />
                {convertedAmount && (
                  <p className="text-sm text-primary-400 mt-1">
                    Converted to USD: ${convertedAmount.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Search Providers
              </label>
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setProviderSearch(value);
                  
                  // Clear existing timeout
                  if (searchTimeout) {
                    clearTimeout(searchTimeout);
                  }
                  
                  // Set new timeout for debounced search
                  const newTimeout = setTimeout(() => {
                    fetchProviders();
                  }, 300);
                  setSearchTimeout(newTimeout);
                }}
                className="input-field"
                placeholder="Search providers..."
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {providerLoading ? (
                <div className="text-center py-4 text-dark-400">Loading providers...</div>
              ) : (
                providers.map((provider) => {
                  const isSelected = selectedProviders.some(p => p._id === provider._id);
                  return (
                    <div
                      key={provider._id}
                      onClick={() => handleProviderToggle(provider)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 hover:border-primary-500 hover:bg-primary-500/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleProviderToggle(provider)}
                          className="w-4 h-4 text-primary-600 bg-dark-800 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-dark-100">{provider.name}</h4>
                          <p className="text-sm text-dark-400">{provider.email}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {selectedProviders.length > 0 && (
              <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-primary-400 mb-2">
                  Selected Providers ({selectedProviders.length})
                </h4>
                <div className="space-y-1">
                  {selectedProviders.map((provider) => (
                    <div key={provider._id} className="text-sm text-dark-200">
                      • {provider.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Step 6: Edit Services (Review)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Review Service</h3>
            <p className="text-sm text-dark-400">Review the service details before adding</p>
            
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
              <h4 className="font-medium text-dark-100 mb-3">Service Summary</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-primary-400">Template:</span> {currentServiceTemplate?.name}</div>
                <div><span className="text-primary-400">Details:</span> {serviceInfo}</div>
                <div><span className="text-primary-400">Dates:</span> {serviceDates.checkIn} to {serviceDates.checkOut}</div>
                <div><span className="text-primary-400">Cost:</span> {getCurrencySymbol(serviceCurrency)} {serviceCost}</div>
                {convertedAmount && serviceCurrency !== 'USD' && (
                  <div><span className="text-primary-400">USD Equivalent:</span> ${convertedAmount.toFixed(2)}</div>
                )}
                <div><span className="text-primary-400">Provider(s):</span> {selectedProviders.map(p => p.name).join(', ')}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark-100">Add New Service</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-dark-400 mb-2">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {renderStep()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Service...' : 'Complete Add Service'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;
