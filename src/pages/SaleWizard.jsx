import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import ProviderCreationModal from '../components/ProviderCreationModal';

const SaleWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(isEditMode ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [clientId, setClientId] = useState(null);

  // Step 1: Passengers
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [availablePassengers, setAvailablePassengers] = useState([]);
  const [passengerSearch, setPassengerSearch] = useState('');
  const [passengerLoading, setPassengerLoading] = useState(false);

  // Step 2: Companions
  const [selectedCompanions, setSelectedCompanions] = useState([]);
  const [availableCompanions, setAvailableCompanions] = useState([]);
  const [allForSelection, setAllForSelection] = useState([]);
  const [companionSearch, setCompanionSearch] = useState('');
  const [companionLoading, setCompanionLoading] = useState(false);

  // Step 3: Sale Price
  const [salePrice, setSalePrice] = useState('');
  const [saleCurrency, setSaleCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [manualExchangeRate, setManualExchangeRate] = useState(false);
  const [pricingModel, setPricingModel] = useState('unit');
  const [saleNotes, setSaleNotes] = useState('');

  // Step 4: Destination
  const [destination, setDestination] = useState({ name: '', country: '', city: '' });
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  
  // Provider selection
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerLoading, setProviderLoading] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState(new Set());
  const [providerFormData, setProviderFormData] = useState({});
  const [providerExchangeRates, setProviderExchangeRates] = useState({});

  // Summary
  const [saleSummary, setSaleSummary] = useState(null);
  
  // Provider Creation Modal
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Service Settings
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedServicesSearch, setSelectedServicesSearch] = useState('');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceInformation, setServiceInformation] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedProviderFiles, setSelectedProviderFiles] = useState(null);

  const steps = [
    { number: 1, title: 'Select Passenger', description: 'Choose one registered passenger for this sale' },
    { number: 2, title: 'Select Acompañantes', description: 'Choose acompañantes for the selected passenger' },
    { number: 3, title: 'Set Sale Price', description: 'Define pricing model and currency' },
    { number: 4, title: 'Enter Destination', description: 'Specify travel destination and select providers' },
    { number: 5, title: 'Review & Create', description: 'Review and finalize sale' }
  ];

  useEffect(() => {
    fetchPassengers();
    fetchProviders();
    fetchServices();
    fetchServiceTemplates();
    
    // Set up periodic refresh for real-time synchronization
    const interval = setInterval(() => {
      fetchServiceTemplates();
      fetchProviders();
    }, 30000); // Refresh every 30 seconds
    
    // If in edit mode, fetch the existing sale data
    if (isEditMode && id) {
      fetchExistingSale();
    }
    
    return () => clearInterval(interval);
  }, []);

  // Fetch passengers when search changes (skip in edit mode starting at step 3)
  useEffect(() => {
    if ((passengerSearch.length >= 2 || passengerSearch.length === 0) && !(isEditMode && currentStep >= 3) && !loading) {
      fetchPassengers();
    }
  }, [passengerSearch, isEditMode, currentStep, loading]);

  // Fetch companions when a passenger is selected (skip in edit mode starting at step 3)
  useEffect(() => {
    if (selectedPassengers.length > 0 && !(isEditMode && currentStep >= 3) && !loading) {
      fetchCompanions();
      fetchAllForSelection();
    }
  }, [selectedPassengers, isEditMode, currentStep, loading]);

  // Fetch all for selection when search changes (skip in edit mode starting at step 3)
  useEffect(() => {
    if ((companionSearch.length >= 2 || companionSearch.length === 0) && !(isEditMode && currentStep >= 3) && !loading) {
      fetchAllForSelection();
    }
  }, [companionSearch, isEditMode, currentStep, loading]);

  // Fetch providers when search changes
  useEffect(() => {
    if (providerSearch.length >= 2 || providerSearch.length === 0) {
      fetchProviders();
    }
  }, [providerSearch]);

  // Refetch services when selectedServices changes in edit mode to update available services
  useEffect(() => {
    if (isEditMode) {
      // Always refetch when in edit mode, regardless of selectedServices length
      // This ensures available services are refreshed when services are deselected
      fetchServiceTemplates();
    }
  }, [selectedServices, isEditMode]);


  // Currency conversion effects
  useEffect(() => {
    if (saleCurrency && saleCurrency !== 'USD' && !manualExchangeRate) {
      fetchExchangeRate();
    } else if (saleCurrency === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
      setManualExchangeRate(false);
    }
  }, [saleCurrency, salePrice, manualExchangeRate]);

  useEffect(() => {
    if (manualExchangeRate && exchangeRate && salePrice) {
      setConvertedAmount(parseFloat(salePrice) / parseFloat(exchangeRate));
    } else if (!manualExchangeRate && exchangeRate && salePrice) {
      setConvertedAmount(parseFloat(salePrice) / parseFloat(exchangeRate));
    }
  }, [exchangeRate, salePrice, manualExchangeRate]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services?limit=100');
      if (response.data.success) {
        let services = response.data.data.services;
        
        // In edit mode, filter out services that are already selected
        if (isEditMode && selectedServices.length > 0) {
          const selectedServiceIds = selectedServices.map(service => 
            service._id || service.serviceId?._id || service.serviceId
          );
          services = services.filter(service => 
            !selectedServiceIds.includes(service._id)
          );
          console.log('Filtered out selected services from available services:', selectedServiceIds);
        }
        
        setAvailableServices(services);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchPassengers = async () => {
    try {
      setPassengerLoading(true);
      const response = await api.get(`/api/clients?search=${passengerSearch}&limit=50&isMainClient=true`);
      if (response.data.success) {
        console.log('Fetched available passengers:', response.data.data.clients);
        setAvailablePassengers(response.data.data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch passengers:', error);
    } finally {
      setPassengerLoading(false);
    }
  };

  const fetchCompanions = async () => {
    if (selectedPassengers.length === 0) return;
    
    try {
      setCompanionLoading(true);
      const response = await api.get(`/api/clients/${selectedPassengers[0]._id}/companions?search=${companionSearch}`);
      if (response.data.success) {
        const companions = response.data.data.companions;
        setAvailableCompanions(companions);
        // Only auto-select companions if not in edit mode
        if (!isEditMode) {
          setSelectedCompanions(companions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch companions:', error);
      // Handle 404 gracefully - client might not have companions
      if (error.response?.status === 404) {
        setAvailableCompanions([]);
        console.log('No companions found for this client');
      }
    } finally {
      setCompanionLoading(false);
    }
  };

  const fetchAllForSelection = async () => {
    if (selectedPassengers.length === 0) return;
    
    try {
      setCompanionLoading(true);
      const excludeClientId = selectedPassengers[0]._id;
      const response = await api.get(`/api/clients/all-for-selection?search=${companionSearch}&excludeClientId=${excludeClientId}`);
      if (response.data.success) {
        const allForSelection = response.data.data.allForSelection;
        setAllForSelection(allForSelection);
      }
    } catch (error) {
      console.error('Failed to fetch all for selection:', error);
      // Handle 404 gracefully - endpoint might not exist
      if (error.response?.status === 404) {
        setAllForSelection([]);
        console.log('All for selection endpoint not found');
      }
    } finally {
      setCompanionLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await api.get(`/api/payments/exchange-rate?from=USD&to=${saleCurrency}`);
      if (response.data.success) {
        setExchangeRate(response.data.data.rate.toString());
        if (salePrice) {
          setConvertedAmount(parseFloat(salePrice) / response.data.data.rate);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
      setExchangeRate('');
      setConvertedAmount(null);
    }
  };

  const searchDestinations = async (query) => {
    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }
    
    try {
      const response = await api.post('/api/destinations/search', { query, limit: 5 });
      if (response.data.success) {
        setDestinationSuggestions(response.data.data.destinations);
      }
    } catch (error) {
      console.error('Failed to search destinations:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      setProviderLoading(true);
      const response = await api.get(`/api/providers?search=${providerSearch}&limit=50`);
      if (response.data.success) {
        setAvailableProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setProviderLoading(false);
    }
  };

  const fetchExistingSale = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/sales/${id}`);
      if (response.data.success) {
        const sale = response.data.data.sale;
        
        // Set the current sale ID for edit mode
        setCurrentSaleId(sale._id);
        
        // Store the client ID for later use in update
        const extractedClientId = sale.clientId._id || sale.clientId;
        console.log('Extracted client ID from sale:', extractedClientId);
        setClientId(extractedClientId);
        
        // Pre-populate passengers (primary passenger)
        if (sale.passengers && sale.passengers.length > 0) {
          const primaryPassenger = sale.passengers[0];
          console.log('Primary passenger from sale:', primaryPassenger);
          
          // Extract the actual passenger data from passengerId object
          const passengerData = primaryPassenger.passengerId || primaryPassenger;
          console.log('Extracted passenger data:', passengerData);
          
          // Ensure the passenger has the expected structure
          const formattedPassenger = {
            _id: passengerData._id || primaryPassenger._id || primaryPassenger.clientId,
            name: passengerData.name || passengerData.firstName || '',
            surname: passengerData.surname || passengerData.lastName || '',
            phone: passengerData.phone || '',
            passportNumber: passengerData.passportNumber || '',
            email: passengerData.email || ''
          };
          
          console.log('Formatted passenger:', formattedPassenger);
          setSelectedPassengers([formattedPassenger]);
          
          // Debug: Also log what we're setting as selectedPassengers
          console.log('Setting selectedPassengers to:', [formattedPassenger]);
        }
        
        // Pre-populate companions
        if (sale.passengers && sale.passengers.length > 1) {
          const companions = sale.passengers.slice(1).map(companion => {
            // Extract the actual companion data from passengerId object
            const companionData = companion.passengerId || companion;
            
            return {
              _id: companionData._id || companion._id || companion.clientId,
              name: companionData.name || companionData.firstName || '',
              surname: companionData.surname || companionData.lastName || '',
              phone: companionData.phone || '',
              passportNumber: companionData.passportNumber || '',
              email: companionData.email || ''
            };
          });
          setSelectedCompanions(companions);
        }
        
        // Pre-populate sale price and currency
        if (sale.salePrice) {
          setSalePrice(sale.salePrice.toString());
        }
        if (sale.saleCurrency) {
          setSaleCurrency(sale.saleCurrency);
        }
        if (sale.exchangeRate) {
          setExchangeRate(sale.exchangeRate.toString());
        }
        if (sale.saleNotes) {
          setSaleNotes(sale.saleNotes);
        }
        
        // Pre-populate destination
        if (sale.destination) {
          setDestination({
            name: sale.destination.name || '',
            country: sale.destination.country || '',
            city: sale.destination.city || ''
          });
        }
        
        // Pre-populate services and providers
        if (sale.services && sale.services.length > 0) {
          const selectedServices = sale.services.map(serviceSale => {
            console.log('Mapping service for edit mode:', serviceSale);
            const mappedService = {
              ...serviceSale,
              _id: serviceSale.serviceId?._id || serviceSale.serviceId || serviceSale._id,
              name: serviceSale.serviceName || serviceSale.serviceId?.destino || 'Unknown Service',
              serviceName: serviceSale.serviceName || serviceSale.serviceId?.destino || 'Unknown Service', // Ensure serviceName is set
              description: serviceSale.serviceId?.description || serviceSale.notes || '',
              destino: serviceSale.serviceId?.destino || serviceSale.serviceName || 'Unknown Service',
              type: serviceSale.serviceId?.type || 'Unknown Type',
              providerId: serviceSale.providerId,
              serviceId: serviceSale.serviceId?._id || serviceSale.serviceId,
              providers: serviceSale.providers || (serviceSale.providerId ? [serviceSale.providerId] : [])
            };
            console.log('Mapped service:', mappedService);
            return mappedService;
          });
          
          // Set these services as selected since they're part of the existing sale
          setSelectedServices(selectedServices);
          
          // Pre-populate providers and their form data
          const allProviders = [];
          const providerFormDataMap = {};
          
          sale.services.forEach(serviceSale => {
            if (serviceSale.providers && serviceSale.providers.length > 0) {
              serviceSale.providers.forEach(provider => {
                const providerId = provider.providerId?._id || provider.providerId;
                if (providerId && !allProviders.find(p => p._id === providerId)) {
                  allProviders.push(provider.providerId || provider);
                  
                  // Set up form data for this provider
                  providerFormDataMap[providerId] = {
                    cost: provider.costProvider || 0,
                    currency: provider.currency || 'USD',
                    startDate: provider.startDate ? new Date(provider.startDate).toISOString().split('T')[0] : null,
                    endDate: provider.endDate ? new Date(provider.endDate).toISOString().split('T')[0] : null,
                    receipts: [], // Will be populated from documents
                    documents: provider.documents || []
                  };
                }
              });
            } else if (serviceSale.providerId) {
              const providerId = serviceSale.providerId._id || serviceSale.providerId;
              if (!allProviders.find(p => p._id === providerId)) {
                allProviders.push(serviceSale.providerId);
                
                // Set up form data for this provider
                providerFormDataMap[providerId] = {
                  cost: serviceSale.costProvider || 0,
                  currency: serviceSale.currency || 'USD',
                  startDate: serviceSale.serviceDates?.startDate ? new Date(serviceSale.serviceDates.startDate).toISOString().split('T')[0] : null,
                  endDate: serviceSale.serviceDates?.endDate ? new Date(serviceSale.serviceDates.endDate).toISOString().split('T')[0] : null,
                  receipts: [], // Will be populated from documents
                  documents: serviceSale.documents || []
                };
              }
            }
          });
          
          setSelectedProviders(allProviders);
          setProviderFormData(providerFormDataMap);
          
          // After setting selected services, fetch available services (filtered)
          fetchServices();
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing sale:', error);
      setError('Failed to load sale data for editing');
    } finally {
      setLoading(false);
    }
  };

  const togglePassengerSelection = (passenger) => {
    const isSelected = selectedPassengers.find(p => p._id === passenger._id);
    if (isSelected) {
      // Remove the passenger if already selected
      setSelectedPassengers([]);
    } else {
      // Select only this passenger (replace any existing selection)
      console.log('Selected passenger data:', JSON.stringify(passenger, null, 2));
      setSelectedPassengers([passenger]);
    }
  };

  const removeSelectedPassenger = (passengerId) => {
    setSelectedPassengers(selectedPassengers.filter(p => p._id !== passengerId));
  };

  const toggleCompanionSelection = (companion) => {
    const isSelected = selectedCompanions.find(c => c._id === companion._id);
    if (isSelected) {
      setSelectedCompanions(selectedCompanions.filter(c => c._id !== companion._id));
    } else {
      setSelectedCompanions([...selectedCompanions, companion]);
    }
  };

  const removeSelectedCompanion = (companionId) => {
    setSelectedCompanions(selectedCompanions.filter(c => c._id !== companionId));
  };

  const toggleProviderSelection = (provider) => {
    const isSelected = selectedProviders.find(p => p._id === provider._id);
    if (isSelected) {
      // Remove from selected and add back to available
      setSelectedProviders(prev => prev.filter(p => p._id !== provider._id));
      setAvailableProviders(prev => [...prev, provider]);
    } else {
      // Remove from available and add to selected
      setAvailableProviders(prev => prev.filter(p => p._id !== provider._id));
      setSelectedProviders(prev => [...prev, provider]);
    }
  };

  const removeSelectedProvider = (providerId) => {
    const provider = selectedProviders.find(p => p._id === providerId);
    if (provider) {
      // Remove from selected and add back to available
      setSelectedProviders(prev => prev.filter(p => p._id !== providerId));
      setAvailableProviders(prev => [...prev, provider]);
      
      // Clean up expanded state and form data
      setExpandedProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
      setProviderFormData(prev => {
        const newData = { ...prev };
        delete newData[providerId];
        return newData;
      });
    }
  };

  const toggleProviderExpansion = (providerId) => {
    setExpandedProviders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  // Helper function to get form data with defaults
  const getProviderFormData = (providerId) => {
    return providerFormData[providerId] || {
      cost: '',
      currency: 'USD',
      startDate: '',
      endDate: '',
      documents: []
    };
  };

  const updateProviderFormData = (providerId, field, value) => {
    setProviderFormData(prev => {
      const currentData = prev[providerId] || {
        cost: '',
        currency: 'USD',
        startDate: '',
        endDate: '',
        documents: []
      };
      const newData = {
        ...currentData,
        [field]: value
      };

      // If start date is being updated and there's an existing end date,
      // clear the end date if it's now before the new start date
      if (field === 'startDate' && currentData.endDate && value && currentData.endDate < value) {
        newData.endDate = '';
      }

      return {
        ...prev,
        [providerId]: newData
      };
    });

    // Trigger currency conversion when currency or cost changes
    if (field === 'currency') {
      const currentFormData = getProviderFormData(providerId);
      const cost = currentFormData.cost;
      if (cost) {
        fetchProviderExchangeRate(providerId, value);
      }
    } else if (field === 'cost') {
      const currentFormData = getProviderFormData(providerId);
      const currency = currentFormData.currency || 'USD';
      if (currency !== 'USD') {
        fetchProviderExchangeRate(providerId, currency);
      }
    }
  };

  const handleProviderFileUpload = (providerId, files) => {
    // Handle multiple file uploads for provider receipts
    const fileArray = Array.from(files);
    updateProviderFormData(providerId, 'receipts', fileArray);
  };

  const openFileModal = (providerId) => {
    const formData = getProviderFormData(providerId);
    setSelectedProviderFiles({
      providerId,
      files: formData.receipts || []
    });
    setShowFileModal(true);
  };

  const closeFileModal = () => {
    setShowFileModal(false);
    setSelectedProviderFiles(null);
  };

  const openFile = (file) => {
    if (file instanceof File) {
      // For File objects, create a URL and open in new tab
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else if (file.url) {
      // For files with URLs, open directly
      window.open(file.url, '_blank');
    }
  };

  const fetchProviderExchangeRate = async (providerId, fromCurrency) => {
    if (fromCurrency === 'USD') {
      setProviderExchangeRates(prev => ({
        ...prev,
        [providerId]: 1
      }));
      return;
    }

    try {
      const response = await api.get(`/api/payments/exchange-rate?from=${fromCurrency}&to=USD`);
      if (response.data.success) {
        setProviderExchangeRates(prev => ({
          ...prev,
          [providerId]: response.data.data.rate
        }));
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate for provider:', error);
      setProviderExchangeRates(prev => ({
        ...prev,
        [providerId]: 1
      }));
    }
  };

  const convertProviderAmountToUSD = (providerId, amount, currency) => {
    const rate = providerExchangeRates[providerId] || 1;
    return amount ? (parseFloat(amount) * rate).toFixed(2) : 0;
  };

  // Service Management Functions
  const fetchServiceTemplates = async () => {
    try {
      setServiceLoading(true);
      const response = await api.get('/api/service-templates');
      if (response.data.success) {
        setServices(response.data.data.serviceTemplates);
        // Also update availableServices so they appear in the Available Services section
        setAvailableServices(response.data.data.serviceTemplates);
      }
    } catch (error) {
      console.error('Failed to fetch service templates:', error);
    } finally {
      setServiceLoading(false);
    }
  };

  const addService = async () => {
    if (serviceName.trim()) {
      try {
        const response = await api.post('/api/service-templates', {
          name: serviceName.trim(),
          description: serviceInformation.trim(),
          category: 'General'
        });
        
        if (response.data.success) {
          // Just refresh service templates - don't add to selectedServices
          // Let users select from available services
          await fetchServiceTemplates();
          setServiceName('');
          setServiceInformation('');
          setShowAddServiceModal(false);
        }
      } catch (error) {
        console.error('Failed to create service:', error);
        setError(error.response?.data?.message || 'Failed to create service');
      }
    }
  };

  const toggleServiceSelection = (service) => {
    const isSelected = selectedServices.find(s => s._id === service._id);
    if (isSelected) {
      setSelectedServices(prev => prev.filter(s => s._id !== service._id));
      } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const removeSelectedService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s._id !== serviceId));
  };

  const editService = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceInformation(service.description || '');
    setShowEditServiceModal(true);
  };

  const updateService = async () => {
    if (serviceName.trim() && editingService) {
      try {
        const response = await api.put(`/api/service-templates/${editingService._id}`, {
          name: serviceName.trim(),
          description: serviceInformation.trim()
        });
        
        if (response.data.success) {
          // Update the service in selectedServices if it's selected
          setSelectedServices(prev => prev.map(service => 
            service._id === editingService._id 
              ? {
                  ...service,
                  name: serviceName.trim(),
                  description: serviceInformation.trim(),
                  serviceName: serviceName.trim(),
                  destino: serviceName.trim()
                }
              : service
          ));
          
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

  const createSale = async () => {
    try {
    setLoading(true);
    setError('');

      // Validate required fields
      if (selectedPassengers.length === 0) {
        setError('Please select a passenger');
        return;
      }

      if (!salePrice || !destination.name || !destination.country) {
        setError('Sale price, destination name, and country are required');
        return;
      }
      
      // Validate passenger data
      const allPassengers = [...selectedPassengers, ...selectedCompanions];
      for (const passenger of allPassengers) {
        if (!passenger.name || !passenger.surname || !passenger.dni) {
          setError(`Missing required fields for ${passenger.name || 'passenger'}: name, surname, and DNI are required`);
          return;
        }
      }

      const saleData = {
        passengers: [
          ...selectedPassengers.map(p => {
            console.log('Mapping selected passenger:', p);
            return {
              clientId: p._id,
              name: p.name || '',
              surname: p.surname || '',
              dni: p.dni || '',
              passportNumber: p.passportNumber || null,
              dob: p.dob || null,
              email: p.email || null,
              phone: p.phone || null,
              type: 'main_passenger',
              price: salePrice ? parseFloat(salePrice) : 0
            };
          }),
          ...selectedCompanions.map(c => {
            console.log('Mapping selected companion:', c);
            return {
              clientId: c._id,
              name: c.name || '',
              surname: c.surname || '',
              dni: c.dni || '',
              passportNumber: c.passportNumber || null,
              dob: c.dob || null,
              email: c.email || null,
              phone: c.phone || null,
              type: 'companion',
              price: salePrice ? parseFloat(salePrice) : 0
            };
          })
        ],
        destination,
        selectedServices: selectedServices.map(service => ({
          serviceTemplateId: service._id,
          name: service.name || service.serviceName || service.destino || 'Unknown Service'
        })),
        selectedProviders: selectedProviders.map(provider => {
          const formData = providerFormData[provider._id] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
          
          return {
            providerId: provider._id,
            name: provider.name,
            type: provider.type,
            phone: provider.phone,
            email: provider.email,
            cost: formData.cost ? parseFloat(formData.cost) : null,
            currency: formData.currency || 'USD',
            usdAmount: parseFloat(usdAmount),
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            receipt: formData.receipt || null
          };
        }),
        // Calculate total provider costs in USD
        totalProviderCostsUSD: selectedProviders.reduce((total, provider) => {
          const formData = providerFormData[provider._id] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
          return total + parseFloat(usdAmount);
        }, 0),
        pricingModel: 'unit', // Always unit pricing
        saleCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
        baseCurrency: 'USD',
        originalSalePrice: salePrice ? parseFloat(salePrice) : null,
        originalCurrency: saleCurrency
      };

      const response = await api.post('/api/sales/new-flow', saleData);
      
      if (response.data.success) {
        setCurrentSaleId(response.data.data.sale._id);
        setSaleSummary(response.data.data.sale);
        setSuccess('Sale created successfully!');
        setCurrentStep(5);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      // Validate current step before proceeding
      if (currentStep === 1 && selectedPassengers.length === 0) {
        setError('Please select a passenger to continue');
        return;
      }
      
      if (currentStep === 4 && (!destination.name || !destination.country)) {
        setError('Please enter destination name and country to continue');
        return;
      }
      
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSellCompleted = async () => {
    try {
      // Debug: Check authentication and API config
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('Full token:', token);
      console.log('API instance baseURL:', api.defaults.baseURL);
      console.log('API instance timeout:', api.defaults.timeout);
      console.log('API instance headers:', api.defaults.headers);
      
      // Try to decode the token to see if it's valid
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            console.error('Invalid JWT format - should have 3 parts separated by dots');
            setError('Invalid authentication token. Please log in again.');
            localStorage.removeItem('token');
            setTimeout(() => window.location.href = '/login', 2000);
            return;
          }
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
          console.log('Token exp:', new Date(payload.exp * 1000));
          console.log('Token is expired:', payload.exp * 1000 < Date.now());
        } catch (e) {
          console.error('Token decode error:', e);
          console.error('Token format issue - clearing token');
          setError('Invalid authentication token. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }
      } else {
        console.error('No token found');
        setError('No authentication token found. Please log in.');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      // Validate required fields
      if (selectedPassengers.length === 0) {
        setError('Please select at least one passenger');
        return;
      }
      
      if (!selectedPassengers[0]._id) {
        setError('Selected passenger is missing ID information');
        return;
      }
      
      if (!destination.name || !destination.country) {
        setError('Please enter destination name and country');
        return;
      }
      
      if (!salePrice || parseFloat(salePrice) <= 0) {
        setError('Please enter a valid sale price');
        return;
      }

      // Upload provider files first
      const providerDocuments = {};
      for (const provider of selectedProviders) {
        const formData = providerFormData[provider._id] || {};
        if (formData.receipts && formData.receipts.length > 0) {
          providerDocuments[provider._id] = [];
          for (const file of formData.receipts) {
            try {
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('providerId', provider._id);
              formDataUpload.append('saleId', 'temp'); // Will be updated after sale creation
              
              const uploadResponse = await api.post('/api/upload/provider-document', formDataUpload, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              if (uploadResponse.data.success) {
                providerDocuments[provider._id].push({
                  filename: file.name,
                  url: uploadResponse.data.url,
                  type: 'receipt'
                });
              }
            } catch (uploadError) {
              console.error('Error uploading file:', uploadError);
              // Fallback: store file info without URL
              providerDocuments[provider._id].push({
                filename: file.name,
                url: '', // Will be empty if upload fails
                type: 'receipt'
              });
            }
          }
        }
      }

      // Debug: Log companion data
      console.log('Selected companions before mapping:', selectedCompanions);
      selectedCompanions.forEach((c, index) => {
        console.log(`Companion ${index}:`, {
          name: c.name,
          surname: c.surname,
          dni: c.dni,
          _id: c._id
        });
      });

      // Prepare sale data for new flow
      const saleData = {
        clientId: selectedPassengers[0]._id, // Add the required clientId field
        passengers: [
          ...selectedPassengers.map(p => {
            console.log('Mapping selected passenger:', p);
            console.log('Passenger email:', p.email);
            console.log('Passenger phone:', p.phone);
            console.log('Passenger passportNumber:', p.passportNumber);
            return {
              clientId: p._id,
              name: p.name || '',
              surname: p.surname || '',
              dni: p.dni || '',
              passportNumber: p.passportNumber || '',
              dob: p.dob || null,
              email: p.email || '',
              phone: p.phone || '',
              type: 'main_passenger',
              price: salePrice ? parseFloat(salePrice) : 0
            };
          }),
          ...selectedCompanions.map(c => {
            console.log('Mapping selected companion:', c);
            return {
              clientId: c._id,
              name: c.name || '',
              surname: c.surname || '',
              dni: c.dni || '',
              passportNumber: c.passportNumber || null,
              dob: c.dob || null,
              email: c.email || null,
              phone: c.phone || null,
              type: 'companion',
              price: salePrice ? parseFloat(salePrice) : 0
            };
          })
        ],
        destination,
        selectedServices: selectedServices.map(service => ({
          serviceTemplateId: service._id,
          name: service.name || service.serviceName || service.destino || 'Unknown Service'
        })),
        selectedProviders: selectedProviders.map(provider => {
          const formData = providerFormData[provider._id] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
          
          return {
            providerId: provider._id,
            name: provider.name,
            type: provider.type,
            phone: provider.phone,
            email: provider.email,
            cost: formData.cost ? parseFloat(formData.cost) : null,
            currency: formData.currency || 'USD',
            usdAmount: parseFloat(usdAmount),
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            receipt: formData.receipt || null
          };
        }),
        // Calculate total provider costs in USD
        totalProviderCostsUSD: selectedProviders.reduce((total, provider) => {
          const formData = providerFormData[provider._id] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
          return total + parseFloat(usdAmount);
        }, 0),
        pricingModel: 'unit', // Always unit pricing
        saleCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1,
        pricingModel: pricingModel,
        notes: saleNotes || ''
      };

      // Debug: Log the request details
      console.log('Making request to:', '/api/sales/new-flow');
      console.log('Selected passengers:', selectedPassengers);
      console.log('First passenger _id:', selectedPassengers[0]?._id);
      console.log('Sale data:', saleData);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Full URL will be:', api.defaults.baseURL + '/api/sales/new-flow');
      
      // Test API instance with a simple request first
      try {
        console.log('Testing API instance with health check...');
        const healthResponse = await api.get('/api/health');
        console.log('Health check successful:', healthResponse.status);
        
        // Test auth with a seller-accessible endpoint
        console.log('Testing authentication...');
        const authResponse = await api.get('/api/sales/stats');
        console.log('Auth test successful:', authResponse.status);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        console.error('Health check error status:', healthError.response?.status);
        if (healthError.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }
        setError('API connection failed. Please check if the backend server is running.');
        return;
      }
      
      // Add temporary interceptor to log the actual request
      const requestInterceptor = api.interceptors.request.use(
        (config) => {
          console.log('Actual request config:', {
            url: config.url,
            baseURL: config.baseURL,
            method: config.method,
            headers: config.headers,
            authorization: config.headers.Authorization
          });
          return config;
        }
      );
      
      // Create the sale using the new flow endpoint
      const response = await api.post('/api/sales/new-flow', saleData);
      
      // Remove the interceptor
      api.interceptors.request.eject(requestInterceptor);
      
      if (response.data.success) {
        const saleId = response.data.data.sale._id;
        setSuccess('Sale created successfully!');
        setError('');
        
        // Navigate to the sales summary page
        setTimeout(() => {
          navigate(`/sales/${saleId}`);
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to create sale');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to create sale');
    }
  };

  const handleUpdateSale = async () => {
    try {
      // Validate required fields
      if (selectedPassengers.length === 0) {
        setError('Please select at least one passenger');
        return;
      }
      
      if (!selectedPassengers[0]._id) {
        setError('Selected passenger is missing ID information');
        return;
      }
      
      if (!destination.name || !destination.country) {
        setError('Please enter destination name and country');
        return;
      }
      
      if (!salePrice || parseFloat(salePrice) <= 0) {
        setError('Please enter a valid sale price');
        return;
      }

      // Upload provider files first
      const providerDocuments = {};
      for (const provider of selectedProviders) {
        const formData = providerFormData[provider._id] || {};
        if (formData.receipts && formData.receipts.length > 0) {
          providerDocuments[provider._id] = [];
          for (const file of formData.receipts) {
            try {
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('providerId', provider._id);
              formDataUpload.append('saleId', currentSaleId);
              
              const uploadResponse = await api.post('/api/upload/provider-document', formDataUpload, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              if (uploadResponse.data.success) {
                providerDocuments[provider._id].push({
                  filename: file.name,
                  url: uploadResponse.data.url,
                  uploadedAt: new Date()
                });
              }
            } catch (error) {
              console.error('Error uploading file for provider:', provider._id, error);
            }
          }
        }
      }

      // Prepare sale data for update
      const saleData = {
        clientId: clientId,
        passengers: [
          ...selectedPassengers.map(p => ({
            isMainClient: true,
            clientId: clientId,
            price: parseFloat(salePrice) || 0,
            notes: ''
          })),
          ...selectedCompanions.map(c => ({
            passengerId: c._id,
            price: parseFloat(salePrice) || 0,
            notes: ''
          }))
        ],
        services: selectedServices.map(service => {
          // Ensure serviceName is always present
          const serviceName = service.name || service.serviceName || service.destino || 'Unknown Service';
          console.log('Processing service for update:', {
            _id: service._id,
            serviceId: service.serviceId,
            name: service.name,
            serviceName: service.serviceName,
            destino: service.destino,
            finalServiceName: serviceName
          });
          
          return {
            serviceId: service._id || service.serviceId, // Add serviceId for backend validation
            serviceName: serviceName, // Ensure this is always present
            priceClient: parseFloat(salePrice) || 0,
            costProvider: parseFloat(service.costProvider) || 0,
            currency: saleCurrency,
            quantity: 1,
            serviceDates: {
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
            notes: service.description || '',
            providers: selectedProviders.map(provider => {
              const formData = providerFormData[provider._id] || {};
              return {
                providerId: provider._id,
                serviceProviderId: provider._id,
                costProvider: formData.cost ? parseFloat(formData.cost) : 0,
                currency: formData.currency || 'USD',
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                documents: providerDocuments[provider._id] || []
              };
            }),
            providerId: selectedProviders.length > 0 ? selectedProviders[0]._id : null
          };
        }),
        destination: {
          name: destination.name,
          country: destination.country,
          city: destination.city || ''
        },
        saleCurrency: saleCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1,
        pricingModel: pricingModel,
        notes: saleNotes || ''
      };

      // Debug: Log the IDs being used
      console.log('Update sale - URL param id:', id);
      console.log('Update sale - currentSaleId:', currentSaleId);
      console.log('Update sale - using currentSaleId for API call');
      console.log('Update sale - selectedServices:', selectedServices);
      console.log('Update sale - selectedServices details:', selectedServices.map(s => ({
        _id: s._id,
        serviceId: s.serviceId,
        name: s.name,
        serviceName: s.serviceName,
        destino: s.destino,
        costProvider: s.costProvider
      })));
      console.log('Update sale - saleData being sent:', JSON.stringify(saleData, null, 2));
      
      // Validate that currentSaleId exists
      if (!currentSaleId) {
        setError('Sale ID is missing. Please refresh the page and try again.');
        return;
      }
      
      // Update the sale using PUT request
      const response = await api.put(`/api/sales/${currentSaleId}`, saleData);
      
      if (response.data.success) {
        setSuccess('Sale updated successfully!');
        setError('');
        
        // Navigate to the sales summary page
        setTimeout(() => {
          navigate(`/sales/${currentSaleId}`);
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to update sale');
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to update sale');
    }
  };

  const handleProviderCreated = (newProvider) => {
    // Add the new provider to the available providers list only
    setAvailableProviders(prev => [...prev, newProvider]);
    // Also refresh providers to ensure real-time sync
    fetchProviders();
    setShowProviderModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">
          {isEditMode ? 'Edit Sale' : 'Create New Sale'}
        </h1>
        <p className="text-dark-300 mt-2">
          {isEditMode 
            ? 'Update the sale information by following the steps below' 
            : 'Follow the steps to create a new sale with the updated flow'
          }
        </p>
      </div>

      {/* Progress Steps */}
      <div className="card-glass p-6 mb-6">
        <div className="flex items-center justify-center space-x-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                currentStep >= step.number
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-600 text-dark-300'
              }`}>
                {step.number}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary-400' : 'text-dark-300'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-dark-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
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

      {/* Step Content */}
      <div className="card p-6">
        {/* Step 1: Passengers */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Select Passenger</h3>
            <p className="text-sm text-dark-400">Choose one registered passenger for this sale (only main passengers can be selected)</p>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search passengers by name, phone, or passport number..."
                value={passengerSearch ?? ''}
                onChange={(e) => setPassengerSearch(e.target.value)}
                className="input-field w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selected Passenger */}
            {selectedPassengers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium text-dark-100">Selected Passenger</h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedPassengers.map((passenger) => (
                    <div key={passenger._id} className="bg-dark-700/50 border border-white/10 rounded-lg p-4 relative">
                      <button
                        onClick={() => removeSelectedPassenger(passenger._id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                      <h5 className="font-medium mb-2 text-dark-100">{passenger.name} {passenger.surname}</h5>
                      <div className="text-sm space-y-2 text-dark-300">
                        {passenger.phone && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{passenger.phone}</span>
                          </div>
                        )}
                        {passenger.passportNumber && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span>{passenger.passportNumber}</span>
                          </div>
                        )}
                        {passenger.email && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{passenger.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Passengers */}
            <div className="space-y-3 mb-6">
              <h4 className="text-md font-medium text-dark-100">
                Available Passengers {passengerLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
                {selectedPassengers.length > 0 && <span className="text-sm text-dark-400 ml-2">(Select a different passenger to change selection)</span>}
              </h4>
              
              {availablePassengers.length === 0 && !passengerLoading ? (
                <div className="text-center py-8 text-dark-400">
                  <p>No passengers found. Try adjusting your search or register new passengers first.</p>
            </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {availablePassengers
                    .filter(passenger => {
                      // Debug logging and more robust comparison
                      const isSelected = selectedPassengers.find(selected => {
                        // Try multiple comparison methods
                        const directMatch = selected._id === passenger._id;
                        const nameMatch = selected.name === passenger.name && 
                                        selected.surname === passenger.surname;
                        const passportMatch = selected.passportNumber && 
                                            passenger.passportNumber && 
                                            selected.passportNumber === passenger.passportNumber;
                        
                        const match = directMatch || (nameMatch && passportMatch);
                        
                        console.log('Comparing passengers:', {
                          selected: {
                            _id: selected._id,
                            name: `${selected.name} ${selected.surname}`,
                            passport: selected.passportNumber
                          },
                          available: {
                            _id: passenger._id,
                            name: `${passenger.name} ${passenger.surname}`,
                            passport: passenger.passportNumber
                          },
                          directMatch,
                          nameMatch,
                          passportMatch,
                          finalMatch: match
                        });
                        return match;
                      });
                      return !isSelected;
                    })
                    .map((passenger) => {
                      const isDisabled = selectedPassengers.length > 0;
                      return (
                        <div
                          key={passenger._id}
                          onClick={() => !isDisabled && togglePassengerSelection(passenger)}
                          className={`rounded-lg p-4 transition-colors ${
                            isDisabled 
                              ? 'bg-dark-800/30 border border-white/5 cursor-not-allowed opacity-50' 
                              : 'bg-dark-700/50 border border-white/10 cursor-pointer hover:bg-dark-600/50 hover:border-primary-500/30'
                          }`}
                        >
                          <h5 className={`font-medium mb-2 ${isDisabled ? 'text-dark-500' : 'text-dark-100'}`}>
                            {passenger.name} {passenger.surname}
                          </h5>
                          <div className={`text-sm space-y-2 ${isDisabled ? 'text-dark-600' : 'text-dark-300'}`}>
                            {passenger.phone && (
                              <div className="flex items-center space-x-2">
                                <svg className={`w-4 h-4 ${isDisabled ? 'text-dark-500' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{passenger.phone}</span>
                              </div>
                            )}
                            {passenger.passportNumber && (
                              <div className="flex items-center space-x-2">
                                <svg className={`w-4 h-4 ${isDisabled ? 'text-dark-500' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <span>{passenger.passportNumber}</span>
                              </div>
                            )}
                            {passenger.email && (
                              <div className="flex items-center space-x-2">
                                <svg className={`w-4 h-4 ${isDisabled ? 'text-dark-500' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{passenger.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Companions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Select Acompañantes</h3>
            <p className="text-sm text-dark-400">Choose acompañantes for {selectedPassengers[0]?.name} {selectedPassengers[0]?.surname}</p>
            
            {/* Selected Companions */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-dark-100">
                Selected Acompañantes ({selectedCompanions.length}) 
                {selectedCompanions.length === 0 && <span className="text-sm text-dark-400"> - No acompañantes selected</span>}
              </h4>
              {selectedCompanions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCompanions.map((companion) => (
                    <div key={companion._id} className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-dark-100">{companion.name} {companion.surname}</h5>
                          <div className="text-sm text-dark-300 space-y-2">
                            {companion.phone && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{companion.phone}</span>
                              </div>
                            )}
                            {companion.passportNumber && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <span>{companion.passportNumber}</span>
                              </div>
                            )}
                            <p className="text-xs text-primary-400">
                              {companion.type === 'companion' ? 'Companion' : 'Main Client'}
                            </p>
              </div>
                        </div>
                        <button
                          onClick={() => removeSelectedCompanion(companion._id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                    <input
                      type="text"
                placeholder="Search acompañantes by name, phone, or passport number..."
                value={companionSearch ?? ''}
                onChange={(e) => setCompanionSearch(e.target.value)}
                className="input-field w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
                        </div>
                  
            {/* Available for Selection */}
            <div className="space-y-3 mb-6">
              <h4 className="text-md font-medium text-dark-100">
                Available for Selection {companionLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
              </h4>
              
              {allForSelection.length === 0 && !companionLoading ? (
                <div className="text-center py-8 text-dark-400">
                  <p>No acompañantes found. Try adjusting your search or register new acompañantes first.</p>
              </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {allForSelection
                    .filter(person => 
                      !selectedCompanions.find(selected => selected._id === person._id) &&
                      !selectedPassengers.find(selected => selected._id === person._id)
                    )
                    .map((person) => (
                    <div
                      key={person._id}
                      onClick={() => toggleCompanionSelection(person)}
                      className="bg-dark-700/50 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-dark-600/50 hover:border-primary-500/30 transition-colors"
                    >
                      <h5 className="font-medium text-dark-100 mb-2">{person.name} {person.surname}</h5>
                      <div className="text-sm text-dark-300 space-y-2">
                        {person.phone && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.passportNumber && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span>{person.passportNumber}</span>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{person.email}</span>
                          </div>
                        )}
                        <p className="text-xs text-primary-400">
                          {person.type === 'companion' ? 'Companion' : 'Main Client'}
                        </p>
                          </div>
                            </div>
            ))}
                </div>
              )}
            </div>
                      </div>
        )}

        {/* Step 3: Sale Price */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Set Sale Price</h3>
            <p className="text-sm text-dark-400">Define the pricing model and currency for this sale</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Sale Currency *
                </label>
                <select
                  value={saleCurrency ?? 'USD'}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  className="input-field"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="ARS">ARS - Argentine Peso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Price per Passenger *
                </label>
                <input
                  type="number"
                  value={salePrice ?? ''}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Total Passengers
                </label>
                <div className="input-field bg-gray-100 text-gray-700">
                  {selectedPassengers.length + selectedCompanions.length} passenger{selectedPassengers.length + selectedCompanions.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Currency Conversion Display */}
            {salePrice && (
              <div className="mb-8">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  {saleCurrency !== 'USD' && convertedAmount ? (
                    <>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-blue-200">
                      <strong>USD Equivalent:</strong> ${convertedAmount.toFixed(2)} per passenger
                    </div>
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    Total for {selectedPassengers.length + selectedCompanions.length} passengers: ${(convertedAmount * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)}
                  </div>
                    </>
                  ) : (
                    <div className="text-sm text-blue-200">
                      <strong>Total Price:</strong> {saleCurrency} {(parseFloat(salePrice) * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)} for {selectedPassengers.length + selectedCompanions.length} passenger{selectedPassengers.length + selectedCompanions.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-dark-100">Service Settings</h4>
                <button
                  onClick={openAddServiceModal}
                  className="btn-secondary"
                >
                  Add Service
                </button>
              </div>

              {/* Selected Services */}
              <div className="space-y-3">
                <h5 className="text-md font-medium text-dark-100">
                  Selected Services ({selectedServices.length})
                </h5>
                
                {/* Search Bar for Selected Services */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search selected services..."
                    value={selectedServicesSearch ?? ''}
                    onChange={(e) => setSelectedServicesSearch(e.target.value)}
                    className="input-field w-full pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Selected Services Cards */}
                {selectedServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedServices
                      .filter(service => {
                        const serviceName = service.name || service.serviceName || service.destino || '';
                        return serviceName.toLowerCase().includes(selectedServicesSearch.toLowerCase());
                      })
                      .map((service) => (
                        <div key={service._id} className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="font-medium text-dark-100 mb-2">
                                {service.name || service.serviceName || service.destino || 'Unknown Service'}
                              </h6>
                              {service.description && (
                                <p className="text-sm text-dark-300 line-clamp-2">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-3">
                              <button
                                onClick={() => editService(service)}
                                className="text-blue-400 hover:text-blue-300 p-1"
                                title="Edit service"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeSelectedService(service._id)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Remove service"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-dark-400">
                    <p>No services selected yet</p>
                  </div>
                )}

                {/* No search results message */}
                {selectedServices.length > 0 && selectedServices.filter(service => {
                  const serviceName = service.name || service.serviceName || service.destino || '';
                  return serviceName.toLowerCase().includes(selectedServicesSearch.toLowerCase());
                }).length === 0 && (
                  <div className="text-center py-4 text-dark-400">
                    <p>No services match your search</p>
                  </div>
                )}
              </div>

              {/* Available Services */}
              {availableServices.filter(service => !selectedServices.find(selected => selected._id === service._id)).length > 0 && (
                <div className="space-y-3 mb-6">
                  <h5 className="text-md font-medium text-dark-100">
                    Available Services {serviceLoading && <span className="text-sm text-dark-400">(Loading...)</span>}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableServices
                      .filter(service => !selectedServices.find(selected => selected._id === service._id))
                      .map((service) => (
                        <div
                          key={service._id}
                          onClick={() => toggleServiceSelection(service)}
                          className="p-4 border rounded-lg cursor-pointer transition-colors bg-dark-700/50 border-white/10 hover:bg-dark-600/50 hover:border-primary-500/30"
                        >
                          <h6 className="font-medium text-dark-100 mb-2">
                            {service.destino || service.name || service.serviceName || 'Unknown Service'}
                          </h6>
                          {service.description && (
                            <p className="text-sm text-dark-300 line-clamp-2">{service.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!serviceLoading && availableServices.length === 0 && (
                <div className="text-center py-8 text-dark-400">
                  <p>No services added yet. Click "Add Service" to create your first service.</p>
                </div>
              )}

              {serviceLoading && (
                <div className="text-center py-8 text-dark-400">
                  <p>Loading services...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Destination */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-dark-100">Enter Destination</h3>
            <p className="text-sm text-dark-400">Specify the travel destination and select providers for this sale</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Destination Name *
                                </label>
                                <input
                  type="text"
                  value={destination.name ?? ''}
                  onChange={(e) => {
                    setDestination({ ...destination, name: e.target.value });
                    searchDestinations(e.target.value);
                  }}
                  className="input-field"
                  placeholder="e.g., Cancun"
                  required
                />
                
                {/* Destination Suggestions */}
                {destinationSuggestions.length > 0 && (
                  <div className="mt-2 border border-white/20 rounded-lg bg-dark-800">
                    {destinationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setDestination({
                            name: suggestion.name,
                            country: suggestion.country,
                            city: suggestion.city || ''
                          });
                          setDestinationSuggestions([]);
                        }}
                        className="p-3 hover:bg-dark-700 cursor-pointer border-b border-white/10 last:border-b-0"
                      >
                        <div className="font-medium text-dark-100">{suggestion.name}</div>
                        <div className="text-sm text-dark-300">
                          {suggestion.city && `${suggestion.city}, `}{suggestion.country}
                              </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
                              <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Country *
                                </label>
                                <input
                  type="text"
                  value={destination.country ?? ''}
                  onChange={(e) => setDestination({ ...destination, country: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Mexico"
                  required
                />
                            </div>

              <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-dark-200 mb-2">
                  City (Optional)
                              </label>
                                  <input
                  type="text"
                  value={destination.city ?? ''}
                  onChange={(e) => setDestination({ ...destination, city: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Cancun"
                />
                                </div>
                                    </div>

            
            {/* Selected Providers */}
            {selectedProviders.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-md font-medium text-dark-100">
                  Selected Providers ({selectedProviders.length})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedProviders.map((provider) => {
                    const isExpanded = expandedProviders.has(provider._id);
                    const formData = getProviderFormData(provider._id);
                    
                return (
                      <div key={provider._id} className="bg-primary-500/10 border border-primary-500/30 rounded-lg overflow-hidden">
                        {/* Provider Header - Always Visible */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-primary-500/5 transition-colors"
                          onClick={() => toggleProviderExpansion(provider._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                              <h5 className="font-medium text-dark-100">{provider.name}</h5>
                              <div className="text-sm text-dark-300 space-y-2">
                                {provider.phone && (
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{provider.phone}</span>
                                  </div>
                                )}
                                {provider.email && (
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{provider.email}</span>
                                  </div>
                                )}
                                {provider.type && (
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                                    <span>{provider.type}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* View Files Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFileModal(provider._id);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-1"
                                title="View uploaded files"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {/* Expand/Collapse Icon */}
                              <svg 
                                className={`w-5 h-5 text-primary-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {/* Remove Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedProvider(provider._id);
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                      </div>
                  </div>
            </div>
            
                        {/* Expandable Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-primary-500/20 bg-dark-800/30">
                            <div className="pt-4 space-y-4">
                              {/* Cost and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Cost *
                    </label>
                        <input
                          type="number"
                                    value={formData.cost ?? ''}
                                    onChange={(e) => updateProviderFormData(provider._id, 'cost', e.target.value)}
                      className="input-field"
                      placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Currency
                    </label>
                    <select
                                    value={formData.currency ?? 'USD'}
                                    onChange={(e) => updateProviderFormData(provider._id, 'currency', e.target.value)}
                      className="input-field"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                                    <option value="EUR">EUR</option>
                    </select>
                                </div>
                  </div>
                  
                              {/* USD Equivalent Display */}
                              {formData.cost && formData.currency && (
                                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-dark-100">USD Equivalent</p>
                                      <p className="text-xs text-dark-300">
                                        {formData.currency} {formData.cost} → USD ${convertProviderAmountToUSD(provider._id, formData.cost, formData.currency)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-primary-400">
                                        ${convertProviderAmountToUSD(provider._id, formData.cost, formData.currency)}
                                      </p>
                                      <p className="text-xs text-dark-400">Final Amount</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Start and End Dates */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Start Date
                    </label>
                        <input
                      type="date"
                                    value={formData.startDate ?? ''}
                                    onChange={(e) => updateProviderFormData(provider._id, 'startDate', e.target.value)}
                      className="input-field"
                        />
                      </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                                    End Date
                    </label>
                    <input
                      type="date"
                                    value={formData.endDate ?? ''}
                                    onChange={(e) => updateProviderFormData(provider._id, 'endDate', e.target.value)}
                                    min={formData.startDate ?? ''}
                      className="input-field"
                    />
                                  {formData.startDate && (
                                    <p className="text-xs text-dark-400 mt-1">
                                      Must be on or after {formData.startDate}
                                    </p>
                                  )}
                    </div>
                  </div>
                
                              {/* Receipt Upload */}
                              <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                                  Receipt Upload
                  </label>
                                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary-500/50 transition-colors">
                  <input
                    type="file"
                                    id={`receipt-${provider._id}`}
                                    accept="image/*,.pdf"
                                    multiple
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleProviderFileUpload(provider._id, files);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label 
                                    htmlFor={`receipt-${provider._id}`}
                                    className="cursor-pointer flex flex-col items-center space-y-2"
                                  >
                                    <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-sm text-dark-300">
                                      {formData.receipts && formData.receipts.length > 0 
                                        ? `${formData.receipts.length} file(s) uploaded` 
                                        : 'Click to upload receipts'}
                                    </span>
                                    <span className="text-xs text-dark-400">PNG, JPG, PDF up to 10MB each</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Provider Search and Selection */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-dark-100">Select Providers</h4>
                <button
                  onClick={() => setShowProviderModal(true)}
                  className="btn-secondary"
                >
                  Add New Provider
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search providers by name, phone, or email..."
                  value={providerSearch ?? ''}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="input-field w-full pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Available Providers */}
              {availableProviders.filter(provider => 
                !selectedProviders.find(selected => selected._id === provider._id)
              ).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {availableProviders
                    .filter(provider => 
                      !selectedProviders.find(selected => selected._id === provider._id)
                    )
                    .map((provider) => (
                      <div
                        key={provider._id}
                        onClick={() => toggleProviderSelection(provider)}
                        className="p-4 border rounded-lg cursor-pointer transition-colors bg-dark-700/50 border-white/10 hover:bg-dark-600/50 hover:border-primary-500/30"
                      >
                        <h5 className="font-medium text-dark-100 mb-2">{provider.name}</h5>
                        <div className="text-sm text-dark-300 space-y-2">
                          {provider.phone && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{provider.phone}</span>
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{provider.email}</span>
                            </div>
                          )}
                          {provider.type && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{provider.type}</span>
                            </div>
                          )}
            </div>
                        </div>
            ))}
                          </div>
                        )}

              {providerLoading && (
                <div className="text-center py-4">
                  <div className="text-dark-400">Loading providers...</div>
                </div>
              )}

              {!providerLoading && availableProviders.filter(provider => 
                !selectedProviders.find(selected => selected._id === provider._id)
              ).length === 0 && (
                <div className="text-center py-4">
                  <div className="text-dark-400">No providers found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Create */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-dark-100 mb-2">Review & Create Sale</h3>
              <p className="text-dark-400">Please review all information before finalizing your sale</p>
            </div>
            
            {/* Comprehensive Sale Summary */}
          <div className="space-y-6">
              {/* Step 1: Passengers & Companions */}
              <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h4 className="text-xl font-semibold text-blue-100">Passengers & Acompañantes</h4>
                  </div>
                  <button
                    onClick={() => setShowPassengerDetails(!showPassengerDetails)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-200 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 rounded-md transition-colors"
                  >
                    <span>{showPassengerDetails ? 'Hide' : 'Show'}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${showPassengerDetails ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Summary when collapsed */}
                {!showPassengerDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-medium text-blue-200">Main Passengers ({selectedPassengers.length})</h5>
                    </div>
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-medium text-blue-200">Acompañantes ({selectedCompanions.length})</h5>
                    </div>
                  </div>
                )}

                {/* Detailed view when expanded */}
                {showPassengerDetails && (
                  <div className="space-y-6">
                    {/* Main Passengers */}
                    <div className="space-y-3">
                      <h5 className="text-lg font-medium text-blue-200 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Main Passengers ({selectedPassengers.length})</span>
                      </h5>
                      {selectedPassengers.length > 0 ? (
                        <div className="space-y-3">
                {selectedPassengers.map((passenger, index) => (
                            <div key={index} className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h6 className="font-medium text-dark-100">{passenger.name} {passenger.surname}</h6>
                                  <div className="text-sm text-dark-300 space-y-1 mt-2">
                                    {passenger.phone && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{passenger.phone}</span>
                                      </div>
                                    )}
                                    {passenger.email && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>{passenger.email}</span>
                                      </div>
                                    )}
                                    {passenger.passportNumber && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                        <span>{passenger.passportNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Main Passenger
                                  </span>
                                </div>
                              </div>
                  </div>
                ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-dark-400">
                          <p>No main passengers selected</p>
                        </div>
                      )}
                    </div>

                    {/* Companions */}
                    <div className="space-y-3">
                      <h5 className="text-lg font-medium text-blue-200 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Acompañantes ({selectedCompanions.length})</span>
                      </h5>
                      {selectedCompanions.length > 0 ? (
                        <div className="space-y-3">
                {selectedCompanions.map((companion, index) => (
                            <div key={index} className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h6 className="font-medium text-dark-100">{companion.name} {companion.surname}</h6>
                                  <div className="text-sm text-dark-300 space-y-1 mt-2">
                                    {companion.phone && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>{companion.phone}</span>
                                      </div>
                                    )}
                                    {companion.email && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>{companion.email}</span>
                                      </div>
                                    )}
                                    {companion.passportNumber && (
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                        <span>{companion.passportNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Acompañante
                                  </span>
                                </div>
                              </div>
                  </div>
                ))}
                      </div>
                      ) : (
                        <div className="text-center py-4 text-dark-400">
                          <p>No acompañantes selected</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Count Summary */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-blue-200">Total Travelers:</span>
                    <span className="text-2xl font-bold text-blue-100">{selectedPassengers.length + selectedCompanions.length}</span>
                  </div>
                        </div>
                        </div>
              
              {/* Step 2: Pricing Information */}
              <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h4 className="text-xl font-semibold text-green-100">Pricing Information</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                    <h5 className="text-lg font-medium text-green-200 mb-2">Currency & Rate</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-300">Sale Currency:</span>
                        <span className="font-medium text-dark-100">{saleCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-300">Price per Passenger:</span>
                        <span className="font-medium text-dark-100">{saleCurrency} {salePrice || '0.00'}</span>
                        </div>
                {convertedAmount && (
                        <div className="flex justify-between">
                          <span className="text-dark-300">USD Equivalent:</span>
                          <span className="font-medium text-primary-400">${convertedAmount.toFixed(2)}</span>
                      </div>
                )}
                    </div>
            </div>

                  <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                    <h5 className="text-lg font-medium text-green-200 mb-2">Total Calculation</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-300">Passengers:</span>
                        <span className="font-medium text-dark-100">{selectedPassengers.length + selectedCompanions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-300">Price per Person:</span>
                        <span className="font-medium text-dark-100">{saleCurrency} {salePrice || '0.00'}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-green-200">Total Sale Price:</span>
                          <span className="text-green-100">{saleCurrency} {((parseFloat(salePrice) || 0) * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)}</span>
                        </div>
                        {convertedAmount && (
                          <div className="flex justify-between text-sm text-primary-400">
                            <span>USD Total:</span>
                            <span>${(convertedAmount * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Destination & Travel Details */}
              <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                        </div>
                  <h4 className="text-xl font-semibold text-purple-100">Destination & Travel Details</h4>
                    </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                    <h5 className="text-lg font-medium text-purple-200 mb-3 flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Destination</span>
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-300">Location:</span>
                        <span className="font-medium text-dark-100">{destination.name || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-300">Country:</span>
                        <span className="font-medium text-dark-100">{destination.country || 'Not specified'}</span>
                      </div>
                      {destination.city && (
                        <div className="flex justify-between">
                          <span className="text-dark-300">City:</span>
                          <span className="font-medium text-dark-100">{destination.city}</span>
                        </div>
                  )}
                </div>
              </div>

                </div>
              </div>

              {/* Step 4: Providers & Services */}
              <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <h4 className="text-xl font-semibold text-orange-100">Providers & Services</h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Selected Providers */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-orange-200 flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Selected Providers ({selectedProviders.length})</span>
                    </h5>
                    
                  {selectedProviders.length > 0 ? (
                      <div className="space-y-3">
                      {selectedProviders.map((provider, index) => {
                        const formData = getProviderFormData(provider._id);
                        const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
                        
                        return (
                            <div key={index} className="bg-dark-700/50 border border-white/10 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium text-dark-100">{provider.name}</h6>
                            <div className="flex items-center space-x-2">
                                  {/* View Files Button */}
                                  <button
                                    onClick={() => openFileModal(provider._id)}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                    title="View uploaded files"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  {provider.type && (
                                    <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-1 rounded">
                                      {provider.type}
                                    </span>
                                  )}
                            </div>
                              </div>
                              
                              <div className="text-sm text-dark-300 space-y-1">
                                {provider.phone && (
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{provider.phone}</span>
                                  </div>
                                )}
                                {provider.email && (
                                  <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{provider.email}</span>
                                  </div>
                                )}
                              </div>
                              
                            {formData.cost && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-dark-300">Cost:</span>
                              <div className="text-right">
                                      <div className="text-sm font-medium text-dark-100">
                                  {formData.currency} {formData.cost}
                                </div>
                                      <div className="text-xs text-primary-400">
                                  USD ${usdAmount}
                                      </div>
                                    </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                        
                      {/* Total Provider Costs */}
                      {selectedProviders.some(provider => {
                        const formData = getProviderFormData(provider._id);
                        return formData.cost;
                      }) && (
                          <div className="bg-dark-800/50 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between font-bold text-lg">
                              <span className="text-orange-200">Total Provider Costs:</span>
                              <span className="text-orange-100">
                              USD ${selectedProviders.reduce((total, provider) => {
                                const formData = getProviderFormData(provider._id);
                                const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
                                return total + parseFloat(usdAmount);
                              }, 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                      <div className="text-center py-4 text-dark-400">
                        <p>No providers selected</p>
                      </div>
                  )}
              </div>

                  {/* Selected Services */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-orange-200 flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Selected Services ({selectedServices.length})</span>
                    </h5>
                    
                    {selectedServices.length > 0 ? (
                      <div className="space-y-2">
                        {selectedServices.map((service, index) => (
                          <div key={index} className="bg-dark-700/50 border border-white/10 rounded-lg p-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                <span className="text-dark-100 font-medium">
                                  {service.name || service.serviceName || service.destino || 'Unknown Service'}
                                </span>
                              </div>
                              {service.description && (
                                <p className="text-sm text-dark-300 ml-4">{service.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-dark-400">
                        <p>No services selected</p>
                      </div>
                    )}
                  </div>
              </div>
            </div>

              {/* Final Summary */}
              <div className="bg-gradient-to-r from-gray-900/20 to-gray-800/20 border border-gray-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-100">Final Summary</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-100">{selectedPassengers.length + selectedCompanions.length}</div>
                    <div className="text-sm text-gray-300">Total Travelers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-100">
                      USD ${convertedAmount ? (convertedAmount * (selectedPassengers.length + selectedCompanions.length)).toFixed(2) : ((parseFloat(salePrice) || 0) * (selectedPassengers.length + selectedCompanions.length)).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-300">Total Sale Price (USD)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-100">{selectedProviders.length}</div>
                    <div className="text-sm text-gray-300">Providers Selected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {saleSummary && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-green-400">
                Sale created successfully! Sale ID: {currentSaleId}
              </p>
            </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || (isEditMode && currentStep === 3)}
            className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < 5 && (
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              Next
            </button>
          )}
          
          {currentStep === 5 && (
            <button
              onClick={isEditMode ? handleUpdateSale : handleSellCompleted}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{isEditMode ? 'Update Sale' : 'Sell Completed'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddServiceModal(false)}
        >
          <div 
            className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-white/10 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-dark-100">Add Service</h3>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="text-dark-400 hover:text-dark-300 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={serviceName ?? ''}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter service name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Service Information
                  </label>
                  <textarea
                    value={serviceInformation ?? ''}
                    onChange={(e) => setServiceInformation(e.target.value)}
                    className="input-field w-full h-24 resize-none"
                    placeholder="Enter information about the service (e.g., Hotel accommodation, Airport transfers, City tours, etc.)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddServiceModal(false)}
                    className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addService}
                    disabled={!serviceName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditServiceModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={cancelEdit}
        >
          <div 
            className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-white/10 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-dark-100">Edit Service</h3>
                <button
                  onClick={cancelEdit}
                  className="text-dark-400 hover:text-dark-300 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={serviceName ?? ''}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter service name"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Service Information
                  </label>
                  <textarea
                    value={serviceInformation ?? ''}
                    onChange={(e) => setServiceInformation(e.target.value)}
                    className="input-field w-full h-24 resize-none"
                    placeholder="Enter information about the service (e.g., Hotel accommodation, Airport transfers, City tours, etc.)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateService}
                    disabled={!serviceName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Service
                  </button>
                </div>
              </div>
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

      {/* File View Modal */}
      {showFileModal && selectedProviderFiles && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeFileModal}
        >
          <div 
            className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] border border-white/10 transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-dark-100">Uploaded Files</h3>
                <button
                  onClick={closeFileModal}
                  className="text-dark-400 hover:text-dark-300 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedProviderFiles.files.length > 0 ? (
                  selectedProviderFiles.files.map((file, index) => (
                    <div 
                      key={index}
                      onClick={() => openFile(file)}
                      className="flex items-center justify-between p-4 bg-dark-700/50 border border-white/10 rounded-lg cursor-pointer hover:bg-dark-600/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                          {file.type && file.type.startsWith('image/') ? (
                            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-dark-100">{file.name}</h4>
                          <p className="text-sm text-dark-400">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-sm text-dark-400">Click to open</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleWizard;