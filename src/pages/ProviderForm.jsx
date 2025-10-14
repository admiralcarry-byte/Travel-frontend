import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProviderForm = () => {
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

  const navigate = useNavigate();

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const dismissError = () => {
    setError('');
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactInfo.address.')) {
      const addressField = name.split('.')[2];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          address: {
            ...prev.contactInfo.address,
            [addressField]: value
          }
        }
      }));
    } else if (name.startsWith('contactInfo.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number length
    if (formData.contactInfo.phone.length > 20) {
      setError('Phone number cannot exceed 20 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/providers', formData);

      if (response.data.success) {
        setSuccess('Provider created successfully!');
        setTimeout(() => {
          navigate('/providers');
        }, 2000);
      }
    } catch (error) {
      const errorResponse = error.response?.data;
      
      if (errorResponse?.message) {
        // Handle specific validation errors
        if (errorResponse.message.includes('email')) {
          setError('Please enter a valid email address. Make sure to include the domain extension (e.g., .com, .org)');
        } else if (errorResponse.message.includes('phone')) {
          setError('Please enter a valid phone number');
        } else if (errorResponse.message.includes('name')) {
          setError('Please enter a valid provider name');
        } else if (errorResponse.message.includes('type')) {
          setError('Please select a valid provider type');
        } else if (errorResponse.message.includes('required')) {
          setError('Please fill in all required fields');
        } else {
          setError(errorResponse.message);
        }
      } else if (error.code === 'ECONNREFUSED') {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.response?.status === 400) {
        setError('Please check your input and try again. Make sure all required fields are filled correctly.');
      } else if (error.response?.status === 401) {
        setError('You are not authorized to perform this action. Please log in again.');
      } else if (error.response?.status === 500) {
        setError('Server error occurred. Please try again later or contact support.');
      } else {
        setError('Failed to create provider. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Add New Provider</h1>
        <p className="mt-1 text-sm text-dark-400">
          Create a new service provider (hotel, airline, transfer, excursion, or insurance)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                  <button
                    onClick={dismissError}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-500/10"
                    title="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

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
                onClick={() => navigate('/providers')}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Provider'}
              </button>
            </div>
          </form>
    </div>
  );
};

export default ProviderForm;