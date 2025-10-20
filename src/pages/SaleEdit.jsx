import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ServiceTemplateInstanceEditor from '../components/ServiceTemplateInstanceEditor';
import AddServiceModal from '../components/AddServiceModal';
import PassengerPriceModal from '../components/PassengerPriceModal';
import { toast } from 'react-toastify';

const SaleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Sale data
  const [sale, setSale] = useState(null);
  const [serviceTemplateInstances, setServiceTemplateInstances] = useState([]);
  const [passengers, setPassengers] = useState([]);
  
  // Available data for editing
  const [availableProviders, setAvailableProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Global provider tracking
  const getGlobalProviderCount = (providerId, excludeInstanceId = null) => {
    const count = serviceTemplateInstances.reduce((total, instance) => {
      // Skip the excluded instance (used when editing a specific service)
      if (excludeInstanceId && (instance.id === excludeInstanceId || instance._id === excludeInstanceId)) {
        return total;
      }
      
      if (instance.providers && instance.providers.length > 0) {
        // Count providers by checking both possible formats, but avoid double counting
        let providerCount = 0;
        
        instance.providers.forEach(p => {
          // Get the actual provider ID from either format
          const actualProviderId = p.providerId?._id || p._id;
          
          // Only count if the ID matches and we haven't counted this specific provider object yet
          if (actualProviderId === providerId) {
            providerCount++;
          }
        });
        
        return total + providerCount;
      } else if (instance.provider && instance.provider._id === providerId) {
        return total + 1;
      }
      return total;
    }, 0);
    
    console.log('🔍 Global Provider Count - Debug:', {
      providerId,
      excludeInstanceId,
      totalCount: count,
      serviceInstances: serviceTemplateInstances.map(instance => ({
        id: instance.id,
        excluded: excludeInstanceId && (instance.id === excludeInstanceId || instance._id === excludeInstanceId),
        providers: instance.providers?.length || 0,
        providerDetails: instance.providers?.map(p => ({
          actualId: p.providerId?._id || p._id,
          name: p.name || p.providerId?.name,
          hasProviderId: !!p.providerId,
          hasDirectId: !!p._id
        })) || []
      }))
    });
    
    return count;
  };
  
  // Editing states
  const [editingInstance, setEditingInstance] = useState(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  
  // Passenger price editing states
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pricePerPassenger, setPricePerPassenger] = useState(0);
  const [passengerCurrency, setPassengerCurrency] = useState('USD');

  useEffect(() => {
    if (id) {
      fetchSale();
      fetchProviders();
    }
  }, [id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('🔥 Frontend - Auth token exists:', !!token);
      console.log('🔥 Frontend - Fetching sale with ID:', id);
      
      const response = await api.get(`/api/sales/${id}`);
      
      if (response.data.success) {
        const saleData = response.data.data.sale;
        console.log('🔥 Frontend - Sale loaded successfully:', saleData._id);
        setSale(saleData);
        
        // Convert services to service template instances format
        console.log('🔍 SaleEdit - Processing sale services:', saleData.services);
        console.log('🔍 SaleEdit - Sale totalCost from backend:', saleData.totalCost);
        console.log('🔍 SaleEdit - Sale totalSalePrice from backend:', saleData.totalSalePrice);
        console.log('🔍 SaleEdit - Sale passengers from backend:', saleData.passengers);
        const instances = saleData.services.map((service, index) => {
          console.log(`🔍 SaleEdit - Processing service ${index}:`, service);
          console.log(`🔍 SaleEdit - Service serviceId:`, service.serviceId);
          console.log(`🔍 SaleEdit - Service serviceId.name:`, service.serviceId?.name);
          console.log(`🔍 SaleEdit - Service serviceName:`, service.serviceName);
          console.log(`🔍 SaleEdit - Service providers:`, service.providers);
          console.log(`🔍 SaleEdit - Service costProvider:`, service.costProvider);
          console.log(`🔍 SaleEdit - Service priceClient:`, service.priceClient);
          
          // Extract provider objects from the backend structure
          let providers = [];
          if (service.providers && service.providers.length > 0) {
            // Backend structure: providers array with providerId objects and documents
            providers = service.providers.map((p, pIndex) => {
              console.log(`🔍 SaleEdit - Processing provider ${pIndex}:`, p);
              console.log(`🔍 SaleEdit - Provider documents:`, p.documents);
              
              // Preserve the full provider object with documents and costProvider
              const providerObj = p.providerId || p;
              const result = {
                ...providerObj,
                // Preserve documents from the provider data
                documents: p.documents || [],
                // Preserve costProvider from the original provider data
                costProvider: p.costProvider !== null && p.costProvider !== undefined ? p.costProvider : (providerObj.costProvider || 0)
              };
              console.log(`🔍 SaleEdit - Provider result:`, result);
              return result;
            }).filter(Boolean);
          } else if (service.providerId) {
            // Fallback to single provider
            providers = [service.providerId];
          }

          return {
            id: service._id || service.serviceId?._id || `instance_${index}`, // Use actual database ID
            templateId: service.serviceTemplateId || service.serviceId,
            templateName: service.serviceId?.name || service.serviceName || service.serviceId?.destino || 'Unknown Service',
            templateCategory: service.serviceId?.typeId?.name || service.serviceId?.type || 'General',
            serviceInfo: service.serviceName || 'Unknown Service',
            serviceDescription: service.notes || service.serviceId?.description || '',
            checkIn: service.serviceDates?.startDate ? new Date(service.serviceDates.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            checkOut: service.serviceDates?.endDate ? new Date(service.serviceDates.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            cost: (() => {
              // Use the stored costProvider value directly from the database
              const storedCost = service.costProvider !== null && service.costProvider !== undefined ? service.costProvider : 0;
              console.log(`🔍 SaleEdit - Using stored cost for service ${index}:`, storedCost);
              return storedCost;
            })(),
            costProvider: (() => {
              // Use the stored costProvider value directly from the database
              return service.costProvider !== null && service.costProvider !== undefined ? service.costProvider : 0;
            })(),
            currency: saleData.saleCurrency || service.currency || 'USD',
            provider: service.providerId || null, // Backend populates this with full provider object
            providers: providers, // Extract provider objects with documents preserved
            providersData: service.providers || [], // Store original provider data structure from backend
            destination: {
              city: saleData.destination?.city || '',
              country: saleData.destination?.country || ''
            }
          };
        });
        
        console.log('🔍 SaleEdit - Final instances:', instances);
        console.log('🔍 SaleEdit - Instance providers with documents:', instances.map(i => ({
          serviceName: i.templateName,
          providers: i.providers?.map(p => ({
            name: p.name,
            documents: p.documents
          }))
        })));
        
        setServiceTemplateInstances(instances);
        setPassengers(saleData.passengers || []);
        
        // Initialize price per passenger from totalSalePrice divided by passenger count
        if (saleData.passengers && saleData.passengers.length > 0) {
          const calculatedPricePerPassenger = saleData.totalSalePrice / saleData.passengers.length;
          setPricePerPassenger(calculatedPricePerPassenger);
          console.log('🔍 SaleEdit - Initializing price per passenger:', {
            totalSalePrice: saleData.totalSalePrice,
            passengerCount: saleData.passengers.length,
            calculatedPricePerPassenger: calculatedPricePerPassenger
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      console.error('Fetch error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = 'Failed to load sale data';
      if (error.response?.status === 404) {
        errorMessage = 'Sale not found. The sale may have been deleted or you may not have access to it.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this sale.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get(`/api/providers?search=${providerSearch}&limit=50`);
      if (response.data.success) {
        setAvailableProviders(response.data.data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
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

  const handleInstanceUpdate = async (updatedInstance) => {
    try {
      setSaving(true);
      
      // Update the instance in the local state
      setServiceTemplateInstances(prev => 
        prev.map(instance => 
          instance.id === updatedInstance.id ? updatedInstance : instance
        )
      );
      
      // Convert back to service format for API
      const serviceData = {
        serviceId: updatedInstance.templateId,
        serviceName: updatedInstance.serviceInfo,
        priceClient: updatedInstance.cost,
        costProvider: updatedInstance.cost, // Use the stored cost value directly
        currency: updatedInstance.currency,
        quantity: 1,
        serviceDates: {
          startDate: new Date(updatedInstance.checkIn),
          endDate: new Date(updatedInstance.checkOut)
        },
        providerId: updatedInstance.provider?._id,
        notes: updatedInstance.serviceDescription || `${updatedInstance.templateName || 'Service'} - ${updatedInstance.serviceInfo}`
      };
      
      // If destination was updated, update the sale-level destination
      if (updatedInstance.destination && (updatedInstance.destination.city !== sale.destination.city || updatedInstance.destination.country !== sale.destination.country)) {
        // Update sale-level destination
        await api.put(`/api/sales/${id}`, {
          destination: {
            city: updatedInstance.destination.city,
            country: updatedInstance.destination.country,
            name: `${updatedInstance.destination.city}, ${updatedInstance.destination.country}`
          }
        });
        
        // Update local sale state
        setSale(prev => ({
          ...prev,
          destination: {
            city: updatedInstance.destination.city,
            country: updatedInstance.destination.country,
            name: `${updatedInstance.destination.city}, ${updatedInstance.destination.country}`
          }
        }));
        
        // Update all service instances to reflect the new destination
        setServiceTemplateInstances(prev => 
          prev.map(instance => ({
            ...instance,
            destination: {
              city: updatedInstance.destination.city,
              country: updatedInstance.destination.country
            }
          }))
        );
      }
      
      // Update the specific service instance (excluding destination)
      // Format providers array properly for backend
      let formattedProviders = [];
      
      if (updatedInstance.providers && updatedInstance.providers.length > 0) {
        // Check if providers have the correct structure (from backend) or are Provider objects (newly selected)
        formattedProviders = updatedInstance.providers.map((provider, providerIndex) => {
          // If provider already has the correct structure (has providerId property), use it
          if (provider.providerId && provider.costProvider !== undefined) {
            return provider;
          }
          
          // Try to find original provider data from backend to preserve documents and dates
          const originalProviderData = updatedInstance.providersData?.[providerIndex];
          
          // Otherwise, it's a Provider object that needs to be formatted
          const formattedProvider = {
            providerId: provider._id,
            costProvider: parseFloat(provider.costProvider) || 0, // Use individual provider cost
            currency: updatedInstance.currency || 'USD',
            commissionRate: 0
          };
          
          // Only include serviceProviderId if it exists
          if (provider.serviceProviderId) {
            formattedProvider.serviceProviderId = provider.serviceProviderId;
          }
          
          // Preserve documents from original provider data or provider object
          if (originalProviderData?.documents && originalProviderData.documents.length > 0) {
            formattedProvider.documents = originalProviderData.documents;
          } else if (provider.documents && provider.documents.length > 0) {
            formattedProvider.documents = provider.documents;
          }
          
          // Preserve dates from original provider data
          if (originalProviderData?.startDate) {
            formattedProvider.startDate = originalProviderData.startDate;
          }
          if (originalProviderData?.endDate) {
            formattedProvider.endDate = originalProviderData.endDate;
          }
          
          return formattedProvider;
        });
      }
      
      const updatePayload = {
        serviceName: updatedInstance.serviceInfo,
        priceClient: updatedInstance.cost,
        costProvider: updatedInstance.cost, // Use the stored cost value directly
        currency: updatedInstance.currency,
        serviceDates: {
          startDate: new Date(updatedInstance.checkIn),
          endDate: new Date(updatedInstance.checkOut)
        },
        providerId: updatedInstance.provider?._id,
        providers: formattedProviders, // Include properly formatted providers array
        notes: updatedInstance.serviceDescription || ''
      };
      
      console.log('🔧 SaleEdit - Sending update payload:', {
        updatePayload,
        providersArray: updatePayload.providers,
        providerId: updatePayload.providerId
      });
      
      
      const response = await api.patch(`/api/sales/${id}/service-instance/${updatedInstance.id}`, updatePayload);
      
      if (response.data.success) {
        setSuccess('Service updated successfully');
        toast.success('Service updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh data from backend to ensure consistency
        // Add a small delay to ensure database write is complete
        setTimeout(async () => {
          await fetchSale();
        }, 100);
      } else {
        throw new Error(response.data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service');
      toast.error('Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleInstanceDelete = async (instanceId) => {
    if (!window.confirm('Are you sure you want to remove this service?')) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Remove from local state
      const updatedInstances = serviceTemplateInstances.filter(instance => instance.id !== instanceId);
      setServiceTemplateInstances(updatedInstances);
      
      // Convert remaining instances to service format
      const services = updatedInstances.map(instance => {
        // Format providers array properly for backend
        let formattedProviders = [];
        
        if (instance.providers && instance.providers.length > 0) {
          // Check if providers have the correct structure (from backend) or are Provider objects (newly selected)
          formattedProviders = instance.providers.map(provider => {
            // If provider already has the correct structure (has providerId property), use it
            if (provider.providerId && provider.costProvider !== undefined) {
              return provider;
            }
            // Otherwise, it's a Provider object that needs to be formatted
            const formattedProvider = {
              providerId: provider._id,
              costProvider: parseFloat(provider.costProvider) || 0, // Use individual provider cost
              currency: instance.currency || 'USD',
              commissionRate: 0
            };
            
            // Only include serviceProviderId if it exists
            if (provider.serviceProviderId) {
              formattedProvider.serviceProviderId = provider.serviceProviderId;
            }
            
            return formattedProvider;
          });
        }
        
        return {
          serviceId: instance.templateId,
          serviceName: instance.serviceInfo,
          priceClient: instance.cost,
          costProvider: instance.cost, // Use the stored cost value directly
          currency: instance.currency,
          quantity: 1,
          serviceDates: {
            startDate: new Date(instance.checkIn),
            endDate: new Date(instance.checkOut)
          },
          providerId: instance.provider?._id,
          providers: formattedProviders, // Include properly formatted providers array
          notes: instance.serviceDescription || `${instance.templateName || 'Service'} - ${instance.serviceInfo}`
        };
      });
      
      // Update the sale via API
      const saleData = { services };
      
      const response = await api.put(`/api/sales/${id}`, saleData);
      
      if (response.data.success) {
        setSuccess('Service removed successfully');
        toast.success('Service removed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to remove service');
      }
    } catch (error) {
      console.error('Error removing service:', error);
      setError('Failed to remove service');
      toast.error('Failed to remove service');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Convert all instances to service format
      const services = serviceTemplateInstances.map(instance => {
        // Format providers array properly for backend
        let formattedProviders = [];
        
        if (instance.providers && instance.providers.length > 0) {
          // Check if providers have the correct structure (from backend) or are Provider objects (newly selected)
          formattedProviders = instance.providers.map((provider, providerIndex) => {
            // If provider already has the correct structure (has providerId property), use it
            if (provider.providerId && provider.costProvider !== undefined) {
              return provider;
            }
            
            // Try to find original provider data from backend to preserve documents and dates
            const originalProviderData = instance.providersData?.[providerIndex];
            
            // Otherwise, it's a Provider object that needs to be formatted
            const formattedProvider = {
              providerId: provider._id,
              costProvider: parseFloat(provider.costProvider) || 0, // Use individual provider cost
              currency: instance.currency || 'USD',
              commissionRate: 0
            };
            
            // Only include serviceProviderId if it exists
            if (provider.serviceProviderId) {
              formattedProvider.serviceProviderId = provider.serviceProviderId;
            }
            
            // Preserve documents from original provider data or provider object
            if (originalProviderData?.documents && originalProviderData.documents.length > 0) {
              formattedProvider.documents = originalProviderData.documents;
            } else if (provider.documents && provider.documents.length > 0) {
              formattedProvider.documents = provider.documents;
            }
            
            // Preserve dates from original provider data
            if (originalProviderData?.startDate) {
              formattedProvider.startDate = originalProviderData.startDate;
            }
            if (originalProviderData?.endDate) {
              formattedProvider.endDate = originalProviderData.endDate;
            }
            
            return formattedProvider;
          });
        }
        
        return {
          serviceId: instance.templateId,
          serviceName: instance.serviceInfo,
          priceClient: instance.cost,
          costProvider: instance.cost, // Use the stored cost value directly
          currency: instance.currency,
          quantity: 1,
          serviceDates: {
            startDate: new Date(instance.checkIn),
            endDate: new Date(instance.checkOut)
          },
          providerId: instance.provider?._id,
          providers: formattedProviders, // Include properly formatted providers array
          notes: instance.serviceDescription || `${instance.templateName || 'Service'} - ${instance.serviceInfo}`
        };
      });
      
      // Update passenger prices with the single price per passenger
      const updatedPassengers = passengers.map(passenger => ({
        ...passenger,
        price: pricePerPassenger
      }));

      const saleData = {
        services,
        passengers: updatedPassengers,
        destination: serviceTemplateInstances[0]?.destination || sale.destination
      };
      
      console.log('🔥 Frontend - Sending PUT request to:', `/api/sales/${id}`);
      console.log('🔥 Frontend - Request data:', JSON.stringify(saleData, null, 2));
      
      const response = await api.put(`/api/sales/${id}`, saleData);
      
      if (response.data.success) {
        setSuccess('All changes saved successfully');
        toast.success('All changes saved successfully');
        
        // Update local sale state with the response data
        if (response.data.data && response.data.data.sale) {
          setSale(response.data.data.sale);
        }
        
        setTimeout(() => {
          navigate(`/sales/${id}`);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = 'Failed to save changes';
      if (error.response?.status === 404) {
        errorMessage = 'Sale not found. Please refresh the page and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to edit this sale.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePriceModalComplete = async (price, currency) => {
    setPricePerPassenger(price);
    setPassengerCurrency(currency);
    
    // Automatically save the price changes
    try {
      setSaving(true);
      
      // Update passenger prices with the new price per passenger
      const updatedPassengers = passengers.map(passenger => ({
        ...passenger,
        price: price
      }));

      const saleData = {
        passengers: updatedPassengers
      };
      
      console.log('🔥 Frontend - Updating passenger prices:', JSON.stringify(saleData, null, 2));
      
      const response = await api.put(`/api/sales/${id}`, saleData);
      
      if (response.data.success) {
        setSuccess('Passenger prices updated successfully');
        toast.success('Passenger prices updated successfully');
        
        // Update local sale state with the response data
        if (response.data.data && response.data.data.sale) {
          setSale(response.data.data.sale);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update passenger prices');
      }
    } catch (error) {
      console.error('Error updating passenger prices:', error);
      setError('Failed to update passenger prices');
      toast.error('Failed to update passenger prices');
    } finally {
      setSaving(false);
    }
  };

  const openPriceModal = () => {
    setShowPriceModal(true);
  };

  const handleServiceAdded = (newService) => {
    // Transform the service data to match ServiceTemplateInstanceEditor expectations
    const transformedService = {
      id: newService._id || Date.now(), // Use MongoDB _id or generate a temporary one
      templateId: newService.serviceTemplateId?._id,
      templateName: newService.serviceTemplateId?.name || 'Unknown Template',
      templateCategory: newService.serviceTemplateId?.category || 'Other',
      serviceInfo: newService.serviceName,
      serviceDescription: newService.notes,
      cost: newService.priceClient,
      currency: newService.currency,
      checkIn: newService.serviceDates?.startDate,
      checkOut: newService.serviceDates?.endDate,
      provider: {
        _id: newService.providerId?._id,
        name: newService.providerId?.name || 'Unknown Provider'
      },
      destination: newService.destination || {
        city: 'Unknown',
        country: 'Unknown'
      }
    };
    
    setServiceTemplateInstances(prev => [...prev, transformedService]);
    toast.success('Service added successfully');
    setShowAddServiceModal(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-dark-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-dark-400">Loading sale data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto p-6 text-dark-100 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark-100 mb-4">Sale Not Found</h1>
          <p className="text-dark-400 mb-6">The sale you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/sales')}
            className="btn-primary"
          >
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 text-dark-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Edit Sale</h1>
          <p className="text-dark-400">Make granular edits to service template instances</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/sales/${id}`)}
            className="px-4 py-2 text-dark-300 hover:text-dark-100 border border-white/10 rounded-lg"
          >
            View Sale
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
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

      {/* Sale Info */}
      <div className="bg-dark-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Sale Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-dark-400">Sale ID:</span>
            <div className="text-dark-100 font-medium">{sale._id}</div>
          </div>
          <div>
            <span className="text-sm text-dark-400">Status:</span>
            <div className="text-dark-100 font-medium capitalize">{sale.status}</div>
          </div>
          <div>
            <span className="text-sm text-dark-400">Total Services:</span>
            <div className="text-dark-100 font-medium">{serviceTemplateInstances.length}</div>
          </div>
        </div>
      </div>

      {/* Service Template Instances */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-dark-100">Service Template Instances</h2>
            {/* <div className="text-sm text-red-400 font-medium">
              Total Cost: {sale?.saleCurrency || 'USD'} {(() => {
                // Calculate real-time total cost from current serviceTemplateInstances
                const totalCost = serviceTemplateInstances.reduce((total, instance) => {
                  if (instance.providers && instance.providers.length > 0) {
                    // Sum individual provider costs
                    return total + instance.providers.reduce((providerTotal, provider) => {
                      return providerTotal + (parseFloat(provider.costProvider) || 0);
                    }, 0);
                  }
                  // Fallback to instance cost if no providers
                  return total + (parseFloat(instance.cost) || 0);
                }, 0);
                return totalCost.toFixed(2);
              })()}
            </div> */}
          </div>
          {/* <button
            onClick={() => setShowAddServiceModal(true)}
            className="btn-secondary"
          >
            Add New Service
          </button> */}
        </div>

        {serviceTemplateInstances.length === 0 ? (
          <div className="text-center py-12 bg-dark-800 rounded-lg">
            <div className="text-dark-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <p>No services in this sale</p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="btn-primary"
            >
              Add First Service
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {serviceTemplateInstances.map((instance) => (
              <ServiceTemplateInstanceEditor
                key={instance.id}
                instance={instance}
                onUpdate={handleInstanceUpdate}
                onDelete={handleInstanceDelete}
                availableProviders={availableProviders}
                onProviderSearch={handleProviderSearch}
                isEditing={editingInstance === instance.id}
                onEditStart={() => setEditingInstance(instance.id)}
                onEditCancel={() => setEditingInstance(null)}
                getGlobalProviderCount={getGlobalProviderCount}
                saleCurrency={sale?.saleCurrency || 'USD'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Passengers Section */}
      {passengers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-dark-100">Passengers</h2>
              {/* <div className="text-sm text-green-400 font-medium">
                Total: {sale?.saleCurrency || 'USD'} {(sale?.totalSalePrice || 0).toFixed(2)}
              </div> */}
            </div>
            <button
              onClick={openPriceModal}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Prices
            </button>
          </div>
          
          <div className="bg-dark-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {passengers.map((passenger, index) => {
                // Handle both direct passenger data and nested passengerId structure
                const passengerData = passenger.passengerId || passenger;
                const name = passengerData.name || 'Unknown';
                const surname = passengerData.surname || '';
                const email = passengerData.email || '';
                const phone = passengerData.phone || '';
                const passportNumber = passengerData.passportNumber || '';
                const nationality = passengerData.nationality || '';
                
                return (
                  <div key={index} className="bg-dark-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-dark-100 mb-2">
                      {name} {surname}
                    </h4>
                    <div className="text-sm text-dark-300 space-y-1">
                      {email && <div>Email: {email}</div>}
                      {phone && <div>Phone: {phone}</div>}
                      {passportNumber && <div>Passport: {passportNumber}</div>}
                      {nationality && <div>Nationality: {nationality}</div>}
                      <div className="text-primary-400 text-xs">
                        {passenger.isMainClient ? 'Main Client' : 'Companion'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onServiceAdded={handleServiceAdded}
        saleId={id}
        existingServiceTemplateIds={sale?.services?.map(service => 
          service.serviceName || service.serviceId?.destino
        ).filter(Boolean) || []}
      />

      {/* Passenger Price Modal */}
      <PassengerPriceModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        onComplete={handlePriceModalComplete}
        currentPrice={pricePerPassenger}
        passengerCount={passengers.length}
        saleCurrency={sale?.saleCurrency || 'USD'}
      />
    </div>
  );
};

export default SaleEdit;
