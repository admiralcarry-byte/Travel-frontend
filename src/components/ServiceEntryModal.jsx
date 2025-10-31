import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const ServiceEntryModal = ({ isOpen, onClose, serviceType, onServiceAdded }) => {
  const [serviceDescription, setServiceDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setServiceDescription('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceDescription?.trim()) {
      setError('Service description is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create service card data
      const serviceCard = {
        id: `service_${serviceType._id}_${Date.now()}`,
        serviceTypeId: serviceType._id,
        serviceTypeName: serviceType.name,
        serviceDescription: serviceDescription.trim(),
        timestamp: new Date().toISOString()
      };

      // Pass the service card to parent component
      if (onServiceAdded) {
        onServiceAdded(serviceCard);
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create service:', error);
      setError('Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-dark-800/95 backdrop-blur-md rounded-lg p-6 w-full max-w-md mx-auto shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark-100">Enter Service Details</h2>
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

          {/* Service Type Display */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <h4 className="font-medium text-dark-100">Service Type: {serviceType?.name}</h4>
          </div>


          {/* Service Description */}
          <div>
            <label htmlFor="serviceDescription" className="block text-sm font-medium text-dark-200 mb-2">
              Service Description *
            </label>
            <textarea
              id="serviceDescription"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="input-field w-full h-24 resize-none"
              placeholder="Enter service description..."
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
              {loading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ServiceEntryModal;
