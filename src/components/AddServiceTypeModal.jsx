import React, { useState } from 'react';
import api from '../utils/api';

const AddServiceTypeModal = ({ isOpen, onClose, onServiceTypeAdded }) => {
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setServiceType('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceType?.trim()) {
      setError('Service type is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Save service type to database
      const response = await api.post('/api/service-types', {
        name: serviceType.trim(),
        category: 'Other' // Default category, can be enhanced later
      });

      if (response.data.success) {
        // Pass the created service type to the parent component
        if (onServiceTypeAdded) {
          onServiceTypeAdded(response.data.data.serviceType);
        }
        
        // Reset form and close modal
        resetForm();
        onClose();
      } else {
        setError(response.data.message || 'Failed to create service type');
      }
    } catch (error) {
      console.error('Failed to create service type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create service type';
      setError(errorMessage);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark-100">Add Service Type</h2>
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

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-dark-200 mb-2">
              Service Type *
            </label>
            <input
              type="text"
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="input-field"
              placeholder="Enter service type"
              required
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
              {loading ? 'Adding...' : 'Add Service Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceTypeModal;
