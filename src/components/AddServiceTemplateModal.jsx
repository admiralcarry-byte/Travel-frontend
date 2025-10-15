import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AddServiceTypeModal from './AddServiceTypeModal';
import ServiceTypeService from '../services/serviceTypeService';

const AddServiceTemplateModal = ({ isOpen, onClose, onServiceTemplateAdded }) => {
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);

  const resetForm = () => {
    setServiceName('');
    setServiceType('');
    setError('');
    setShowServiceTypeDropdown(false);
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
    setServiceTypes(prev => {
      const exists = prev.some(st => st._id === newServiceType._id);
      if (!exists) {
        return [...prev, newServiceType];
      }
      return prev;
    });
    setServiceType(newServiceType.name);
    setIsServiceTypeModalOpen(false);
    setShowServiceTypeDropdown(false);
  };

  const openServiceTypeModal = () => {
    setIsServiceTypeModalOpen(true);
  };

  const handleServiceTypeSelect = (selectedServiceType) => {
    setServiceType(selectedServiceType.name);
    setShowServiceTypeDropdown(false);
  };

  const toggleServiceTypeDropdown = () => {
    setShowServiceTypeDropdown(!showServiceTypeDropdown);
  };

  useEffect(() => {
    if (isOpen) {
      fetchServiceTypes();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceName?.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Find the selected service type ID
      const selectedServiceType = serviceTypes.find(st => st.name === serviceType);
      const serviceTypeId = selectedServiceType ? selectedServiceType._id : null;

      const response = await api.post('/api/service-templates', {
        name: serviceName.trim(),
        description: serviceType?.trim() || '',
        category: 'Other',
        serviceType: serviceTypeId
      });
      
      if (response.data.success) {
        // Notify parent component about the new service template
        if (onServiceTemplateAdded) {
          onServiceTemplateAdded(response.data.data.serviceTemplate);
        }
        
        // Reset form and close modal
        resetForm();
        onClose();
      } else {
        setError(response.data.message || 'Failed to create service template');
      }
    } catch (error) {
      console.error('Failed to create service template:', error);
      setError(error.response?.data?.message || 'Failed to create service template');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark-100">Add New Service Template</h2>
          <button
            onClick={handleClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Service Name */}
          <div>
            <label htmlFor="serviceName" className="block text-sm font-medium text-dark-200 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="input-field"
              placeholder="Enter service name"
              required
              disabled={loading}
            />
          </div>

          {/* Service Type */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="serviceType" className="block text-sm font-medium text-dark-200">
                Service Type
              </label>
              <button
                type="button"
                onClick={openServiceTypeModal}
                className="text-primary-400 hover:text-primary-300 transition-colors"
                title="Add new service type"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <div
                className="input-field cursor-pointer flex items-center justify-between"
                onClick={toggleServiceTypeDropdown}
              >
                <span className={serviceType ? 'text-dark-100' : 'text-dark-400'}>
                  {serviceType || 'Select or enter service type'}
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
                        onClick={() => handleServiceTypeSelect(serviceTypeItem)}
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
              
              {serviceType && (
                <div className="absolute inset-y-0 right-8 flex items-center pr-3">
                  <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                    {serviceType}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Add Service Type Modal */}
      <AddServiceTypeModal
        isOpen={isServiceTypeModalOpen}
        onClose={() => setIsServiceTypeModalOpen(false)}
        onServiceTypeAdded={handleServiceTypeAdded}
      />
    </div>
  );
};

export default AddServiceTemplateModal;
