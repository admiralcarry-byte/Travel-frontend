import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import ProviderCreationModal from './ProviderCreationModal';
import AddServiceTypeModal from './AddServiceTypeModal';
import ServiceTypeService from '../services/serviceTypeService';

const EditCupoModal = ({ 
  cupo, 
  isOpen, 
  onClose, 
  onSave, 
  saving = false 
}) => {
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
      providerRef: '',
      notes: ''
    },
    status: 'active'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Service Template management state
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
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

  // New Service entry state
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [showServiceDescriptionModal, setShowServiceDescriptionModal] = useState(false);
  const [serviceCard, setServiceCard] = useState(null);

  // Service Type editing state
  const [isEditingServiceTypeName, setIsEditingServiceTypeName] = useState(false);
  const [editingServiceTypeName, setEditingServiceTypeName] = useState('');
  const [selectedServiceTypeForEdit, setSelectedServiceTypeForEdit] = useState(null);

  // Service Description modal state
  const [isEditingServiceType, setIsEditingServiceType] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'sold_out', label: 'Sold Out' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'U$' },
    { value: 'ARS', label: 'AR$' }
  ];

  // Initialize form data when cupo changes
  useEffect(() => {
    if (cupo && isOpen) {
      setFormData({
        serviceTemplateId: cupo.serviceId?.typeId?._id || cupo.serviceId?.typeId?.id || '',
        providerId: cupo.serviceId?.providerId?._id || cupo.serviceId?.providerId?.id || '',
        totalSeats: cupo.totalSeats || '',
        metadata: {
          date: cupo.metadata?.date ? new Date(cupo.metadata.date).toISOString().split('T')[0] : '',
          completionDate: cupo.metadata?.completionDate ? new Date(cupo.metadata.completionDate).toISOString().split('T')[0] : '',
          roomType: cupo.metadata?.roomType || '',
          flightName: cupo.metadata?.flightName || '',
          destination: cupo.metadata?.destination || '',
          value: cupo.metadata?.value || '',
          currency: cupo.metadata?.currency || 'USD',
          providerRef: cupo.metadata?.providerRef || '',
          notes: cupo.metadata?.notes || ''
        },
        status: cupo.status || 'active'
      });

      // Create service card from existing cupo data
      if (cupo.serviceId) {
        const existingServiceCard = {
          id: `existing_${cupo.serviceId._id || cupo.serviceId.id}`,
          type: cupo.serviceId?.typeId?.name || cupo.serviceId?.type || 'Unknown',
          description: cupo.serviceId?.description || 'No description available'
        };
        setServiceCard(existingServiceCard);
      }
    }
  }, [cupo, isOpen]);

  // Fetch service types and providers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchServiceTypes();
      fetchProviders();
    } else {
      // Reset service card when modal closes
      setServiceCard(null);
    }
  }, [isOpen]);

  const fetchServiceTypes = async () => {
    try {
      setServiceLoading(true);
      const response = await ServiceTypeService.getAllServiceTypes({ active: true });
      if (response.success) {
        setServiceTypes(response.data.serviceTypes);
      }
    } catch (error) {
      console.error('Failed to fetch service types:', error);
      setError('Failed to fetch service types');
    } finally {
      setServiceLoading(false);
    }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const metadataField = name.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else if (name === 'serviceTemplateId') {
      // Handle service template selection
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Trigger service description modal for new service type
      if (value) {
        const selectedServiceType = serviceTypes.find(st => st._id === value);
        if (selectedServiceType) {
          handleServiceTypeSelected(selectedServiceType);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData = {
        totalSeats: parseInt(formData.totalSeats),
        status: formData.status,
        metadata: formData.metadata
      };

      // If service information has changed, update the service as well
      if (formData.serviceTemplateId && formData.serviceTemplateId !== cupo.serviceId?.typeId?._id) {
        // Update the service with new type information
        const serviceUpdateData = {
          typeId: formData.serviceTemplateId,
          type: serviceTypes.find(st => st._id === formData.serviceTemplateId)?.name || cupo.serviceId?.type
        };
        
        await api.put(`/api/services/${cupo.serviceId._id}`, serviceUpdateData);
      }

      // If provider has changed, update the service provider as well
      if (formData.providerId && formData.providerId !== cupo.serviceId?.providerId?._id) {
        const serviceUpdateData = {
          providerId: formData.providerId
        };
        
        await api.put(`/api/services/${cupo.serviceId._id}`, serviceUpdateData);
      }

      const response = await api.put(`/api/cupos/${cupo._id}`, updateData);
      
      if (response.data.success) {
        setSuccess('Cupo updated successfully!');
        setTimeout(() => {
          onSave(response.data.data.cupo);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update cupo:', error);
      setError(error.response?.data?.message || 'Failed to update cupo');
    }
  };

  const handleProviderCreated = (newProvider) => {
    setProviders(prev => [...prev, newProvider]);
    setFormData(prev => ({
      ...prev,
      providerId: newProvider._id
    }));
    setShowProviderModal(false);
  };

  const handleServiceTypeAdded = (newServiceType) => {
    setServiceTypes(prev => [...prev, newServiceType]);
    setIsServiceTypeModalOpen(false);
  };

  const addService = async () => {
    if (serviceInformation?.trim()) {
      try {
        const requestData = {
          name: serviceInformation.trim(),
          description: serviceInformation?.trim() || '',
          category: 'Other'
        };
        
        console.log('Creating service template with data:', requestData);
        
        const response = await api.post('/api/service-templates', requestData);
        
        if (response.data.success) {
          // Refresh service types to ensure real-time sync
          await fetchServiceTypes();
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

  const handleServiceCardRemove = () => {
    setServiceCard(null);
    setFormData(prev => ({
      ...prev,
      serviceTemplateId: ''
    }));
  };

  const handleEditServiceTypeName = (serviceType) => {
    setSelectedServiceTypeForEdit(serviceType);
    setEditingServiceTypeName(serviceType.name);
    setIsEditingServiceTypeName(true);
  };

  const handleSaveServiceTypeName = async () => {
    if (selectedServiceTypeForEdit && editingServiceTypeName.trim()) {
      await updateServiceTypeName(selectedServiceTypeForEdit._id, editingServiceTypeName.trim());
      setIsEditingServiceTypeName(false);
      setSelectedServiceTypeForEdit(null);
      setEditingServiceTypeName('');
    }
  };

  const handleCancelEditServiceTypeName = () => {
    setIsEditingServiceTypeName(false);
    setSelectedServiceTypeForEdit(null);
    setEditingServiceTypeName('');
  };

  const updateServiceTypeName = async (serviceTypeId, newName) => {
    try {
      const response = await ServiceTypeService.updateServiceType(serviceTypeId, { name: newName });
      if (response.success) {
        // Update local state
        setServiceTypes(prev => prev.map(st => 
          st._id === serviceTypeId ? { ...st, name: newName } : st
        ));
        
        // Update form data if this service type is selected
        if (formData.serviceTemplateId === serviceTypeId) {
          setFormData(prev => ({
            ...prev,
            serviceTemplateId: serviceTypeId
          }));
        }
        
        // Update service card if it exists
        if (serviceCard) {
          setServiceCard(prev => ({
            ...prev,
            type: newName
          }));
        }
      }
    } catch (error) {
      console.error('Failed to update service type name:', error);
      setError('Failed to update service type name');
    }
  };

  const openServiceTypeModal = () => {
    setIsServiceTypeModalOpen(true);
  };

  const handleServiceTypeSelect = (serviceType) => {
    setServiceInformation(serviceType.name);
    setShowServiceTypeDropdown(false);
  };

  const handleServiceTypeSelected = (serviceType) => {
    setSelectedServiceType(serviceType);
    setServiceName('');
    setServiceDescription('');
    setIsEditingServiceType(false);
    setShowServiceDescriptionModal(true);
  };

  const toggleServiceTypeDropdown = () => {
    setShowServiceTypeDropdown(!showServiceTypeDropdown);
  };

  const updateServiceType = async (serviceTypeId, newDescription) => {
    try {
      const response = await ServiceTypeService.updateServiceType(serviceTypeId, { 
        description: newDescription 
      });
      if (response.success) {
        // Update local state
        setServiceTypes(prev => prev.map(st => 
          st._id === serviceTypeId ? { ...st, description: newDescription } : st
        ));
      }
    } catch (error) {
      console.error('Failed to update service type description:', error);
      setError('Failed to update service type description');
    }
  };

  const handleServiceDescriptionComplete = () => {
    if (selectedServiceType && serviceDescription.trim()) {
      if (isEditingServiceType) {
        // Update existing service type
        updateServiceType(selectedServiceType._id, serviceDescription.trim());
      } else {
        // Create new service card
        const newServiceCard = {
          id: Date.now(),
          type: selectedServiceType.name,
          description: serviceDescription.trim()
        };
        setServiceCard(newServiceCard);
        
        // Update form data with the new service information
        setFormData(prev => ({
          ...prev,
          serviceTemplateId: selectedServiceType._id
        }));
      }
      setShowServiceDescriptionModal(false);
      setSelectedServiceType(null);
      setServiceName('');
      setServiceDescription('');
      setIsEditingServiceType(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 notranslate" translate="no">
      <div className="bg-dark-800/95 backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10">
          <h1 className="text-2xl font-bold text-dark-100">Edit Cupo</h1>
          <p className="mt-1 text-sm text-dark-300">
            Update cupo information and seat allocation
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
                      onClick={() => setShowAddServiceModal(true)}
                      className="text-xs text-primary-400 hover:text-primary-300 underline"
                    >
                      + Add New Service
                    </button>
                </div>
                <div className="relative">
                  {isEditingServiceTypeName ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={editingServiceTypeName}
                        onChange={(e) => setEditingServiceTypeName(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter service type name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveServiceTypeName();
                          } else if (e.key === 'Escape') {
                            handleCancelEditServiceTypeName();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveServiceTypeName}
                        className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded"
                        title="Save changes"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditServiceTypeName}
                        className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
                        title="Cancel editing"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
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
                        {serviceTypes.map((serviceType, index) => (
                          <option key={serviceType._id || `service-${index}`} value={serviceType._id}>
                            {serviceType.name}
                          </option>
                        ))}
                      </select>
                      {/* Edit button positioned to the left of the dropdown arrow */}
                      {formData.serviceTemplateId && (
                        <button
                          type="button"
                          onClick={() => {
                            const selectedServiceType = serviceTypes.find(st => st._id === formData.serviceTemplateId);
                            if (selectedServiceType) {
                              handleEditServiceTypeName(selectedServiceType);
                            }
                          }}
                          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-300"
                          title="Edit selected service type"
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Service Card Display */}
              {serviceCard && (
                <div className="bg-dark-700/50 border border-white/10 rounded-lg p-4 notranslate">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary-400 mb-2">Service Type: {serviceCard.type}</p>
                      <p className="text-xs text-dark-300">{serviceCard.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleServiceCardRemove}
                      className="text-dark-400 hover:text-dark-200 ml-2"
                      title="Remove service"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="space-y-4 notranslate" translate="no">
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
                  className="input-field mt-1 notranslate"
                  translate="no"
                >
                  {currencyOptions.map((option, index) => (
                    <option key={option.value || `currency-${index}`} value={option.value} className="notranslate" translate="no">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md transition-all duration-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Cupo'}
            </button>
          </div>
        </form>

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

        {/* Add Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] notranslate" translate="no">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-dark-100 mb-4">Add New Service Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={serviceInformation}
                    onChange={(e) => setServiceInformation(e.target.value)}
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
                              onClick={() => handleServiceTypeSelected(serviceType)}
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

        {/* Service Description Modal */}
        {showServiceDescriptionModal && selectedServiceType && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000] notranslate" translate="no">
            <div className="bg-dark-800/95 backdrop-blur-md rounded-lg p-6 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-dark-100">Service Description</h2>
                <button
                  onClick={() => {
                    setShowServiceDescriptionModal(false);
                    setSelectedServiceType(null);
                    setServiceName('');
                    setServiceDescription('');
                  }}
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
                    Service Type
                  </label>
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                    <p className="text-primary-300 font-medium">{selectedServiceType.name}</p>
                  </div>
                </div>


                <div>
                  <label htmlFor="serviceDescription" className="block text-sm font-medium text-dark-200 mb-2">
                    Service Description *
                  </label>
                  <textarea
                    id="serviceDescription"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="input-field"
                    placeholder="Enter service description..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowServiceDescriptionModal(false);
                    setSelectedServiceType(null);
                    setServiceName('');
                    setServiceDescription('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleServiceDescriptionComplete}
                  disabled={!serviceDescription.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCupoModal;
