import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../utils/api';
import NewSaleWizardSteps from '../components/NewSaleWizardSteps';
import ProviderCreationModal from '../components/ProviderCreationModal';
import AddServiceTemplateModal from '../components/AddServiceTemplateModal';
import AddServiceTypeModal from '../components/AddServiceTypeModal';
import ServiceTypeService from '../services/serviceTypeService';

const SaleWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Cupo context support
  const [cupoContext, setCupoContext] = useState(null);
  const [isCupoReservation, setIsCupoReservation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [clientId, setClientId] = useState(null);
  
  // Service Template Modal state
  const [showAddServiceTemplateModal, setShowAddServiceTemplateModal] = useState(false);
  
  // Service Type Modal state
  const [showAddServiceTypeModal, setShowAddServiceTypeModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  
  // Service Template Search state
  const [serviceTemplateSearch, setServiceTemplateSearch] = useState('');
  
  // Template Editing state
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Price per Passenger state
  const [pricePerPassenger, setPricePerPassenger] = useState('');
  const [passengerCurrency, setPassengerCurrency] = useState('USD');
  const [passengerExchangeRate, setPassengerExchangeRate] = useState('');
  const [passengerConvertedAmount, setPassengerConvertedAmount] = useState(null);

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
  const [companionsFetched, setCompanionsFetched] = useState(false);

  // Step 3: Sale Price
  const [salePrice, setSalePrice] = useState('');
  const [saleCurrency, setSaleCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [pricingModel, setPricingModel] = useState('unit');
  const [saleNotes, setSaleNotes] = useState('');

  // Step 4: Destination
  const [destination, setDestination] = useState({ country: '', city: '' });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  
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

  // Service Template Settings
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [availableServiceTemplates, setAvailableServiceTemplates] = useState([]);
  const [serviceTemplateInstances, setServiceTemplateInstances] = useState([]);
  
  // Debug service instances changes
  useEffect(() => {
    console.log('🔄 serviceTemplateInstances state changed:', serviceTemplateInstances.map(s => ({
      name: s.serviceInfo || s.templateName,
      providers: s.providers?.length || 0,
      providerNames: s.providers?.map(p => p.name) || []
    })));
    
    // Check if any service lost providers
    serviceTemplateInstances.forEach(s => {
      if (s.providers && s.providers.length === 0 && (s.serviceInfo || s.templateName) === 'Service2') {
        console.error('🚨 Service2 providers disappeared!', {
          service: s.serviceInfo || s.templateName,
          providers: s.providers,
          fullService: s
        });
      }
    });
  }, [serviceTemplateInstances]);
  const [currentServiceInstance, setCurrentServiceInstance] = useState(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceInformation, setServiceInformation] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false); // Start with false to avoid blocking template selection
  
  // Current Service Instance Data
  const [currentServiceTemplate, setCurrentServiceTemplate] = useState(null);
  const [currentServiceInfo, setCurrentServiceInfo] = useState('');
  const [currentServiceDates, setCurrentServiceDates] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [currentServiceCost, setCurrentServiceCost] = useState('');
  const [currentServiceCurrency, setCurrentServiceCurrency] = useState('USD');
  const [currentServiceExchangeRate, setCurrentServiceExchangeRate] = useState('');
  const [currentServiceProvider, setCurrentServiceProvider] = useState(null); // Keep for backward compatibility
  const [currentServiceProviders, setCurrentServiceProviders] = useState([]); // New: Multiple providers
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedProviderFiles, setSelectedProviderFiles] = useState(null);

  const steps = [
    { number: 1, title: 'Select Passengers & Companions', description: 'Choose passengers and companions' },
    { number: 2, title: 'Price Per Passenger', description: 'Set passenger pricing' },
    { number: 3, title: 'Select Service Template', description: 'Choose service type' },
    { number: 4, title: 'Service Dates', description: 'Set dates' },
    { number: 5, title: 'Service Cost & Provider', description: 'Set cost and select provider' },
    { number: 6, title: 'Edit Services', description: 'Edit and manage services' },
    { number: 7, title: 'Review & Create', description: 'Review and finalize' }
  ];

  useEffect(() => {
    // Check for pre-selected passenger from location state (only if no clientId in URL)
    const urlParams = new URLSearchParams(location.search);
    const clientIdParam = urlParams.get('clientId');
    
    if (location.state?.preSelectedPassenger && !isEditMode && !clientIdParam) {
      console.log('🎯 Pre-selected passenger found:', location.state.preSelectedPassenger);
      console.log('🔍 Pre-selected passenger DNI:', location.state.preSelectedPassenger.dni);
      console.log('🔍 Pre-selected passenger fields:', Object.keys(location.state.preSelectedPassenger));
      
      // Check if pre-selected passenger has complete data (including DNI)
      if (!location.state.preSelectedPassenger.dni) {
        console.log('⚠️ Pre-selected passenger missing DNI, will fetch complete data when available passengers load');
        // Set incomplete data for now, will be completed when available passengers load
        setSelectedPassengers([location.state.preSelectedPassenger]);
        setClientId(location.state.preSelectedPassenger._id);
      } else {
        console.log('✅ Pre-selected passenger has complete data');
        setSelectedPassengers([location.state.preSelectedPassenger]);
        setClientId(location.state.preSelectedPassenger._id);
      }
    }
  }, [location.state, location.search, isEditMode]);

  useEffect(() => {
    // Check for cupo context from location state or URL params
    const initializeCupoContext = async () => {
      if (location.state?.cupo) {
        // Cupo data passed via state (from inventory dashboard)
        setCupoContext(location.state.cupo);
        setIsCupoReservation(true);
        // Don't pre-populate yet - wait for service templates to load
      } else {
        // Check if cupoId or clientId is passed via URL parameters
        const urlParams = new URLSearchParams(location.search);
        const cupoId = urlParams.get('cupoId');
        const clientIdParam = urlParams.get('clientId');
        
        if (cupoId) {
          try {
            // Fetch cupo data using the cupoId
            const response = await api.get(`/api/cupos/${cupoId}`);
            if (response.data.success) {
              setCupoContext(response.data.data.cupo);
              setIsCupoReservation(true);
              // Don't pre-populate yet - wait for service templates to load
            } else {
              setError('Failed to load cupo data');
              navigate('/inventory');
            }
          } catch (error) {
            setError('Failed to load cupo data');
            navigate('/inventory');
          }
        } else if (clientIdParam) {
          try {
            // Fetch client data using the clientId
            console.log('🔍 Fetching client data for clientId:', clientIdParam);
            const response = await api.get(`/api/clients/${clientIdParam}`);
            if (response.data.success) {
              const clientData = response.data.data.client;
              console.log('🔍 Fetched client data:', clientData);
              console.log('🔍 Client DNI:', clientData.dni);
              
              // Set the client as pre-selected passenger with complete data
              setSelectedPassengers([clientData]);
              setClientId(clientData._id);
              console.log('✅ Set pre-selected passenger with complete data');
            } else {
              setError('Failed to load client data');
            }
          } catch (error) {
            console.error('Failed to fetch client data:', error);
            setError('Failed to load client data');
          }
        }
      }
    };

    initializeCupoContext();
  }, [location.state, location.search, navigate]);

  useEffect(() => {
    // Reset state when component mounts for a new sale
    if (!isEditMode) {
      setServiceTemplateInstances([]);
      setCurrentServiceInstance(null);
      setCurrentServiceTemplate(null);
      setCurrentServiceInfo('');
      setCurrentServiceDates({ checkIn: '', checkOut: '' });
      setCurrentServiceCost('');
      setCurrentServiceCurrency('USD');
      setCurrentServiceExchangeRate('');
      setCurrentServiceProvider(null);
      setSelectedCompanions([]);
      setCompanionsFetched(false);
    }
    
    fetchPassengers();
    fetchProviders();
    fetchServices();
    fetchServiceTemplates();
    
    // Set up periodic refresh for real-time synchronization
    // Only refresh if user is not actively working on services
    const interval = setInterval(() => {
      // Only refresh if no services are selected and not in edit mode
      if (serviceTemplateInstances.length === 0 && !isEditMode) {
        fetchServiceTemplates();
        fetchProviders();
      }
    }, 30000); // Refresh every 30 seconds
    
    // If in edit mode, fetch the existing sale data
    if (isEditMode && id) {
      fetchExistingSale();
    }
    
    return () => clearInterval(interval);
  }, [isEditMode]);

  // Fetch passengers when search changes (skip in edit mode starting at step 3)
  useEffect(() => {
    if ((passengerSearch.length >= 2 || passengerSearch.length === 0) && !(isEditMode && currentStep >= 3) && !loading) {
      fetchPassengers();
    }
  }, [passengerSearch, isEditMode, currentStep, loading]);

  // Fetch companions when a passenger is selected (skip in edit mode starting at step 3)
  useEffect(() => {
    if (selectedPassengers.length > 0 && !(isEditMode && currentStep >= 3) && !loading) {
      // Only fetch companions if we haven't already fetched them for this passenger
      // This prevents overriding manual selections
      if (!companionsFetched) {
        fetchCompanions();
        setCompanionsFetched(true);
      }
      fetchAllForSelection();
    }
  }, [selectedPassengers, isEditMode, currentStep, loading]);

  // Fetch all for selection when search changes (skip in edit mode starting at step 3)
  useEffect(() => {
    if ((companionSearch.length >= 2 || companionSearch.length === 0) && !(isEditMode && currentStep >= 3) && !loading) {
      fetchAllForSelection();
    }
  }, [companionSearch, isEditMode, currentStep, loading]);

  // Ensure service templates are loaded when reaching step 3 (Select Service Template)
  useEffect(() => {
    if (currentStep === 3 && !isEditMode) {
      console.log('🔄 User reached step 3, refreshing service templates...');
      // Fetch service templates immediately without delay
      fetchServiceTemplates();
    }
  }, [currentStep, isEditMode]);

  // Fetch service types when editing a template
  useEffect(() => {
    if (editingTemplate) {
      fetchServiceTypes();
    }
  }, [editingTemplate]);

  // Reset companions fetched flag when passenger changes
  useEffect(() => {
    setCompanionsFetched(false);
    // Only clear selected companions when NOT in edit mode and when no passengers are selected
    // This prevents clearing companions during step transitions when passengers are already selected
    if (!isEditMode && selectedPassengers.length === 0) {
      setSelectedCompanions([]);
    }
  }, [selectedPassengers, isEditMode]);

  // Update service instance with current form data when user progresses through steps
  // NOTE: This useEffect is designed for single-service workflow and should NOT run
  // when we're using the multi-service workflow (addProviderToService)
  // Disabled to prevent overwriting providers managed by addProviderToService
  /*
  useEffect(() => {
    if (serviceTemplateInstances.length > 0 && currentStep >= 5) {
      // Find the most recent service instance (the one being configured)
      const latestInstance = serviceTemplateInstances[serviceTemplateInstances.length - 1];
      
      // Update the instance with current form data
      const updatedInstance = {
        ...latestInstance,
        serviceInfo: currentServiceInfo || latestInstance.serviceInfo,
        checkIn: currentServiceDates.checkIn || latestInstance.checkIn,
        checkOut: currentServiceDates.checkOut || latestInstance.checkOut,
        cost: currentServiceCost ? parseFloat(currentServiceCost) : latestInstance.cost,
        currency: currentServiceCurrency || latestInstance.currency,
        destination: {
          city: destination.city || latestInstance.destination?.city || '',
          country: destination.country || latestInstance.destination?.country || ''
        },
        // Update providers - always use current selection, don't fall back to old data
        providers: currentServiceProviders,
        provider: currentServiceProvider
      };
      
      // Update the service instance in the array
      setServiceTemplateInstances(prev => 
        prev.map((instance, index) => 
          index === prev.length - 1 ? updatedInstance : instance
        )
      );
    }
  }, [currentServiceInfo, currentServiceDates, currentServiceCost, currentServiceCurrency, destination.city, destination.country, currentServiceProviders, currentServiceProvider, currentStep]);
  */


  // Fetch providers when search changes
  useEffect(() => {
    if (providerSearch.length >= 2 || providerSearch.length === 0) {
      fetchProviders();
    }
  }, [providerSearch]);

  // Refetch services when serviceTemplateInstances changes in edit mode to update available services
  // But only if we're not currently editing a service instance to avoid interfering with updates
  useEffect(() => {
    if (isEditMode && !currentServiceInstance) {
      // Only refetch when in edit mode and not currently editing a service instance
      // This ensures available services are refreshed when services are deselected
      // but doesn't interfere with ongoing edits
      fetchServiceTemplates();
    }
  }, [serviceTemplateInstances, isEditMode, currentServiceInstance]);

  // Pre-populate cupo data after service templates are loaded
  // Only pre-populate if we don't have any service instances yet (to avoid overriding user edits)
  useEffect(() => {
    if (isCupoReservation && cupoContext && serviceTemplates.length > 0 && serviceTemplateInstances.length === 0) {
      console.log('🔄 Service templates loaded, now pre-populating cupo data');
      prePopulateCupoData(cupoContext);
    }
  }, [isCupoReservation, cupoContext, serviceTemplates, serviceTemplateInstances.length]);

  // Filter available templates when service instances change
  useEffect(() => {
    if (serviceTemplates.length > 0) {
      // Count how many times each template has been selected
      const templateSelectionCounts = {};
      serviceTemplateInstances.forEach(instance => {
        const templateId = instance.templateId;
        templateSelectionCounts[templateId] = (templateSelectionCounts[templateId] || 0) + 1;
      });
      
      // Show all templates - don't filter them out
      // The UI will handle disabling templates that have reached 7 selections
      console.log('🔍 Setting available templates:');
      console.log('  - Service instances:', serviceTemplateInstances);
      console.log('  - Template selection counts:', templateSelectionCounts);
      console.log('  - All templates:', serviceTemplates.map(t => ({ id: t._id, name: t.name })));
      
      setAvailableServiceTemplates(serviceTemplates);
    }
  }, [serviceTemplateInstances, serviceTemplates]);


  // Currency conversion effects
  useEffect(() => {
    if (saleCurrency === 'USD') {
      setExchangeRate('');
      setConvertedAmount(null);
    }
  }, [saleCurrency]);

  useEffect(() => {
    if (exchangeRate && salePrice && saleCurrency && saleCurrency !== 'USD') {
      setConvertedAmount(parseFloat(salePrice) / parseFloat(exchangeRate));
    } else if (saleCurrency === 'USD') {
      setConvertedAmount(parseFloat(salePrice));
    }
  }, [exchangeRate, salePrice, saleCurrency]);

  // Price per passenger currency conversion effects
  useEffect(() => {
    if (passengerCurrency === 'USD') {
      setPassengerExchangeRate('');
      setPassengerConvertedAmount(null);
    }
  }, [passengerCurrency]);

  useEffect(() => {
    if (passengerExchangeRate && pricePerPassenger && passengerCurrency && passengerCurrency !== 'USD') {
      setPassengerConvertedAmount(parseFloat(pricePerPassenger) / parseFloat(passengerExchangeRate));
    } else if (passengerCurrency === 'USD') {
      setPassengerConvertedAmount(parseFloat(pricePerPassenger));
    }
  }, [passengerExchangeRate, pricePerPassenger, passengerCurrency]);

  // Connect pricePerPassenger to salePrice for sale creation
  useEffect(() => {
    if (pricePerPassenger) {
      setSalePrice(pricePerPassenger);
    }
  }, [pricePerPassenger]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services?limit=100');
      if (response.data.success) {
        let services = response.data.data.services;
        
        // Always filter out services that are already selected
        if (serviceTemplateInstances.length > 0) {
          const selectedServiceIds = serviceTemplateInstances.map(service => 
            service._id || service.serviceId?._id || service.serviceId
          );
          services = services.filter(service => 
            !selectedServiceIds.includes(service._id)
          );
          console.log('Filtered out selected services from available services:', selectedServiceIds);
        }
        
        setAvailableServiceTemplates(services);
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
        // Debug: Check if DNI field is present in fetched data
        if (response.data.data.clients.length > 0) {
          console.log('🔍 First passenger from API:', response.data.data.clients[0]);
          console.log('🔍 First passenger DNI:', response.data.data.clients[0].dni);
          console.log('🔍 First passenger fields:', Object.keys(response.data.data.clients[0]));
        }
        setAvailablePassengers(response.data.data.clients);
        
        // Auto-complete selected passengers with complete data if they're missing DNI
        if (selectedPassengers.length > 0) {
          const updatedPassengers = selectedPassengers.map(selectedPassenger => {
            if (!selectedPassenger.dni) {
              console.log('🔧 Auto-completing selected passenger with complete data:', selectedPassenger._id);
              const completeData = response.data.data.clients.find(p => p._id === selectedPassenger._id);
              if (completeData) {
                console.log('✅ Found complete data for selected passenger:', completeData);
                console.log('✅ Complete passenger DNI:', completeData.dni);
                return completeData;
              } else {
                console.log('❌ Could not find complete data for selected passenger');
                return selectedPassenger;
              }
            }
            return selectedPassenger;
          });
          
          // Only update if we found complete data
          const hasUpdates = updatedPassengers.some((passenger, index) => 
            passenger !== selectedPassengers[index]
          );
          
          if (hasUpdates) {
            console.log('🔄 Updating selected passengers with complete data');
            setSelectedPassengers(updatedPassengers);
          }
        }
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
      console.log('fetchCompanions called for client:', selectedPassengers[0]._id);
      console.log('Current selectedCompanions before fetch:', selectedCompanions);
      
      const response = await api.get(`/api/clients/${selectedPassengers[0]._id}/companions?search=${companionSearch}`);
      if (response.data.success) {
        const companions = response.data.data.companions;
        console.log('Fetched companions from API:', companions);
        // Debug: Check if DNI field is present in companion data
        if (companions.length > 0) {
          console.log('🔍 First companion from API:', companions[0]);
          console.log('🔍 First companion DNI:', companions[0].dni);
          console.log('🔍 First companion fields:', Object.keys(companions[0]));
        }
        setAvailableCompanions(companions);
        
        // Auto-complete selected companions with complete data if they're missing DNI
        if (selectedCompanions.length > 0) {
          const updatedCompanions = selectedCompanions.map(selectedCompanion => {
            if (!selectedCompanion.dni) {
              console.log('🔧 Auto-completing selected companion with complete data:', selectedCompanion._id);
              const completeData = companions.find(c => c._id === selectedCompanion._id);
              if (completeData) {
                console.log('✅ Found complete data for selected companion:', completeData);
                console.log('✅ Complete companion DNI:', completeData.dni);
                return completeData;
              } else {
                console.log('❌ Could not find complete data for selected companion');
                return selectedCompanion;
              }
            }
            return selectedCompanion;
          });
          
          // Only update if we found complete data
          const hasUpdates = updatedCompanions.some((companion, index) => 
            companion !== selectedCompanions[index]
          );
          
          if (hasUpdates) {
            console.log('🔄 Updating selected companions with complete data');
            setSelectedCompanions(updatedCompanions);
          }
        }
        
        // Auto-select companions when passenger is selected
        if (!isEditMode && selectedCompanions.length === 0) {
          console.log('Auto-selecting companions:', companions);
          setSelectedCompanions(companions);
        } else {
          console.log('Not auto-selecting companions. Edit mode:', isEditMode, 'Selected companions count:', selectedCompanions.length);
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


  const searchCities = async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    
    try {
      const response = await api.post('/api/destinations/search-cities', { query, limit: 5 });
      if (response.data.success) {
        setCitySuggestions(response.data.data.cities);
      }
    } catch (error) {
      console.error('Failed to search cities:', error);
    }
  };

  const searchCountries = async (query) => {
    if (query.length < 2) {
      setCountrySuggestions([]);
      return;
    }
    
    try {
      const response = await api.post('/api/destinations/search-countries', { query, limit: 5 });
      if (response.data.success) {
        setCountrySuggestions(response.data.data.countries);
      }
    } catch (error) {
      console.error('Failed to search countries:', error);
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
        
        // Pre-populate passengers - handle all passengers correctly
        if (sale.passengers && sale.passengers.length > 0) {
          // Separate main client from companions based on isMainClient flag
          const mainClientPassenger = sale.passengers.find(p => p.isMainClient);
          const companionPassengers = sale.passengers.filter(p => !p.isMainClient);
          
          // Set main client as selected passenger
          if (mainClientPassenger) {
            const passengerData = mainClientPassenger.passengerId || mainClientPassenger;
            const formattedPassenger = {
              _id: passengerData._id || mainClientPassenger._id || mainClientPassenger.clientId,
              name: passengerData.name || passengerData.firstName || '',
              surname: passengerData.surname || passengerData.lastName || '',
              phone: passengerData.phone || '',
              passportNumber: passengerData.passportNumber || '',
              email: passengerData.email || ''
            };
            
            setSelectedPassengers([formattedPassenger]);
          }
          
          // Set companions
          if (companionPassengers.length > 0) {
            const companions = companionPassengers.map(companion => {
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
            country: sale.destination.country || '',
            city: sale.destination.city || ''
          });
        }
        
        // Pre-populate services and providers
        if (sale.services && sale.services.length > 0) {
          const selectedServiceTemplates = sale.services.map(serviceSale => {
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
          
          // For edit mode, clear selected services to allow reconfiguration
          // This gives users the ability to completely reconfigure services
          setServiceTemplateInstances([]);
          
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
                    receipts: provider.documents || [], // Populate receipts from existing documents
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
                  receipts: serviceSale.documents || [], // Populate receipts from existing documents
                  documents: serviceSale.documents || []
                };
              }
            }
          });
          
          setSelectedProviders(allProviders);
          setProviderFormData(providerFormDataMap);
          
          // Fetch all available service templates (no filtering in edit mode)
          fetchServiceTemplates(null, true);
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
    const isAlreadyInPassengers = selectedPassengers.find(p => p._id === passenger._id);
    const isAlreadyInCompanions = selectedCompanions.find(c => c._id === passenger._id);
    
    // If already in selected passengers, remove it
    if (isAlreadyInPassengers) {
      setSelectedPassengers([]);
      return;
    }
    
    // If already in selected companions, remove it from companions
    if (isAlreadyInCompanions) {
      setSelectedCompanions(prev => prev.filter(c => c._id !== passenger._id));
      return;
    }
    
    console.log('Selected passenger data:', JSON.stringify(passenger, null, 2));
    console.log('🔍 Passenger DNI field:', passenger.dni);
    console.log('🔍 All passenger fields:', Object.keys(passenger));
    
    // Ensure we use complete passenger data from available passengers if DNI is missing
    let completePassenger = passenger;
    if (!passenger.dni) {
      console.log('⚠️ Selected passenger missing DNI, looking for complete data in available passengers');
      const completeData = availablePassengers.find(p => p._id === passenger._id);
      if (completeData) {
        console.log('✅ Found complete passenger data:', completeData);
        console.log('✅ Complete passenger DNI:', completeData.dni);
        completePassenger = completeData;
      } else {
        console.log('❌ Could not find complete passenger data');
      }
    }
    
    // If there's already a selected passenger, add new selection as a companion
    if (selectedPassengers.length > 0) {
      console.log('✅ Primary passenger already selected, adding as companion');
      setSelectedCompanions(prev => [...prev, completePassenger]);
    } else {
      // No selected passenger yet, make this the primary passenger
      console.log('✅ No primary passenger, setting as primary');
      setSelectedPassengers([completePassenger]);
    }
  };

  const removeSelectedPassenger = (passengerId) => {
    setSelectedPassengers(selectedPassengers.filter(p => p._id !== passengerId));
  };

  const toggleCompanionSelection = (companion) => {
    console.log('toggleCompanionSelection called with:', companion);
    console.log('🔍 Companion DNI field:', companion.dni);
    console.log('🔍 All companion fields:', Object.keys(companion));
    console.log('Current selectedCompanions before toggle:', selectedCompanions);
    
    const isSelected = selectedCompanions.find(c => c._id === companion._id);
    console.log('Is companion already selected?', isSelected);
    
    if (isSelected) {
      const newCompanions = selectedCompanions.filter(c => c._id !== companion._id);
      console.log('Removing companion, new list:', newCompanions);
      setSelectedCompanions(newCompanions);
      
      // Add back to available for selection
      setAllForSelection(prev => {
        const isAlreadyInList = prev.find(p => p._id === companion._id);
        if (!isAlreadyInList) {
          return [...prev, companion];
        }
        return prev;
      });
    } else {
      // Ensure we use complete companion data if DNI is missing
      let completeCompanion = companion;
      if (!companion.dni) {
        console.log('⚠️ Selected companion missing DNI, looking for complete data in available companions');
        const completeData = availableCompanions.find(c => c._id === companion._id);
        if (completeData) {
          console.log('✅ Found complete companion data:', completeData);
          console.log('✅ Complete companion DNI:', completeData.dni);
          completeCompanion = completeData;
        } else {
          console.log('❌ Could not find complete companion data');
        }
      }
      
      const newCompanions = [...selectedCompanions, completeCompanion];
      console.log('Adding companion, new list:', newCompanions);
      setSelectedCompanions(newCompanions);
    }
  };

  const removeSelectedCompanion = (companionId) => {
    // Find the companion being removed
    const companionToRemove = selectedCompanions.find(c => c._id === companionId);
    
    // Remove from selected companions
    setSelectedCompanions(selectedCompanions.filter(c => c._id !== companionId));
    
    // Add back to available for selection if it exists
    if (companionToRemove) {
      setAllForSelection(prev => {
        // Check if it's not already in the list
        const isAlreadyInList = prev.find(p => p._id === companionToRemove._id);
        if (!isAlreadyInList) {
          return [...prev, companionToRemove];
        }
        return prev;
      });
    }
  };

  const toggleProviderSelection = (provider) => {
    const isSelected = selectedProviders.find(p => p._id === provider._id);
    if (isSelected) {
      // Remove from selected and add back to available
      setSelectedProviders(prev => prev.filter(p => p._id !== provider._id));
      setAvailableProviders(prev => {
        // Check if provider is not already in the list
        const isAlreadyInList = prev.find(p => p._id === provider._id);
        if (!isAlreadyInList) {
          return [...prev, provider];
        }
        return prev;
      });
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
      setAvailableProviders(prev => {
        // Check if provider is not already in the list
        const isAlreadyInList = prev.find(p => p._id === provider._id);
        if (!isAlreadyInList) {
          return [...prev, provider];
        }
        return prev;
      });
      
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
    console.log('🔍 Getting form data for provider:', providerId);
    console.log('📁 All provider form data:', providerFormData);
    console.log('📄 Specific provider data:', providerFormData[providerId]);
    
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

    // Currency conversion is now manual-only
    // Users must provide exchange rates manually for non-USD currencies
  };

  const handleProviderFileUpload = (providerId, files) => {
    // Handle multiple file uploads for provider receipts
    if (files) {
      // Called with files parameter (from existing flow)
      const fileArray = Array.from(files);
      updateProviderFormData(providerId, 'receipts', fileArray);
    } else {
      // Called without files parameter (from step 6 upload button)
      // Create file input element for file selection
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt';
      
      fileInput.onchange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
          console.log('📤 Uploading files for provider:', providerId);
          console.log('📁 Selected files:', selectedFiles);
          
          // Store files for the current service provider
          updateProviderFormData(providerId, 'receipts', selectedFiles);
          
          // Verify files were stored
          const formData = getProviderFormData(providerId);
          console.log('✅ Files stored in form data:', formData.receipts);
          
          // Show success message
          alert(`Successfully selected ${selectedFiles.length} file(s) for upload. Files will be uploaded when the sale is created.`);
        }
      };
      
      fileInput.click();
    }
  };

  const openFileModal = (providerId) => {
    const formData = getProviderFormData(providerId);
    console.log('🔍 Opening file modal for provider:', providerId);
    console.log('📁 Form data:', formData);
    console.log('📄 Files (receipts):', formData.receipts);
    console.log('📄 Files (documents):', formData.documents);
    
    // Combine existing documents with new receipts
    const existingDocuments = formData.documents || [];
    const newReceipts = formData.receipts || [];
    const allFiles = [...existingDocuments, ...newReceipts];
    
    console.log('📄 All files combined:', allFiles);
    
    setSelectedProviderFiles({
      providerId,
      files: allFiles
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


  const convertProviderAmountToUSD = (providerId, amount, currency) => {
    const rate = providerExchangeRates[providerId] || 1;
    return amount ? (parseFloat(amount) * rate).toFixed(2) : 0;
  };

  // Service Template Management Functions
  const fetchServiceTemplates = async () => {
    try {
      setServiceLoading(true);
      console.log('🔍 Fetching service templates for sale wizard...');
      console.log('🌐 API URL:', api.defaults.baseURL + '/api/service-templates/sale-wizard');
      
      const response = await api.get('/api/service-templates/sale-wizard');
      
      console.log('📡 Full API response:', response);
      console.log('📋 Response data:', response.data);
      
      if (response.data.success) {
        console.log('📋 Raw service templates from API:', response.data.data.serviceTemplates);
        console.log('📊 Total templates received:', response.data.data.serviceTemplates.length);
        
        // Log each template individually
        response.data.data.serviceTemplates.forEach((template, index) => {
          console.log(`Template ${index + 1}:`, {
            id: template._id,
            name: template.name,
            category: template.category,
            isActive: template.isActive
          });
        });
        
        const templates = response.data.data.serviceTemplates;
        setServiceTemplates(templates);
        // Note: availableServiceTemplates filtering is handled by the useEffect that watches serviceTemplateInstances
      } else {
        console.error('❌ API returned success: false', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch service templates:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setServiceLoading(false);
    }
  };

  // Handle when a new service template is added
  const handleServiceTemplateAdded = async (newServiceTemplate) => {
    try {
      console.log('🎯 New service template added:', newServiceTemplate);
      
      // Refresh the service templates list to include the new one
      await fetchServiceTemplates();
      
      // Optionally, you could also add the new template to the current list
      // setServiceTemplates(prev => [...prev, newServiceTemplate]);
      
      console.log('✅ Service templates refreshed after adding new template');
    } catch (error) {
      console.error('❌ Failed to refresh service templates after adding new one:', error);
    }
  };

  // Fetch service types for the dropdown
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

  // Handle when a new service type is added
  const handleServiceTypeAdded = (newServiceType) => {
    setServiceTypes(prev => {
      const exists = prev.some(st => st._id === newServiceType._id);
      if (!exists) {
        return [...prev, newServiceType];
      }
      return prev;
    });
    setShowAddServiceTypeModal(false);
    setShowServiceTypeDropdown(false);
  };

  // Helper function to get service type name (handles both string and object cases)
  const getServiceTypeName = (serviceType) => {
    if (!serviceType) return '';
    if (typeof serviceType === 'string') return serviceType;
    if (typeof serviceType === 'object' && serviceType.name) return serviceType.name;
    return '';
  };

  // Update service template with real-time sync
  const updateServiceTemplate = async (templateId, updates) => {
    try {
      // Update the template in the backend
      const response = await api.put(`/api/service-templates/${templateId}`, updates);
      
      if (response.data.success) {
        // Update the local state immediately for real-time sync
        setServiceTemplates(prev => 
          prev.map(template => 
            template._id === templateId 
              ? { ...template, ...updates }
              : template
          )
        );
        
        // Also update availableServiceTemplates if needed
        setAvailableServiceTemplates(prev => 
          prev.map(template => 
            template._id === templateId 
              ? { ...template, ...updates }
              : template
          )
        );
        
        console.log('✅ Template updated successfully:', response.data.data.serviceTemplate);
      }
    } catch (error) {
      console.error('❌ Failed to update service template:', error);
      setError('Failed to update service template');
    }
  };

  // Pre-populate cupo data into the wizard
  const prePopulateCupoData = async (cupo) => {
    try {
      console.log('🎯 Pre-populating cupo data:', cupo);
      console.log('📋 Available service templates:', serviceTemplates);
      console.log('🔍 Cupo service data:', {
        destino: cupo.serviceId?.destino,
        type: cupo.serviceId?.type,
        name: cupo.serviceId?.name
      });
      
      // Find the service template that matches the cupo's service
      // Try exact name match first (most specific)
      let matchingTemplate = serviceTemplates.find(template => 
        template.name === cupo.serviceId?.destino ||
        template.name === cupo.serviceId?.name
      );
      
      // If no exact match, try partial matching
      if (!matchingTemplate && cupo.serviceId?.destino) {
        console.log('🔍 Trying partial matching for destino:', cupo.serviceId.destino);
        matchingTemplate = serviceTemplates.find(template => 
          template.name.toLowerCase().includes(cupo.serviceId.destino.toLowerCase()) ||
          cupo.serviceId.destino.toLowerCase().includes(template.name.toLowerCase())
        );
      }
      
      // If still no match, try category matching (only if there's a unique category match)
      if (!matchingTemplate && cupo.serviceId?.type) {
        console.log('🔍 Trying category matching for type:', cupo.serviceId.type);
        const categoryMatches = serviceTemplates.filter(template => 
          template.category.toLowerCase() === cupo.serviceId.type.toLowerCase()
        );
        // Only use category match if there's exactly one template with this category
        if (categoryMatches.length === 1) {
          matchingTemplate = categoryMatches[0];
          console.log('✅ Found unique category match:', matchingTemplate.name);
        } else if (categoryMatches.length > 1) {
          console.log('⚠️ Multiple templates match category, cannot auto-select');
        }
      }
      
      // If still no match, show error - don't auto-select
      if (!matchingTemplate) {
        console.error('❌ Could not find matching template for cupo service');
        console.error('Cupo service data:', {
          destino: cupo.serviceId?.destino,
          type: cupo.serviceId?.type,
          name: cupo.serviceId?.name
        });
        // Don't auto-select - let user choose manually
        return;
      }
      
      if (matchingTemplate) {
        console.log('✅ Found matching template:', matchingTemplate);
        // Pre-populate the first service template instance
        const cupoServiceInstance = {
          id: `cupo_instance_${Date.now()}`,
          templateId: matchingTemplate._id,
          templateName: matchingTemplate.name,
          templateCategory: matchingTemplate.category,
          serviceInfo: cupo.serviceId?.destino || cupo.serviceId?.description || matchingTemplate.name,
          checkIn: cupo.metadata?.date ? new Date(cupo.metadata.date).toISOString().split('T')[0] : '',
          checkOut: cupo.metadata?.completionDate ? new Date(cupo.metadata.completionDate).toISOString().split('T')[0] : '',
          cost: cupo.metadata?.value || 0,
          currency: cupo.metadata?.currency || 'USD',
          provider: {
            providerId: cupo.serviceId?.providerId?._id || cupo.serviceId?.providerId,
            name: cupo.serviceId?.providerId?.name || 'Unknown Provider'
          },
          destination: {
            city: cupo.metadata?.destination?.split(',')[0]?.trim() || '',
            country: cupo.metadata?.destination?.split(',')[1]?.trim() || ''
          },
          isCupoService: true,
          cupoId: cupo._id || cupo.id,
          availableSeats: cupo.availableSeats
        };
        
        // Add the cupo service instance
        setServiceTemplateInstances([cupoServiceInstance]);
        
        // Pre-populate destination
        setDestination({
          city: cupoServiceInstance.destination.city,
          country: cupoServiceInstance.destination.country
        });
        
        // Set the current service instance for editing
        setCurrentServiceInstance(cupoServiceInstance);
        setCurrentServiceTemplate(matchingTemplate);
        
        // Only pre-populate form fields if we don't have any current service instance being edited
        // This prevents overriding user input when they're actively editing a service
        if (!currentServiceInstance && !currentServiceInfo && !currentServiceCost) {
          setCurrentServiceInfo(cupoServiceInstance.serviceInfo);
          setCurrentServiceDates({
            checkIn: cupoServiceInstance.checkIn,
            checkOut: cupoServiceInstance.checkOut
          });
          setCurrentServiceCost(cupoServiceInstance.cost.toString());
          setCurrentServiceCurrency(cupoServiceInstance.currency);
          setCurrentServiceProvider(cupoServiceInstance.provider);
          
          // Also set the main sale currency based on the cupo service currency
          if (cupoServiceInstance.currency === 'ARS') {
            setSaleCurrency('ARS');
            setExchangeRate(cupoServiceInstance.exchangeRate ? cupoServiceInstance.exchangeRate.toString() : '');
          } else {
            setSaleCurrency('USD');
            setExchangeRate('');
          }
        }
        
        console.log('✅ Cupo data pre-populated successfully');
      } else {
        console.warn('⚠️ No matching service template found for cupo');
        console.warn('📋 Available templates:', serviceTemplates.map(t => ({ name: t.name, category: t.category })));
        setError('No matching service template found for this cupo. Please ensure service templates are loaded or contact support.');
      }
    } catch (error) {
      console.error('❌ Error pre-populating cupo data:', error);
      setError('Failed to pre-populate cupo data');
    }
  };

  const addService = async () => {
    if (serviceName?.trim()) {
      try {
        const response = await api.post('/api/service-templates', {
          name: serviceName.trim(),
          description: serviceInformation?.trim() || '',
          category: 'General'
        });
        
        if (response.data.success) {
          // Just refresh service templates - don't add to serviceTemplateInstances
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

  // Synchronize service instances when dates or destination change
  useEffect(() => {
    console.log('🔄 Synchronization useEffect triggered', {
      serviceInstancesCount: serviceTemplateInstances.length,
      checkIn: currentServiceDates.checkIn,
      checkOut: currentServiceDates.checkOut,
      city: destination.city,
      country: destination.country
    });
    
    if (serviceTemplateInstances.length > 0) {
      setServiceTemplateInstances(prev => {
        let hasChanges = false;
        const updated = prev.map(instance => {
          // Only update if dates or destination actually changed
          const datesChanged = currentServiceDates.checkIn !== instance.checkIn || 
                              currentServiceDates.checkOut !== instance.checkOut;
          const destinationChanged = destination.city !== instance.destination?.city || 
                                   destination.country !== instance.destination?.country;
          
          if (datesChanged || destinationChanged) {
            hasChanges = true;
            console.log('🔄 Synchronizing service instance:', instance.serviceInfo || instance.templateName, {
              datesChanged,
              destinationChanged,
              currentProviders: instance.providers?.length || 0,
              providers: instance.providers
            });
            
            return {
              ...instance,
              checkIn: currentServiceDates.checkIn || instance.checkIn,
              checkOut: currentServiceDates.checkOut || instance.checkOut,
              destination: {
                city: destination.city || instance.destination?.city || '',
                country: destination.country || instance.destination?.country || ''
              },
              // Explicitly preserve providers - don't overwrite them
              providers: instance.providers || []
            };
          }
          
          // No changes needed, return instance as-is (same reference to avoid re-renders)
          return instance;
        });
        
        if (hasChanges) {
          console.log('🔄 Synchronization complete. Updated instances:', updated.map(s => ({
            name: s.serviceInfo || s.templateName,
            providers: s.providers?.length || 0
          })));
          return updated;
        } else {
          console.log('🔄 No changes needed, returning same array reference');
          // Return the same array reference to avoid triggering re-renders
          return prev;
        }
      });
    }
  }, [currentServiceDates.checkIn, currentServiceDates.checkOut, destination.city, destination.country, serviceTemplateInstances.length]);

  // Service Template Instance Management
  const selectServiceTemplate = (template) => {
    // Create a basic service instance from the template
    const serviceInstance = {
      id: `template_${template._id}_${Date.now()}`,
      templateId: template._id,
      templateName: template.name,
      templateCategory: template.category,
      serviceInfo: template.name, // Use template name as default service info
      checkIn: currentServiceDates.checkIn || '',
      checkOut: currentServiceDates.checkOut || '',
      cost: 0,
      currency: 'USD',
      provider: null,
      providers: [],
      destination: { 
        city: destination.city || '', 
        country: destination.country || '' 
      },
      isTemplateOnly: true // Flag to indicate this is just a template selection
    };
    
    // Add to service template instances
    setServiceTemplateInstances(prev => [...prev, serviceInstance]);
    
    // Don't navigate away from step 3 - stay in template selection mode
    console.log('✅ Template selected and added to instances:', serviceInstance);
  };

  // Multiple Provider Management
  const addProviderToCurrentService = (provider) => {
    if (!currentServiceProviders.find(p => p._id === provider._id)) {
      setCurrentServiceProviders(prev => [...prev, provider]);
      // Also update single provider for backward compatibility
      setCurrentServiceProvider(provider);
    }
  };

  const removeProviderFromCurrentService = (providerId) => {
    setCurrentServiceProviders(prev => prev.filter(p => p._id !== providerId));
    // Update single provider to the first remaining provider or null
    const remaining = currentServiceProviders.filter(p => p._id !== providerId);
    setCurrentServiceProvider(remaining.length > 0 ? remaining[0] : null);
  };

  const addServiceInstance = () => {
    if (!currentServiceTemplate || !currentServiceInfo || !currentServiceDates.checkIn || !currentServiceDates.checkOut || !currentServiceCost || currentServiceProviders.length === 0) {
      setError('Please complete all required fields for this service, including selecting at least one provider');
      return;
    }

    // Validate exchange rate for ARS
    if (currentServiceCurrency === 'ARS' && (!currentServiceExchangeRate || parseFloat(currentServiceExchangeRate) <= 0)) {
      setError('Please provide a valid exchange rate for ARS to USD conversion');
      return;
    }

    // Convert cost to USD if currency is ARS
    let costInUSD = parseFloat(currentServiceCost);
    let originalCurrency = currentServiceCurrency;
    let originalAmount = parseFloat(currentServiceCost);
    let exchangeRate = null;

    if (currentServiceCurrency === 'ARS') {
      exchangeRate = parseFloat(currentServiceExchangeRate);
      costInUSD = originalAmount / exchangeRate;
      originalCurrency = 'ARS'; // Keep track of original currency
    }

    const serviceInstance = {
      id: currentServiceInstance?.id || Date.now(), // Use existing ID if editing, or create new one
      templateId: currentServiceTemplate._id,
      templateName: currentServiceTemplate.name,
      templateCategory: currentServiceTemplate.category,
      serviceInfo: currentServiceInfo,
      checkIn: currentServiceDates.checkIn,
      checkOut: currentServiceDates.checkOut,
      cost: costInUSD, // Always store in USD
      currency: 'USD', // Always store as USD in database
      originalCurrency: originalCurrency, // Keep track of original currency
      originalAmount: originalAmount, // Keep track of original amount
      exchangeRate: exchangeRate, // Store exchange rate used for conversion
      provider: currentServiceProvider, // Keep for backward compatibility
      providers: currentServiceProviders, // New: Multiple providers
      destination: {
        city: destination.city,
        country: destination.country
      }
    };

    // Update main sale currency and exchange rate based on service currency
    if (originalCurrency === 'ARS' && exchangeRate) {
      setSaleCurrency('ARS');
      setExchangeRate(exchangeRate.toString());
    } else if (originalCurrency === 'USD') {
      setSaleCurrency('USD');
      setExchangeRate('');
    }

    if (currentServiceInstance) {
      // Editing existing service - update it
      setServiceTemplateInstances(prev => 
        prev.map(instance => 
          instance.id === currentServiceInstance.id ? serviceInstance : instance
        )
      );
      
      // Show success message for update
      setSuccess('Service updated successfully!');
      setError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      // Update the currentServiceInstance to reflect the new values
      // This ensures the form shows the updated values
      setCurrentServiceInstance(serviceInstance);
      
      // Also update the form fields to reflect the new values
      // This ensures the comparison view shows the correct new values
      setCurrentServiceInfo(serviceInstance.serviceInfo);
      setCurrentServiceDates({
        checkIn: serviceInstance.checkIn,
        checkOut: serviceInstance.checkOut
      });
      setCurrentServiceCost((serviceInstance.originalAmount || serviceInstance.cost).toString());
      setCurrentServiceCurrency(serviceInstance.originalCurrency || serviceInstance.currency);
      setCurrentServiceExchangeRate(serviceInstance.exchangeRate ? serviceInstance.exchangeRate.toString() : '');
      setCurrentServiceProviders(serviceInstance.providers || [serviceInstance.provider]); // Update multiple providers
      setCurrentServiceProvider(serviceInstance.provider); // Keep single provider for compatibility
      setDestination({
        city: serviceInstance.destination.city,
        country: serviceInstance.destination.country
      });
      
      // Don't reset form data when editing - keep the updated values visible
      // This allows user to see what was just updated
    } else {
      // Creating new service - add it and update all other unconfigured services
      setServiceTemplateInstances(prev => {
        // First, add the new service instance
        const updatedInstances = [...prev, serviceInstance];
        
        // Then update all other service instances that don't have cost/providers configured
        return updatedInstances.map(instance => {
          // If this instance doesn't have cost or providers configured, apply the same values
          // Skip the newly added service instance to avoid duplicating it
          if (instance.id !== serviceInstance.id && 
              (instance.cost === 0 || !instance.cost || instance.isTemplateOnly) && 
              (instance.providers.length === 0 || !instance.providers || instance.isTemplateOnly)) {
            return {
              ...instance,
              cost: serviceInstance.cost,
              currency: serviceInstance.currency,
              originalCurrency: serviceInstance.originalCurrency,
              originalAmount: serviceInstance.originalAmount,
              exchangeRate: serviceInstance.exchangeRate,
              provider: serviceInstance.provider,
              providers: serviceInstance.providers,
              checkIn: serviceInstance.checkIn,
              checkOut: serviceInstance.checkOut,
              destination: serviceInstance.destination,
              isTemplateOnly: false // Mark as configured
            };
          }
          return instance;
        });
      });
      
      // Reset current service data only when creating new service
      setCurrentServiceTemplate(null);
      setCurrentServiceInfo('');
      setCurrentServiceDates({ checkIn: '', checkOut: '' });
      setCurrentServiceCost('');
      setCurrentServiceCurrency('USD');
      setCurrentServiceExchangeRate('');
      setCurrentServiceProvider(null);
      setCurrentServiceProviders([]); // Reset multiple providers
      setDestination({ city: '', country: '' });
      setCurrentServiceInstance(null); // Clear the editing state only for new services
    }
    
    setCurrentStep(6); // Move to edit services step
  };

  const removeServiceInstance = (instanceId) => {
    setServiceTemplateInstances(prev => prev.filter(instance => instance.id !== instanceId));
  };

  const updateServiceInstance = (instanceId, updates) => {
    setServiceTemplateInstances(prev => 
      prev.map(instance => 
        instance.id === instanceId || instance._id === instanceId
          ? { ...instance, ...updates }
          : instance
      )
    );
  };

  // Add provider to a specific service
  const addProviderToService = (serviceId, provider) => {
    console.log('🔄 addProviderToService called:', { serviceId, provider: provider.name });
    
    setServiceTemplateInstances(prev => {
      console.log('🔄 Current service instances before update:', prev.map(s => ({ 
        id: s.id || s._id, 
        name: s.serviceInfo || s.templateName, 
        providers: s.providers?.length || 0 
      })));
      
      // Count how many times this provider has been selected globally across all services
      const globalProviderSelectionCount = prev.reduce((total, service) => {
        const serviceProviders = service.providers || (service.provider ? [service.provider] : []);
        const serviceProviderCount = serviceProviders.filter(p => p._id === provider._id).length;
        return total + serviceProviderCount;
      }, 0);
      
      const maxSelections = 7;
      console.log(`🔄 Global provider selection count for "${provider.name}": ${globalProviderSelectionCount}/${maxSelections}`);
      
      // Check if provider can be selected more times globally (up to 7 times across all services)
      if (globalProviderSelectionCount >= maxSelections) {
        console.log(`🔄 Provider "${provider.name}" has reached global maximum selections (${maxSelections}), skipping`);
        return prev;
      }
      
      const updated = prev.map(service => {
        const serviceIdMatch = service.id === serviceId || service._id === serviceId;
        console.log(`🔄 Checking service: ${service.serviceInfo || service.templateName}, ID: ${service.id || service._id}, Target ID: ${serviceId}, Match: ${serviceIdMatch}`);
        
        if (serviceIdMatch) {
          console.log(`🔄 Adding provider to service: ${service.serviceInfo || service.templateName}`);
          const currentProviders = service.providers || (service.provider ? [service.provider] : []);
          
          const newProviders = [...currentProviders, provider];
          console.log(`🔄 New providers count: ${newProviders.length}`);
          const updatedService = {
            ...service,
            providers: newProviders,
            provider: newProviders.length > 0 ? newProviders[0] : null // Keep single provider for backward compatibility
          };
          console.log(`🔄 Updated service providers:`, updatedService.providers?.length || 0);
          return updatedService;
        }
        return service;
      });
      
      console.log('🔄 Updated service instances:', updated.map(s => ({ 
        id: s.id || s._id, 
        name: s.serviceInfo || s.templateName, 
        providers: s.providers?.length || 0 
      })));
      
      return updated;
    });
  };

  // Remove provider from a specific service
  const removeProviderFromService = (serviceId, providerId, providerIndex) => {
    setServiceTemplateInstances(prev => 
      prev.map(service => {
        if (service.id === serviceId || service._id === serviceId) {
          const currentProviders = service.providers || (service.provider ? [service.provider] : []);
          
          // Remove the provider at the specific index
          if (providerIndex >= 0 && providerIndex < currentProviders.length) {
            const updatedProviders = [
              ...currentProviders.slice(0, providerIndex),
              ...currentProviders.slice(providerIndex + 1)
            ];
            
            return {
              ...service,
              providers: updatedProviders,
              provider: updatedProviders.length > 0 ? updatedProviders[0] : null // Keep single provider for backward compatibility
            };
          }
        }
        return service;
      })
    );
  };

  const editServiceInstance = (instance) => {
    setCurrentServiceInstance(instance);
    setCurrentServiceTemplate(serviceTemplates.find(t => t._id === instance.templateId));
    setCurrentServiceInfo(instance.serviceInfo);
    setCurrentServiceDates({
      checkIn: instance.checkIn,
      checkOut: instance.checkOut
    });
    // Use original values if available, otherwise use stored values
    setCurrentServiceCost((instance.originalAmount || instance.cost).toString());
    setCurrentServiceCurrency(instance.originalCurrency || instance.currency);
    // Restore exchange rate if it was used for ARS conversion
    setCurrentServiceExchangeRate(instance.exchangeRate ? instance.exchangeRate.toString() : '');
    setCurrentServiceProvider(instance.provider);
    // Restore multiple providers
    setCurrentServiceProviders(instance.providers || (instance.provider ? [instance.provider] : []));
    setDestination(instance.destination);
    setCurrentStep(5); // Go to Service Dates step for editing
  };

  const toggleServiceSelection = (service) => {
    // Check if service is already selected by comparing the service template ID
    const isSelected = serviceTemplateInstances.find(s => {
      const selectedServiceId = s.serviceId || s._id;
      return selectedServiceId === service._id;
    });
    
    if (isSelected) {
      // Remove from selected services
      setServiceTemplateInstances(prev => prev.filter(s => {
        const selectedServiceId = s.serviceId || s._id;
        return selectedServiceId !== service._id;
      }));
      // Add back to available services
      setAvailableServiceTemplates(prev => [...prev, service]);
    } else {
      // Add to selected services (create a service sale object)
      const serviceSale = {
        ...service,
        serviceId: service._id, // Store the service template ID
        serviceName: service.name,
        priceClient: 0,
        costProvider: 0,
        quantity: 1
      };
      setServiceTemplateInstances(prev => [...prev, serviceSale]);
      // Remove from available services
      setAvailableServiceTemplates(prev => prev.filter(s => s._id !== service._id));
    }
  };

  const removeSelectedService = (serviceId) => {
    // Find the service being removed
    const serviceToRemove = serviceTemplateInstances.find(s => s._id === serviceId);
    
    // Remove from selected services
    setServiceTemplateInstances(prev => prev.filter(s => s._id !== serviceId));
    
    // Add back to available services if it exists
    if (serviceToRemove) {
      // Convert back to service template format
      const serviceTemplate = {
        _id: serviceToRemove.serviceId || serviceToRemove._id,
        name: serviceToRemove.serviceName || serviceToRemove.name,
        description: serviceToRemove.description,
        category: serviceToRemove.category || 'General'
      };
      setAvailableServiceTemplates(prev => [...prev, serviceTemplate]);
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
          // Update the service in serviceTemplateInstances if it's selected
          setServiceTemplateInstances(prev => prev.map(service => 
            service._id === editingService._id 
              ? {
                  ...service,
                  name: serviceName.trim(),
                  description: serviceInformation?.trim() || '',
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

  // Helper function to upload provider documents
  const uploadProviderDocuments = async (providerId, files) => {
    if (!files || files.length === 0) return [];
    
    const uploadedDocs = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('providerId', providerId);
      
      try {
        const response = await api.post('/api/upload/provider-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          uploadedDocs.push({
            filename: response.data.filename,
            url: response.data.url,
            type: 'receipt',
            originalName: response.data.originalName
          });
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedDocs;
  };

  const createSale = async () => {
    console.log('🔥 createSale function called!');
    console.log('🌍 Current destination state:', destination);
    console.log('👥 Selected providers:', selectedProviders);
    console.log('📋 Provider form data:', providerFormData);
    console.log('🔧 Expanded providers:', Array.from(expandedProviders));
    
    // Extract providers from service instances
    const providersFromServices = serviceTemplateInstances.flatMap(instance => 
      instance.providers || (instance.provider ? [instance.provider] : [])
    );
    console.log('🔍 Providers from service instances:', providersFromServices);
    
    // Extract providers from providerFormData (these are the manually selected providers)
    const providersFromFormData = Object.keys(providerFormData).map(providerId => {
      // Find provider details from availableProviders or construct from form data
      const provider = availableProviders.find(p => p._id === providerId);
      if (provider) {
        return provider;
      }
      // If not found in availableProviders, it might be from service instance
      const serviceProvider = providersFromServices.find(p => 
        (p._id === providerId || p.providerId === providerId)
      );
      return serviceProvider;
    }).filter(Boolean); // Remove any null/undefined entries
    
    console.log('🔍 Providers from form data:', providersFromFormData);
    
    // Combine all providers (from selectedProviders, form data, and service instances)
    const allProvidersMap = new Map();
    
    // Add from selectedProviders
    selectedProviders.forEach(p => allProvidersMap.set(p._id, p));
    
    // Add from form data
    providersFromFormData.forEach(p => {
      const id = p._id || p.providerId;
      if (id) allProvidersMap.set(id, p);
    });
    
    // Add from service instances
    providersFromServices.forEach(p => {
      const id = p._id || p.providerId;
      if (id) allProvidersMap.set(id, p);
    });
    
    const allProviders = Array.from(allProvidersMap.values());
    console.log('🎯 All providers (combined):', allProviders);
    console.log('🔢 Total provider count:', allProviders.length);
    
    try {
    setLoading(true);
    setError('');

      // Validate required fields
      if (serviceTemplateInstances.length === 0) {
        setError('Please add at least one service');
        setLoading(false);
        return;
      }

      if (selectedPassengers.length === 0) {
        setError('Please select at least one passenger');
        setLoading(false);
        return;
      }
      
      // Validate passenger data
      const allPassengers = [...selectedPassengers, ...selectedCompanions];
      console.log('🔍 Validating passengers:', allPassengers);
      console.log('🔍 Selected passengers source:', selectedPassengers);
      console.log('🔍 Selected companions source:', selectedCompanions);
      
      for (const passenger of allPassengers) {
        console.log('🔍 Passenger data:', passenger);
        console.log('🔍 Passenger fields:', {
          name: passenger.name,
          surname: passenger.surname,
          dni: passenger.dni,
          hasName: !!passenger.name,
          hasSurname: !!passenger.surname,
          hasDni: !!passenger.dni
        });
        
        // Check for required fields - dni is required for clients
        if (!passenger.name || !passenger.surname || !passenger.dni) {
          setError(`Missing required fields for ${passenger.name || 'passenger'}: name, surname, and DNI are required`);
          setLoading(false);
          return;
        }
      }

      // Add cupo validation for seat availability
      if (isCupoReservation && cupoContext) {
        const totalPassengers = selectedPassengers.length + selectedCompanions.length;
        if (totalPassengers > cupoContext.availableSeats) {
          setError(`Not enough seats available. Requested: ${totalPassengers}, Available: ${cupoContext.availableSeats}`);
          setLoading(false);
          return;
        }
      }
      
      // Show upload progress message
      const totalFiles = allProviders.reduce((count, provider) => {
        const providerId = provider._id || provider.providerId;
        const formData = providerFormData[providerId] || {};
        const existingDocs = formData.documents?.length || 0;
        const newReceipts = formData.receipts?.length || 0;
        return count + existingDocs + newReceipts;
      }, 0);
      
      if (totalFiles > 0) {
        setError(`Uploading ${totalFiles} document(s)... Please wait.`);
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
        destination: (() => {
          // Use main destination if available, otherwise use first service's destination
          const mainDestination = destination.city && destination.country ? destination : 
            (serviceTemplateInstances.length > 0 && serviceTemplateInstances[0].destination ? 
              serviceTemplateInstances[0].destination : 
              { city: 'Unknown City', country: 'Unknown Country' });
          
          return {
            name: mainDestination.city && mainDestination.country ? 
              `${mainDestination.city}, ${mainDestination.country}` : 
              'Unknown Destination',
            city: mainDestination.city || 'Unknown City',
            country: mainDestination.country || 'Unknown Country'
          };
        })(),
        serviceTemplateInstances: serviceTemplateInstances.map(service => ({
          templateId: service.templateId,
          templateName: service.templateName,
          templateCategory: service.templateCategory,
          serviceInfo: service.serviceInfo,
          checkIn: service.checkIn,
          checkOut: service.checkOut,
          cost: service.cost,
          currency: service.currency,
          originalCurrency: service.originalCurrency,
          originalAmount: service.originalAmount,
          exchangeRate: service.exchangeRate,
          provider: {
            providerId: service.provider?.providerId || service.provider?._id,
            name: service.provider?.name,
            phone: service.provider?.phone,
            email: service.provider?.email
          },
          providers: service.providers,
          destination: service.destination
        })),
        selectedProviders: await Promise.all(allProviders.map(async provider => {
          const providerId = provider._id || provider.providerId;
          const formData = providerFormData[providerId] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(providerId, formData.cost, formData.currency || 'USD') : 0;
          
          console.log(`📋 Mapping provider ${provider.name}:`, {
            providerId,
            formData,
            hasNewDocuments: formData.receipts?.length > 0,
            hasExistingDocuments: formData.documents?.length > 0
          });
          
          // Combine existing documents with newly uploaded ones
          const existingDocuments = formData.documents || [];
          let uploadedDocuments = [];
          
          // Upload new documents if any
          if (formData.receipts && formData.receipts.length > 0) {
            console.log(`📤 Uploading ${formData.receipts.length} new documents for provider ${provider.name}`);
            try {
              uploadedDocuments = await uploadProviderDocuments(providerId, formData.receipts);
              console.log(`✅ Uploaded new documents:`, uploadedDocuments);
            } catch (uploadError) {
              console.error(`❌ Failed to upload documents for provider ${provider.name}:`, uploadError);
              throw new Error(`Failed to upload documents for provider ${provider.name}: ${uploadError.message}`);
            }
          }
          
          // Combine existing and new documents
          const allDocuments = [...existingDocuments, ...uploadedDocuments];
          console.log(`📄 Total documents for ${provider.name}:`, allDocuments.length);
          
          return {
            providerId: providerId,
            name: provider.name,
            phone: provider.phone,
            email: provider.email,
            cost: formData.cost ? parseFloat(formData.cost) : null,
            currency: formData.currency || 'USD',
            usdAmount: parseFloat(usdAmount),
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            documents: allDocuments
          };
        })),
        
        // Calculate total provider costs in USD
        totalProviderCostsUSD: allProviders.reduce((total, provider) => {
          const providerId = provider._id || provider.providerId;
          const formData = providerFormData[providerId] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(providerId, formData.cost, formData.currency || 'USD') : 0;
          return total + parseFloat(usdAmount);
        }, 0),
        pricingModel: 'unit', // Always unit pricing
        saleCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
        baseCurrency: 'USD',
        originalSalePrice: salePrice ? parseFloat(salePrice) : null,
        originalCurrency: saleCurrency,
        // Add cupo context for seat reservation
        ...(isCupoReservation && cupoContext && {
          cupoContext: {
            cupoId: cupoContext._id || cupoContext.id,
            seatsToReserve: selectedPassengers.length + selectedCompanions.length,
            availableSeats: cupoContext.availableSeats
          }
        })
      };

      // Map documents from selectedProviders to serviceTemplateInstances providers
      console.log(`🔍 Mapping documents after selectedProviders creation`);
      console.log(`🔍 SelectedProviders:`, saleData.selectedProviders.map(sp => ({ 
        id: sp.providerId, 
        name: sp.name, 
        docCount: sp.documents?.length || 0 
      })));
      
      saleData.serviceTemplateInstances = saleData.serviceTemplateInstances.map(service => {
        console.log(`🔍 Processing service: ${service.templateName}`);
        
        // Map documents from selectedProviders to individual providers in this service
        const providersWithDocuments = service.providers.map(provider => {
          const providerId = provider._id || provider.providerId;
          const selectedProvider = saleData.selectedProviders.find(sp => sp.providerId === providerId);
          
          console.log(`🔍 Mapping documents for provider ${provider.name} (${providerId}):`, {
            selectedProvider: !!selectedProvider,
            hasDocuments: selectedProvider?.documents?.length > 0,
            documentCount: selectedProvider?.documents?.length || 0
          });
          
          if (selectedProvider && selectedProvider.documents) {
            return {
              ...provider,
              documents: selectedProvider.documents
            };
          }
          
          return provider;
        });

        const mappedService = {
          ...service,
          providers: providersWithDocuments
        };

        console.log(`🔍 Final mapped service ${service.templateName} providers:`, 
          providersWithDocuments.map(p => ({ 
            name: p.name, 
            id: p._id || p.providerId, 
            docCount: p.documents?.length || 0
          }))
        );

        return mappedService;
      });

      // Clear upload message and show creating sale message
      if (totalFiles > 0) {
        setError('Documents uploaded successfully! Creating sale...');
      }
      
      console.log('🚀 Sending sale data to API:', JSON.stringify(saleData, null, 2));
      console.log('🔍 Service template instances provider data:', serviceTemplateInstances.map(s => ({
        templateName: s.templateName,
        provider: s.provider
      })));
      console.log('🔍 Raw serviceTemplateInstances from state:', JSON.stringify(serviceTemplateInstances, null, 2));
      console.log('🔍 Mapped serviceTemplateInstances for API:', JSON.stringify(saleData.serviceTemplateInstances, null, 2));
      console.log('🌍 Destination data being sent:', {
        originalDestination: destination,
        processedDestination: saleData.destination
      });
      const response = await api.post('/api/sales/service-template-flow', saleData);
      
      if (response.data.success) {
        setCurrentSaleId(response.data.data.sale._id);
        setSaleSummary(response.data.data.sale);
        setSuccess('Sale created successfully!');
        // Navigate to the specific sale summary after successful creation
        navigate(`/sales/${response.data.data.sale._id}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      // Validate current step before proceeding
      if (currentStep === 1 && selectedPassengers.length === 0) {
        setError('Please select at least one passenger to continue');
        return;
      }
      
      if (currentStep === 2 && (!pricePerPassenger || parseFloat(pricePerPassenger) <= 0)) {
        setError('Please enter a valid price per passenger to continue');
        return;
      }
      
      if (currentStep === 2 && passengerCurrency === 'ARS' && (!passengerExchangeRate || parseFloat(passengerExchangeRate) <= 0)) {
        setError('Please enter a valid exchange rate for ARS to USD conversion');
        return;
      }
      
      if (currentStep === 3 && serviceTemplateInstances.length === 0) {
        setError('Please select a service template to continue');
        return;
      }
      
      if (currentStep === 4 && (!currentServiceDates.checkIn || !currentServiceDates.checkOut || !destination.city)) {
        setError('Please enter check-in and check-out dates and city to continue');
        return;
      }
      
      if (currentStep === 5) {
        // Validate that all service instances have valid costs and providers
        console.log('🔍 Step 6 validation - Service instances:', serviceTemplateInstances);
        
        const invalidServices = serviceTemplateInstances.filter(service => {
          const hasValidCost = service.cost && parseFloat(service.cost) > 0;
          const hasProviders = service.providers && service.providers.length > 0;
          console.log(`🔍 Service ${service.serviceInfo || service.templateName}: cost=${service.cost}, providers=${service.providers?.length || 0}, hasValidCost=${hasValidCost}, hasProviders=${hasProviders}`);
          return !hasValidCost || !hasProviders;
        });
        
        console.log('🔍 Invalid services:', invalidServices);
        
        if (invalidServices.length > 0) {
          setError('Please enter a valid service cost and select providers for all services to continue');
          return;
        }
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
      
      if (!destination.city || !destination.country) {
        setError('Please enter destination city and country');
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
        destination: {
          name: (destination.city && destination.country) ? 
            `${destination.city}, ${destination.country}` : 
            'Unknown Destination',
          city: destination.city || 'Unknown City',
          country: destination.country || 'Unknown Country'
        },
        selectedServices: serviceTemplateInstances.map(instance => ({
          serviceTemplateId: instance.templateId,
          serviceName: instance.templateName,
          serviceInfo: instance.serviceInfo,
          checkIn: instance.checkIn,
          checkOut: instance.checkOut,
          cost: instance.cost,
          currency: instance.currency,
          originalCurrency: instance.originalCurrency,
          originalAmount: instance.originalAmount,
          exchangeRate: instance.exchangeRate,
          provider: instance.provider,
          providers: instance.providers,
          destination: instance.destination,
          templateCategory: instance.templateCategory
        })),
        selectedProviders: selectedProviders.map(provider => {
          const formData = providerFormData[provider._id] || {};
          const usdAmount = formData.cost ? convertProviderAmountToUSD(provider._id, formData.cost, formData.currency || 'USD') : 0;
          
          // Combine existing documents with new receipts
          const existingDocuments = formData.documents || [];
          const newReceipts = formData.receipts || [];
          const allDocuments = [...existingDocuments, ...newReceipts];
          
          return {
            providerId: provider._id,
            name: provider.name,
            phone: provider.phone,
            email: provider.email,
            cost: formData.cost ? parseFloat(formData.cost) : null,
            currency: formData.currency || 'USD',
            usdAmount: parseFloat(usdAmount),
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            documents: allDocuments
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
      
      // Create the sale using the service template flow endpoint
      const response = await api.post('/api/sales/service-template-flow', saleData);
      
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
      
      if (!destination.city || !destination.country) {
        setError('Please enter destination city and country');
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
        services: serviceTemplateInstances.map(service => {
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
              // Combine existing documents with newly uploaded ones
              const existingDocuments = formData.documents || [];
              const newDocuments = providerDocuments[provider._id] || [];
              const allDocuments = [...existingDocuments, ...newDocuments];
              
              return {
                providerId: provider._id,
                serviceProviderId: provider._id,
                costProvider: formData.cost ? parseFloat(formData.cost) : 0,
                currency: formData.currency || 'USD',
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                documents: allDocuments
              };
            }),
            providerId: selectedProviders.length > 0 ? selectedProviders[0]._id : null
          };
        }),
        destination: {
          country: destination.country,
          city: destination.city
        },
        saleCurrency: saleCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1,
        notes: saleNotes || ''
      };

      // Debug: Log the IDs being used
      console.log('Update sale - URL param id:', id);
      console.log('Update sale - currentSaleId:', currentSaleId);
      console.log('Update sale - using currentSaleId for API call');
      console.log('Update sale - serviceTemplateInstances:', serviceTemplateInstances);
      console.log('Update sale - serviceTemplateInstances details:', serviceTemplateInstances.map(s => ({
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              {isEditMode ? 'Edit Sale' : isCupoReservation ? 'Cupo Reservation' : 'Create New Sale'}
            </h1>
            <p className="text-dark-300 mt-2">
              {isEditMode 
                ? 'Update the sale information by following the steps below' 
                : isCupoReservation
                ? 'Reserve seats from your inventory - same process as creating a regular sale'
                : 'Follow the steps to create a new sale with the updated flow'
              }
            </p>
          </div>
          {isCupoReservation && cupoContext && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-sm font-medium text-primary-400">Cupo Reservation</span>
              </div>
              <div className="text-xs text-dark-300 mt-1">
                Available: {cupoContext.availableSeats} seats
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card-glass p-6 mb-6">
        <div className="space-y-6">
          {/* First Row - Steps 1-4 */}
          <div className="flex items-start justify-center gap-8">
            {steps.slice(0, 4).map((step, index) => (
              <div key={step.number} className="flex items-start">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-dark-600 text-dark-300'
                  }`}>
                    {step.number}
                  </div>
                  <div className="mt-2 text-center max-w-36 min-w-28 px-1">
                    <p className={`text-xs font-medium leading-tight break-words ${
                      currentStep >= step.number ? 'text-primary-400' : 'text-dark-300'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-dark-400 mt-1 leading-tight break-words">{step.description}</p>
                  </div>
                </div>
                {/* Directional Arrow */}
                {index < 3 && (
                  <div className="flex justify-center mx-4 mt-6">
                    <div className={`text-lg transition-colors duration-300 ${
                      currentStep > step.number ? 'text-primary-500' : 'text-dark-500'
                    }`}>
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Second Row - Steps 5-7 */}
          <div className="flex items-start justify-center gap-8">
            {steps.slice(4, 7).map((step, index) => (
              <div key={step.number} className="flex items-start">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-dark-600 text-dark-300'
                  }`}>
                    {step.number}
                  </div>
                  <div className="mt-2 text-center max-w-36 min-w-28 px-1">
                    <p className={`text-xs font-medium leading-tight break-words ${
                      currentStep >= step.number ? 'text-primary-400' : 'text-dark-300'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-dark-400 mt-1 leading-tight break-words">{step.description}</p>
                  </div>
                </div>
                {/* Directional Arrow */}
                {index < 2 && (
                  <div className="flex justify-center mx-4 mt-6">
                    <div className={`text-lg transition-colors duration-300 ${
                      currentStep > step.number ? 'text-primary-500' : 'text-dark-500'
                    }`}>
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="mt-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-sm text-dark-300">Progress:</div>
              <div className="w-64 bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-dark-300">{Math.round((currentStep / 7) * 100)}%</div>
            </div>
          </div>
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
        <NewSaleWizardSteps
          currentStep={currentStep}
          // Service Template Data
          serviceTemplates={serviceTemplates}
          availableServiceTemplates={availableServiceTemplates}
          serviceTemplateInstances={serviceTemplateInstances}
          serviceLoading={serviceLoading}
          currentServiceTemplate={currentServiceTemplate}
          currentServiceInfo={currentServiceInfo}
          currentServiceDates={currentServiceDates}
          currentServiceCost={currentServiceCost}
          currentServiceCurrency={currentServiceCurrency}
          currentServiceProvider={currentServiceProvider}
          currentServiceProviders={currentServiceProviders}
          addProviderToCurrentService={addProviderToCurrentService}
          removeProviderFromCurrentService={removeProviderFromCurrentService}
          // Destination Data
          destination={destination}
          citySuggestions={citySuggestions}
          countrySuggestions={countrySuggestions}
          // Passenger Data
          selectedPassengers={selectedPassengers}
          selectedCompanions={selectedCompanions}
          availablePassengers={availablePassengers}
          availableCompanions={availableCompanions}
          allForSelection={allForSelection}
          passengerSearch={passengerSearch}
          companionSearch={companionSearch}
          passengerLoading={passengerLoading}
          companionLoading={companionLoading}
          companionsFetched={companionsFetched}
          // Provider Data
          availableProviders={availableProviders}
          providerSearch={providerSearch}
          providerLoading={providerLoading}
          expandedProviders={expandedProviders}
          providerFormData={providerFormData}
          // Functions
          setCurrentStep={setCurrentStep}
          selectServiceTemplate={selectServiceTemplate}
          setCurrentServiceInfo={setCurrentServiceInfo}
          setCurrentServiceDates={setCurrentServiceDates}
          setCurrentServiceCost={setCurrentServiceCost}
          setCurrentServiceCurrency={setCurrentServiceCurrency}
          currentServiceExchangeRate={currentServiceExchangeRate}
          setCurrentServiceExchangeRate={setCurrentServiceExchangeRate}
          setCurrentServiceProvider={setCurrentServiceProvider}
          setCurrentServiceProviders={setCurrentServiceProviders}
          addServiceInstance={addServiceInstance}
          removeServiceInstance={removeServiceInstance}
          updateServiceInstance={updateServiceInstance}
          editServiceInstance={editServiceInstance}
          addProviderToService={addProviderToService}
          removeProviderFromService={removeProviderFromService}
          currentServiceInstance={currentServiceInstance}
          setCurrentServiceInstance={setCurrentServiceInstance}
          setCurrentServiceTemplate={setCurrentServiceTemplate}
          setDestination={setDestination}
          searchCities={searchCities}
          searchCountries={searchCountries}
          setCitySuggestions={setCitySuggestions}
          setCountrySuggestions={setCountrySuggestions}
          togglePassengerSelection={togglePassengerSelection}
          removeSelectedPassenger={removeSelectedPassenger}
          toggleCompanionSelection={toggleCompanionSelection}
          removeSelectedCompanion={removeSelectedCompanion}
          setPassengerSearch={setPassengerSearch}
          setCompanionSearch={setCompanionSearch}
          toggleProviderSelection={toggleProviderSelection}
          removeSelectedProvider={removeSelectedProvider}
          toggleProviderExpansion={toggleProviderExpansion}
          updateProviderFormData={updateProviderFormData}
          getProviderFormData={getProviderFormData}
          convertProviderAmountToUSD={convertProviderAmountToUSD}
          setProviderSearch={setProviderSearch}
          handleProviderFileUpload={handleProviderFileUpload}
          openFileModal={openFileModal}
          closeFileModal={closeFileModal}
          openFile={openFile}
          showFileModal={showFileModal}
          selectedProviderFiles={selectedProviderFiles}
          // Service Template Modal
          showAddServiceTemplateModal={showAddServiceTemplateModal}
          setShowAddServiceTemplateModal={setShowAddServiceTemplateModal}
          onServiceTemplateAdded={handleServiceTemplateAdded}
          // Service Template Search
          serviceTemplateSearch={serviceTemplateSearch}
          setServiceTemplateSearch={setServiceTemplateSearch}
          // Template Editing
          editingTemplate={editingTemplate}
          setEditingTemplate={setEditingTemplate}
          updateServiceTemplate={updateServiceTemplate}
          // Price per Passenger
          pricePerPassenger={pricePerPassenger}
          setPricePerPassenger={setPricePerPassenger}
          passengerCurrency={passengerCurrency}
          setPassengerCurrency={setPassengerCurrency}
          passengerExchangeRate={passengerExchangeRate}
          setPassengerExchangeRate={setPassengerExchangeRate}
          passengerConvertedAmount={passengerConvertedAmount}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-4">
          {currentStep === 7 ? (
            <button
              onClick={createSale}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating Sale...' : 'Complete Sale'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={currentStep === 7}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Add Service Template Modal - Rendered at top level to avoid parent container constraints */}
      <AddServiceTemplateModal
        isOpen={showAddServiceTemplateModal}
        onClose={() => setShowAddServiceTemplateModal(false)}
        onServiceTemplateAdded={handleServiceTemplateAdded}
      />

      {/* Edit Service Template Modal - Rendered at top level to avoid parent container constraints */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-100">Edit Service Template</h2>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-dark-400 hover:text-dark-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  defaultValue={editingTemplate.name}
                  id="edit-template-name"
                  className="input-field"
                  placeholder="Enter template name"
                />
              </div>

              {/* Service Type */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="edit-template-serviceType" className="block text-sm font-medium text-dark-200">
                    Service Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddServiceTypeModal(true)}
                    className="text-primary-400 hover:text-primary-300 transition-colors"
                    title="Add new service type"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <div
                    className="input-field cursor-pointer flex items-center justify-between"
                    onClick={() => setShowServiceTypeDropdown(!showServiceTypeDropdown)}
                  >
                    <span className={getServiceTypeName(editingTemplate.serviceType) ? 'text-dark-100' : 'text-dark-400'}>
                      {getServiceTypeName(editingTemplate.serviceType) || 'Select or enter service type'}
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
                        serviceTypes.map((serviceTypeItem) => (
                          <div
                            key={serviceTypeItem._id}
                            className="px-3 py-2 text-sm text-dark-200 hover:bg-dark-700 cursor-pointer border-b border-white/5 last:border-b-0"
                            onClick={() => {
                              // Update the editing template with the selected service type
                              setEditingTemplate(prev => ({ ...prev, serviceType: serviceTypeItem.name }));
                              setShowServiceTypeDropdown(false);
                            }}
                          >
                            {serviceTypeItem.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-dark-400">
                          No service types added yet
                        </div>
                      )}
                    </div>
                  )}
                  
                  {getServiceTypeName(editingTemplate.serviceType) && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3">
                      <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        {getServiceTypeName(editingTemplate.serviceType)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const nameInput = document.getElementById('edit-template-name');
                    
                    const updates = {
                      name: nameInput.value.trim(),
                      description: getServiceTypeName(editingTemplate.serviceType)
                    };
                    
                    if (updates.name) {
                      await updateServiceTemplate(editingTemplate._id, updates);
                      setEditingTemplate(null);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Modal - Moved to root level to prevent content overwriting */}
      {showFileModal && selectedProviderFiles && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-100">Uploaded Documents</h3>
              <button
                onClick={closeFileModal}
                className="text-dark-400 hover:text-dark-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {(() => {
              console.log('🔍 Modal checking files:', selectedProviderFiles);
              console.log('📄 Files array:', selectedProviderFiles?.files);
              console.log('📊 Files length:', selectedProviderFiles?.files?.length);
              return selectedProviderFiles.files && selectedProviderFiles.files.length > 0;
            })() ? (
              <div className="space-y-3">
                {selectedProviderFiles.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-dark-100">
                          {file.name || file.filename || `Document ${index + 1}`}
                        </p>
                        {file.type && (
                          <p className="text-xs text-dark-400 capitalize">{file.type}</p>
                        )}
                        {file.uploadedAt && (
                          <p className="text-xs text-dark-400">
                            Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openFile(file)}
                      className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-dark-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-dark-400">No documents uploaded yet</p>
                <p className="text-sm text-dark-500 mt-1">Use the Upload button to add documents</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Service Type Modal */}
      <AddServiceTypeModal
        isOpen={showAddServiceTypeModal}
        onClose={() => setShowAddServiceTypeModal(false)}
        onServiceTypeAdded={handleServiceTypeAdded}
      />
    </div>
  );
};

export default SaleWizard;
