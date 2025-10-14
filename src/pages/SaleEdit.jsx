import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ServiceTemplateInstanceEditor from '../components/ServiceTemplateInstanceEditor';
import AddServiceModal from '../components/AddServiceModal';
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
  
  // Editing states
  const [editingInstance, setEditingInstance] = useState(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSale();
      fetchProviders();
    }
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/sales/${id}`);
      
      if (response.data.success) {
        const saleData = response.data.data.sale;
        setSale(saleData);
        
        // Convert services to service template instances format
        const instances = saleData.services.map((service, index) => ({
          id: service._id || service.serviceId?._id || `instance_${index}`, // Use actual database ID
          templateId: service.serviceTemplateId || service.serviceId,
          templateName: service.serviceName || 'Unknown Service',
          templateCategory: service.serviceId?.type || 'General',
          serviceInfo: service.serviceName || 'Unknown Service',
          serviceDescription: service.notes || service.serviceId?.description || '',
          checkIn: service.serviceDates?.startDate ? new Date(service.serviceDates.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          checkOut: service.serviceDates?.endDate ? new Date(service.serviceDates.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          cost: service.priceClient || 0,
          currency: service.currency || 'USD',
          provider: service.providerId || null, // Backend populates this with full provider object
          providers: service.providers || [], // Include the providers array from backend
          providersData: service.providers || [], // Store original provider data structure from backend
          destination: {
            city: saleData.destination?.city || '',
            country: saleData.destination?.country || ''
          }
        }));
        
        setServiceTemplateInstances(instances);
        setPassengers(saleData.passengers || []);
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      setError('Failed to load sale data');
      toast.error('Failed to load sale data');
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
    // Debounce the search
    setTimeout(() => {
      fetchProviders();
    }, 300);
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
        costProvider: updatedInstance.cost * 0.8,
        currency: updatedInstance.currency,
        quantity: 1,
        serviceDates: {
          startDate: new Date(updatedInstance.checkIn),
          endDate: new Date(updatedInstance.checkOut)
        },
        providerId: updatedInstance.provider?._id,
        notes: `Service: ${updatedInstance.templateName} - ${updatedInstance.serviceInfo}`
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
        formattedProviders = updatedInstance.providers.map(provider => {
          // If provider already has the correct structure (has providerId property), use it
          if (provider.providerId && provider.costProvider !== undefined) {
            return provider;
          }
          // Otherwise, it's a Provider object that needs to be formatted
          const formattedProvider = {
            providerId: provider._id,
            costProvider: updatedInstance.cost * 0.8, // Default cost calculation
            currency: updatedInstance.currency || 'USD',
            commissionRate: 0
          };
          
          // Only include serviceProviderId if it exists
          if (provider.serviceProviderId) {
            formattedProvider.serviceProviderId = provider.serviceProviderId;
          }
          
          return formattedProvider;
        });
      }
      
      const updatePayload = {
        serviceName: updatedInstance.serviceInfo,
        priceClient: updatedInstance.cost,
        costProvider: updatedInstance.cost * 0.8,
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
              costProvider: instance.cost * 0.8, // Default cost calculation
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
          costProvider: instance.cost * 0.8,
          currency: instance.currency,
          quantity: 1,
          serviceDates: {
            startDate: new Date(instance.checkIn),
            endDate: new Date(instance.checkOut)
          },
          providerId: instance.provider?._id,
          providers: formattedProviders, // Include properly formatted providers array
          notes: instance.serviceDescription || `Service: ${instance.templateName} - ${instance.serviceInfo}`
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
          formattedProviders = instance.providers.map(provider => {
            // If provider already has the correct structure (has providerId property), use it
            if (provider.providerId && provider.costProvider !== undefined) {
              return provider;
            }
            // Otherwise, it's a Provider object that needs to be formatted
            const formattedProvider = {
              providerId: provider._id,
              costProvider: instance.cost * 0.8, // Default cost calculation
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
          costProvider: instance.cost * 0.8,
          currency: instance.currency,
          quantity: 1,
          serviceDates: {
            startDate: new Date(instance.checkIn),
            endDate: new Date(instance.checkOut)
          },
          providerId: instance.provider?._id,
          providers: formattedProviders, // Include properly formatted providers array
          notes: instance.serviceDescription || `Service: ${instance.templateName} - ${instance.serviceInfo}`
        };
      });
      
      const saleData = {
        services,
        passengers,
        destination: serviceTemplateInstances[0]?.destination || sale.destination
      };
      
      const response = await api.put(`/api/sales/${id}`, saleData);
      
      if (response.data.success) {
        setSuccess('All changes saved successfully');
        toast.success('All changes saved successfully');
        setTimeout(() => {
          navigate(`/sales/${id}`);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Failed to save changes');
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-lg font-semibold text-dark-100">Service Template Instances</h2>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="btn-secondary"
          >
            Add New Service
          </button>
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Passengers Section */}
      {passengers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Passengers</h2>
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
    </div>
  );
};

export default SaleEdit;
