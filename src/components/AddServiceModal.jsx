import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getCurrencySymbol } from '../utils/formatNumbers';
import AddServiceTypeModal from './AddServiceTypeModal';
import ServiceEntryModal from './ServiceEntryModal';
import ServiceCostProviderModal from './ServiceCostProviderModal';

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
  
  // Service instances state (for Step 3 - similar to serviceTemplateInstances in SaleWizard)
  const [serviceInstances, setServiceInstances] = useState([]);
  
  // ServiceCostProviderModal state
  const [showServiceCostProviderModal, setShowServiceCostProviderModal] = useState(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState(null);
  
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
    
    // Cleanup timeout on unmount or when modal closes
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
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
    setServiceInstances([]);
    setShowServiceEntryModal(false);
    setSelectedServiceType(null);
    setShowServiceCostProviderModal(false);
    setSelectedServiceForModal(null);
    setError('');
  };
  
  // Global provider tracking function (similar to SaleEdit)
  const getGlobalProviderCount = (providerId, excludeServiceId = null) => {
    const count = serviceInstances.reduce((total, service) => {
      // Skip the excluded service (used when editing a specific service)
      if (excludeServiceId && (service.id === excludeServiceId || service._id === excludeServiceId)) {
        return total;
      }
      
      if (service.providers && service.providers.length > 0) {
        const providerCount = service.providers.filter(p => {
          const actualProviderId = p.providerId?._id || p._id;
          return actualProviderId === providerId;
        }).length;
        return total + providerCount;
      } else if (service.provider && service.provider._id === providerId) {
        return total + 1;
      }
      return total;
    }, 0);
    
    return count;
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

  const handleProviderSearch = (query) => {
    setProviderSearch(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If query is empty, fetch immediately
    if (query.trim() === '') {
      fetchProviders();
      return;
    }
    
    // Debounce the search for non-empty queries
    const newTimeout = setTimeout(() => {
      fetchProviders();
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Step 1: Validate that at least one service is added
      if (serviceCards.length === 0) {
        setError('Please add at least one service type before proceeding');
        return;
      }
      
      // Convert service cards to service instances
      const instances = serviceCards.map((card, index) => {
        // Find or create a ServiceTemplate for this ServiceType
        let template = serviceTemplates.find(t => t.serviceType === card.serviceTypeId);
        
        if (!template) {
          const templateByName = serviceTemplates.find(t => t.name.toLowerCase() === card.serviceTypeName.toLowerCase());
          if (templateByName) {
            template = templateByName;
          } else {
            // Create a mock template object
            template = {
              _id: card.serviceTypeId,
              name: card.serviceTypeName,
              serviceType: card.serviceTypeId,
              category: 'Other',
              isMockTemplate: true
            };
          }
        }
        
        return {
          id: `service_${card.id}_${Date.now()}_${index}`,
          serviceId: card.serviceTypeId,
          templateId: template._id,
          templateName: card.serviceTypeName,
          serviceName: card.serviceDescription,
          serviceInfo: card.serviceDescription,
          cost: 0,
          currency: 'USD',
          providers: [],
          provider: null,
          checkIn: '',
          checkOut: '',
          destination: { city: '', country: '' },
          template: template // Store the template reference
        };
      });
      
      setServiceInstances(instances);
    }
    
    if (currentStep === 2) {
      // Step 2: Validate dates and city for all services
      if (!serviceDates.checkIn || !serviceDates.checkOut || !destination.city) {
        setError('Please enter check-in date, check-out date, and city');
        return;
      }
      
      // Apply dates and destination to all service instances
      setServiceInstances(prev => prev.map(service => ({
        ...service,
        checkIn: serviceDates.checkIn,
        checkOut: serviceDates.checkOut,
        destination: destination
      })));
    }
    
    if (currentStep === 3) {
      // Step 3: Validate that all services have providers
      const servicesWithoutProviders = serviceInstances.filter(service => 
        (!service.providers || service.providers.length === 0) && !service.provider
      );
      
      if (servicesWithoutProviders.length > 0) {
        setError(`Please configure providers for all services. ${servicesWithoutProviders.length} service(s) still need provider configuration.`);
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

  // Open ServiceCostProviderModal for a specific service
  const openServiceCostProviderModal = (service) => {
    setSelectedServiceForModal(service);
    setShowServiceCostProviderModal(true);
  };

  const closeServiceCostProviderModal = () => {
    setShowServiceCostProviderModal(false);
    setSelectedServiceForModal(null);
  };

  const saveServiceCostAndProviders = (updatedService) => {
    // Update the service in serviceInstances
    setServiceInstances(prev => prev.map(service => {
      const matches = (service.id && updatedService.id && service.id === updatedService.id) || 
                     (service._id && updatedService._id && service._id === updatedService._id);
      return matches ? {
        ...service,
        ...updatedService,
        cost: updatedService.cost || 0,
        currency: updatedService.currency || 'USD',
        providers: updatedService.providers || [],
        provider: updatedService.provider || (updatedService.providers && updatedService.providers.length > 0 ? updatedService.providers[0] : null)
      } : service;
    }));
    closeServiceCostProviderModal();
  };

  // Format providers display
  const formatProvidersDisplay = (providers) => {
    if (!providers || providers.length === 0) return 'None';
    
    const providerGroups = {};
    providers.forEach(p => {
      const providerName = p.name || p.providerId?.name || 'Unknown Provider';
      providerGroups[providerName] = (providerGroups[providerName] || 0) + 1;
    });
    
    return Object.entries(providerGroups)
      .map(([name, count]) => count > 1 ? `${name} × ${count}` : name)
      .join(', ');
  };

  const handleSubmit = async () => {
    // Validate that all services have providers
    const servicesWithoutProviders = serviceInstances.filter(service => 
      (!service.providers || service.providers.length === 0) && !service.provider
    );
    
    if (servicesWithoutProviders.length > 0) {
      setError(`Please configure providers for all services. ${servicesWithoutProviders.length} service(s) still need provider configuration.`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Process and save each service
      const savedServices = [];
      
      for (const service of serviceInstances) {
        let actualServiceTemplate = service.template;
        
        // If this is a mock template, try to find or create a real ServiceTemplate
        if (actualServiceTemplate.isMockTemplate) {
          const existingTemplate = serviceTemplates.find(t => t.name === actualServiceTemplate.name);
          
          if (existingTemplate) {
            actualServiceTemplate = existingTemplate;
          } else {
            // Create a new ServiceTemplate
            const createTemplateResponse = await api.post('/api/service-templates', {
              name: actualServiceTemplate.name,
              description: service.serviceInfo,
              category: 'Other',
              serviceType: actualServiceTemplate.serviceType
            });
            
            if (createTemplateResponse.data.success) {
              actualServiceTemplate = createTemplateResponse.data.data.serviceTemplate;
              setServiceTemplates(prev => [...prev, actualServiceTemplate]);
            } else {
              throw new Error(`Failed to create service template for ${actualServiceTemplate.name}`);
            }
          }
        }

        // Calculate cost - use service cost (already in USD)
        const costInUSD = parseFloat(service.cost) || 0;

        // Format providers array for backend
        const formattedProviders = (service.providers || []).map(provider => {
          // If provider already has the correct structure, use it
          if (provider.providerId && provider.costProvider !== undefined) {
            return {
              providerId: provider.providerId._id || provider.providerId,
              costProvider: provider.costProvider || 0,
              currency: provider.currency || 'USD',
              commissionRate: provider.commissionRate || 0
            };
          }
          
          // Otherwise, it's a Provider object
          return {
            providerId: provider._id,
            costProvider: 0, // Individual provider cost can be set later
            currency: service.currency || 'USD',
            commissionRate: 0
          };
        });

        const serviceData = {
          serviceTemplateId: actualServiceTemplate._id,
          serviceName: service.serviceInfo,
          serviceInfo: service.serviceInfo,
          checkIn: service.checkIn,
          checkOut: service.checkOut,
          cost: costInUSD,
          costProvider: costInUSD,
          currency: service.currency || 'USD',
          providerId: service.providers && service.providers.length > 0 
            ? (service.providers[0]._id || service.providers[0].providerId?._id) 
            : null,
          providers: formattedProviders,
          notes: service.destination?.city ? `${service.destination.city}, ${service.destination.country || ''}` : service.serviceInfo,
          destination: service.destination || {},
          serviceDates: {
            startDate: service.checkIn,
            endDate: service.checkOut
          }
        };

        console.log('Adding service with data:', serviceData);

        const response = await api.post(`/api/sales/${saleId}/services-from-template`, serviceData);
        
        if (response.data.success) {
          savedServices.push(response.data.data.service);
          console.log('Service added successfully:', response.data.data.service);
        } else {
          throw new Error(response.data.message || `Failed to add service: ${service.serviceInfo}`);
        }
      }

      // Notify parent about all added services
      savedServices.forEach(service => onServiceAdded(service));
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to add services:', error);
      setError(error.response?.data?.message || 'Failed to add services');
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

      case 3: // Step 3: Service Cost & Provider
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Service Cost & Provider</h3>
            <p className="text-sm text-dark-400">Set the cost and select providers for each service</p>
            
            {/* Multiple Services Configuration */}
            {serviceInstances.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <p>No services to configure. Please go back and select service types.</p>
              </div>
            ) : (
              serviceInstances.map((service, index) => {
                return (
                  <div key={service.id || service._id || index} className="bg-dark-800/50 border border-white/10 rounded-lg p-6">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-dark-700/30 rounded-lg p-4 transition-colors"
                      onClick={() => openServiceCostProviderModal(service)}
                    >
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-dark-100">
                          {index + 1}. {service.serviceName || service.serviceInfo || service.templateName || 'Service'}
                        </h4>
                        <div className="mt-2 flex items-center space-x-4">
                          {/* Display cost if set and greater than 0 */}
                          {service.cost > 0 && (
                            <div className="text-sm text-primary-400">
                              Cost: {service.currency === 'USD' ? 'U$' : service.currency === 'ARS' ? 'AR$' : service.currency} {service.cost}
                            </div>
                          )}
                          {/* Display providers with quantities if providers selected */}
                          {service.providers && service.providers.length > 0 && (
                            <div className="text-sm text-primary-400">
                              Providers: {formatProvidersDisplay(service.providers)}
                            </div>
                          )}
                          {service.provider && !service.providers && (
                            <div className="text-sm text-primary-400">
                              Provider: {service.provider.name}
                            </div>
                          )}
                          {/* Show status if no cost or providers set */}
                          {(!service.cost || service.cost <= 0) && (!service.providers || service.providers.length === 0) && !service.provider && (
                            <div className="text-sm text-dark-400">
                              Click to set cost and select providers
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 4: // Step 4: Review Services
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Review Services</h3>
            <p className="text-sm text-dark-400">Review all service details before adding</p>
            
            {serviceInstances.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <p>No services to review. Please go back and configure services.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceInstances.map((service, index) => (
                  <div key={service.id || service._id || index} className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-dark-100 mb-3">
                      {index + 1}. {service.serviceName || service.serviceInfo || service.templateName || 'Service'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-primary-400">Template:</span> {service.templateName || service.template?.name || 'N/A'}</div>
                      <div><span className="text-primary-400">Details:</span> {service.serviceInfo || service.serviceName}</div>
                      <div><span className="text-primary-400">Dates:</span> {service.checkIn || 'Not set'} to {service.checkOut || 'Not set'}</div>
                      <div><span className="text-primary-400">City:</span> {service.destination?.city || 'Not set'}</div>
                      <div><span className="text-primary-400">Cost:</span> {getCurrencySymbol(service.currency || 'USD')} {service.cost || 0}</div>
                      <div><span className="text-primary-400">Provider(s):</span> {
                        service.providers && service.providers.length > 0
                          ? formatProvidersDisplay(service.providers)
                          : service.provider
                          ? service.provider.name
                          : 'None'
                      }</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      
      {/* Service Cost & Provider Modal */}
      <ServiceCostProviderModal
        isOpen={showServiceCostProviderModal}
        onClose={closeServiceCostProviderModal}
        service={selectedServiceForModal}
        onSave={saveServiceCostAndProviders}
        availableProviders={providers}
        onProviderSearch={handleProviderSearch}
        globalCurrency={serviceCurrency}
        currencyLocked={false}
        getGlobalProviderCount={getGlobalProviderCount}
        serviceId={selectedServiceForModal?.id}
      />
    </div>
  );
};

export default AddServiceModal;
