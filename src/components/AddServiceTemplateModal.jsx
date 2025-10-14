import React, { useState } from 'react';
import api from '../utils/api';

const AddServiceTemplateModal = ({ isOpen, onClose, onServiceTemplateAdded }) => {
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setServiceName('');
    setServiceDescription('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceName?.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/api/service-templates', {
        name: serviceName.trim(),
        description: serviceDescription?.trim() || '',
        category: 'Other'
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

          {/* Service Description */}
          <div>
            <label htmlFor="serviceDescription" className="block text-sm font-medium text-dark-200 mb-2">
              Description
            </label>
            <textarea
              id="serviceDescription"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="input-field"
              placeholder="Enter service description"
              rows={3}
              disabled={loading}
            />
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
    </div>
  );
};

export default AddServiceTemplateModal;
