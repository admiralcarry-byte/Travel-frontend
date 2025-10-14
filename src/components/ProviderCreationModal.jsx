import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ProviderCreationModal = ({ isOpen, onClose, onProviderCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          address: {
            ...prev.contactInfo.address,
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/providers', formData);
      
      if (response.data.success) {
        setSuccess('Provider created successfully!');
        onProviderCreated(response.data.data.provider);
        
        // Reset form
        setFormData({
          name: '',
          type: '',
          description: '',
          contactInfo: {
            phone: '',
            email: '',
            website: '',
            address: {
              street: '',
              city: '',
              state: '',
              country: '',
              zipCode: ''
            }
          }
        });
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create provider');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      type: '',
      description: '',
      contactInfo: {
        phone: '',
        email: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      }
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up"
      onClick={handleClose}
    >
      <div 
        className="bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-100">Add New Provider</h2>
            <button
              onClick={handleClose}
              className="text-dark-400 hover:text-dark-200 transition-colors p-2 hover:bg-dark-700/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-200">
                  Provider Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter provider name"
                />
              </div>

            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-dark-200">
                Notas/Descripción
              </label>
              <p className="text-sm text-dark-400 mb-2">
                Include any additional notes or information about the provider.
              </p>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                placeholder="Enter provider description and additional information"
              />
            </div>

          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-100">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactInfo-phone" className="block text-sm font-medium text-dark-200">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="contactInfo-phone"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label htmlFor="contactInfo-email" className="block text-sm font-medium text-dark-200">
                  Email Address
                </label>
                <input
                  type="email"
                  id="contactInfo-email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactInfo-website" className="block text-sm font-medium text-dark-200">
                Website
              </label>
              <input
                type="url"
                id="contactInfo-website"
                name="contactInfo.website"
                value={formData.contactInfo.website}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                placeholder="Enter website URL (e.g., https://example.com)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactInfo-address-street" className="block text-sm font-medium text-dark-200">
                  Street Address
                </label>
                <input
                  type="text"
                  id="contactInfo-address-street"
                  name="contactInfo.address.street"
                  value={formData.contactInfo.address.street}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label htmlFor="contactInfo-address-city" className="block text-sm font-medium text-dark-200">
                  City
                </label>
                <input
                  type="text"
                  id="contactInfo-address-city"
                  name="contactInfo.address.city"
                  value={formData.contactInfo.address.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label htmlFor="contactInfo-address-state" className="block text-sm font-medium text-dark-200">
                  State/Province
                </label>
                <input
                  type="text"
                  id="contactInfo-address-state"
                  name="contactInfo.address.state"
                  value={formData.contactInfo.address.state}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter state or province"
                />
              </div>

              <div>
                <label htmlFor="contactInfo-address-country" className="block text-sm font-medium text-dark-200">
                  Country
                </label>
                <input
                  type="text"
                  id="contactInfo-address-country"
                  name="contactInfo.address.country"
                  value={formData.contactInfo.address.country}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter country"
                />
              </div>

              <div>
                <label htmlFor="contactInfo-address-zipCode" className="block text-sm font-medium text-dark-200">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  id="contactInfo-address-zipCode"
                  name="contactInfo.address.zipCode"
                  value={formData.contactInfo.address.zipCode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50"
                  placeholder="Enter ZIP or postal code"
                />
              </div>
            </div>
          </div>


          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Creating...' : 'Create Provider'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderCreationModal;