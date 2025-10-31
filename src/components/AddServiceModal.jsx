import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getCurrencySymbol } from '../utils/formatNumbers';
import AddServiceTypeModal from './AddServiceTypeModal';
import ServiceEntryModal from './ServiceEntryModal';

const AddServiceModal = ({ isOpen, onClose, onServiceAdded, saleId, existingServiceTemplateIds = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Service data
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceTemplateSearch, setServiceTemplateSearch] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [currentServiceTemplate, setCurrentServiceTemplate] = useState(null);
  const [serviceInfo, setServiceInfo] = useState('');
  const [serviceDates, setServiceDates] = useState({ checkIn: '', checkOut: '' });
  const [serviceCost, setServiceCost] = useState('');
  const [serviceCurrency, setServiceCurrency] = useState('USD');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [destination, setDestination] = useState({ city: '', country: '' });
  
  // Service Type Modal state
  const [showAddServiceTypeModal, setShowAddServiceTypeModal] = useState(false);
  
  // Service cards state (for Added Services section)
  const [serviceCards, setServiceCards] = useState([]);
  const [showServiceEntryModal, setShowServiceEntryModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  
  // Available data
  const [providers, setProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerLoading, setProviderLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchServiceTemplates();
      fetchServiceTypes();
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
    setServiceCards([]);
    setShowServiceEntryModal(false);
    setSelectedServiceType(null);
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

  const fetchServiceTypes = async () => {
    try {
      setServiceLoading(true);
      const response = await api.get('/api/service-types?active=true');
      if (response.data.success) {
        setServiceTypes(response.data.data.serviceTypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch service types:', error);
      setError('Failed to load service types');
    } finally {
      setServiceLoading(false);
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

  const handleNext = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Step 1: Validate that at least one service is added
      if (serviceCards.length === 0) {
        setError('Please add at least one service type before proceeding');
        return;
      }
      
      // For now, we'll use the first service card's data
      // TODO: Support multiple services in a single submission
      const firstServiceCard = serviceCards[0];
      
      // Find or create a ServiceTemplate for this ServiceType
      try {
        // First, try to find an existing ServiceTemplate that uses this ServiceType
        const existingTemplate = serviceTemplates.find(t => t.serviceType === firstServiceCard.serviceTypeId);
        
        if (existingTemplate) {
          // Use the existing template
          setCurrentServiceTemplate(existingTemplate);
        } else {
          // Need to find if a template exists with this service type name
          // Check if any template has the same name as the service type
          const templateByName = serviceTemplates.find(t => t.name.toLowerCase() === firstServiceCard.serviceTypeName.toLowerCase());
          
          if (templateByName) {
            setCurrentServiceTemplate(templateByName);
          } else {
            // Create a mock template object - the backend will handle service type conversion
            const mockTemplate = {
              _id: firstServiceCard.serviceTypeId,
              name: firstServiceCard.serviceTypeName,
              serviceType: firstServiceCard.serviceTypeId,
              category: 'Other',
              isMockTemplate: true // Flag to identify mock templates
            };
            setCurrentServiceTemplate(mockTemplate);
          }
        }
        
        setServiceInfo(firstServiceCard.serviceDescription);
      } catch (error) {
        console.error('Error processing service template:', error);
        setError('Failed to process service template');
        return;
      }
    }
    
    if (currentStep === 2) {
      // Step 2: Validate dates and city
      if (!serviceDates.checkIn || !serviceDates.checkOut || !destination.city) {
        setError('Please enter check-in date, check-out date, and city');
        return;
      }
    }
    
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

  const selectServiceType = (serviceType) => {
    // Check if we can select more of this service type (max 7)
    const selectionCount = serviceCards.filter(card => 
      card.serviceTypeId === serviceType._id
    ).length;
    
    if (selectionCount >= 7) {
      return; // Can't select more
    }
    
    setSelectedServiceType(serviceType);
    setShowServiceEntryModal(true);
  };

  const handleServiceTypeAdded = (newServiceType) => {
    setServiceTypes(prev => {
      const exists = prev.some(st => st._id === newServiceType._id);
      if (!exists) {
        return [...prev, newServiceType];
      }
      return prev;
    });
    setShowAddServiceTypeModal(false);
  };

  const handleServiceAdded = (serviceCard) => {
    setServiceCards(prev => [...prev, serviceCard]);
    setShowServiceEntryModal(false);
    setSelectedServiceType(null);
  };

  const removeServiceCard = (cardId) => {
    setServiceCards(prev => prev.filter(card => card.id !== cardId));
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

      // Check if currentServiceTemplate is a real ServiceTemplate or just a mock object from ServiceType
      let actualServiceTemplate = currentServiceTemplate;
      
      // If this is a mock template created from ServiceType, create a real ServiceTemplate
      if (currentServiceTemplate.isMockTemplate) {
        // This is a mock template created from ServiceType, need to find or create real ServiceTemplate
        console.log('Detected ServiceType-based template, finding or creating ServiceTemplate...');
        
        // Try to find existing ServiceTemplate with this name
        const existingTemplate = serviceTemplates.find(t => t.name === currentServiceTemplate.name);
        
        if (existingTemplate) {
          actualServiceTemplate = existingTemplate;
        } else {
          // Create a new ServiceTemplate
          console.log('Creating new ServiceTemplate...');
          const createTemplateResponse = await api.post('/api/service-templates', {
            name: currentServiceTemplate.name,
            description: serviceInfo,
            category: 'Other',
            serviceType: currentServiceTemplate.serviceType
          });
          
          if (createTemplateResponse.data.success) {
            actualServiceTemplate = createTemplateResponse.data.data.serviceTemplate;
            // Add to local list for future use
            setServiceTemplates(prev => [...prev, actualServiceTemplate]);
          } else {
            throw new Error('Failed to create service template');
          }
        }
      }

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
        serviceTemplateId: actualServiceTemplate._id,
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
      case 1: // Step 1: Select Service Template
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-dark-100">Select Service Template</h3>
                <p className="text-sm text-dark-400">Review and manage service types for your sale</p>
              </div>
              <button
                onClick={() => setShowAddServiceTypeModal(true)}
                className="text-xs text-primary-400 hover:text-primary-300 underline whitespace-nowrap"
              >
                + Add New Service Type
              </button>
            </div>

            {/* Added Services Section */}
            {serviceCards.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium text-dark-100">Added Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {serviceCards.map((serviceCard) => (
                    <div key={serviceCard.id} className="p-4 border rounded-lg bg-primary-500/10 border-primary-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-primary-400">
                          Type: {serviceCard.serviceTypeName}
                        </p>
                        <button
                          onClick={() => removeServiceCard(serviceCard.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          title="Remove service"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-dark-300 line-clamp-2">
                        {serviceCard.serviceDescription}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-1 rounded">
                          Service
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Section */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-dark-100">
                Search and select service types from the database
              </h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search service types by name..."
                  value={serviceTemplateSearch || ''}
                  onChange={(e) => setServiceTemplateSearch(e.target.value)}
                  className="input-field w-full pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Available Service Types Section */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-dark-100">
                Available Service Types {serviceLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
              </h4>
              
              {(() => {
                // Filter service types based on search term
                const filteredServiceTypes = serviceTypes.filter(serviceType => {
                  if (serviceTemplateSearch && serviceTemplateSearch.trim()) {
                    const searchTerm = serviceTemplateSearch.toLowerCase().trim();
                    const matchesName = serviceType.name?.toLowerCase().includes(searchTerm);
                    
                    return matchesName;
                  }
                  
                  return true; // Show all available service types
                });
                
                return filteredServiceTypes.length === 0 && !serviceLoading ? (
                  <div className="text-center py-8 text-dark-400">
                    {serviceTemplateSearch && serviceTemplateSearch.trim() ? (
                      <div>
                        <p>No service types found matching "{serviceTemplateSearch}"</p>
                        <p className="text-sm mt-2">Try adjusting your search or add a new service type.</p>
                      </div>
                    ) : (
                      <p>No service types available. Add a new service type to get started.</p>
                    )}
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredServiceTypes.map((serviceType) => {
                    // Count how many times this service type has been selected
                    const selectionCount = serviceCards.filter(card => 
                      card.serviceTypeId === serviceType._id
                    ).length;
                    const canSelectMore = selectionCount < 7;
                    
                    return (
                      <div 
                        key={serviceType._id} 
                        onClick={() => canSelectMore && selectServiceType(serviceType)}
                        className={`p-4 border rounded-lg bg-dark-700/50 border-white/10 ${canSelectMore ? 'hover:bg-dark-600/50 hover:border-primary-500/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-dark-100">{serviceType.name}</h5>
                            {selectionCount > 0 && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-1 rounded">
                                  Selected: {selectionCount}/7
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-dark-400 px-2 py-1 bg-dark-600/50 rounded">
                            Service Type
                          </span>
                          {!canSelectMore && (
                            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                              Max reached (7/7)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                );
              })()}
            </div>
          </div>
        );

      case 2: // Service Dates & Destination
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Service Dates & Destination</h3>
            <p className="text-sm text-dark-400">Set check-in and check-out dates and destination for this service</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={destination.city}
                  onChange={(e) => setDestination(prev => ({ ...prev, city: e.target.value }))}
                  className="input-field"
                  placeholder="Enter city name"
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
                  const selectionCount = selectedProviders.filter(p => p._id === provider._id).length;
                  const canSelectMore = selectedProviders.length < 7;
                  
                  return (
                    <div
                      key={provider._id}
                      onClick={() => canSelectMore && handleProviderToggle(provider)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10'
                          : canSelectMore 
                            ? 'border-dark-600 hover:border-primary-500 hover:bg-primary-500/10'
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => canSelectMore && handleProviderToggle(provider)}
                          disabled={!canSelectMore}
                          className="w-4 h-4 text-primary-600 bg-dark-800 border-white/20 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-dark-100">{provider.name}</h4>
                          <p className="text-sm text-dark-400">{provider.email}</p>
                          {selectionCount > 0 && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-1 rounded">
                                Selected: {selectionCount}/7
                              </span>
                            </div>
                          )}
                        </div>
                        {!canSelectMore && !isSelected && (
                          <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                            Max reached (7/7)
                          </span>
                        )}
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
                  {(() => {
                    // Group providers by name and count occurrences
                    const providerGroups = {};
                    selectedProviders.forEach(provider => {
                      const providerName = provider.name;
                      providerGroups[providerName] = (providerGroups[providerName] || 0) + 1;
                    });
                    
                    // Format as "Provider 1, Provider 2 * 2, Provider 3"
                    return Object.entries(providerGroups)
                      .map(([name, count]) => count > 1 ? `${name} * ${count}` : name)
                      .map((displayName, index) => (
                        <div key={index} className="text-sm text-dark-200">
                          • {displayName}
                        </div>
                      ));
                  })()}
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
                <div><span className="text-primary-400">City:</span> {destination.city || 'Not set'}</div>
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
      
      {/* Add Service Type Modal */}
      <AddServiceTypeModal
        isOpen={showAddServiceTypeModal}
        onClose={() => setShowAddServiceTypeModal(false)}
        onServiceTypeAdded={handleServiceTypeAdded}
      />
      
      {/* Service Entry Modal */}
      <ServiceEntryModal
        isOpen={showServiceEntryModal}
        onClose={() => {
          setShowServiceEntryModal(false);
          setSelectedServiceType(null);
        }}
        serviceType={selectedServiceType}
        onServiceAdded={handleServiceAdded}
      />
    </div>
  );
};

export default AddServiceModal;
