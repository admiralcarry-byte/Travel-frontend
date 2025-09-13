import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CupoForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceId: '',
    totalSeats: '',
    metadata: {
      date: '',
      roomType: '',
      flightClass: '',
      providerRef: '',
      notes: ''
    },
    status: 'active'
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const flightClasses = [
    { value: '', label: 'Select flight class' },
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services?limit=100');

      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      setError('Failed to fetch services');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const metadataField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
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

    try {
      const response = await api.post('/api/cupos', formData);

      if (response.data.success) {
        setSuccess('Cupo created successfully!');
        setTimeout(() => {
          navigate('/inventory');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create cupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-dark-100">Add New Cupo</h1>
            <p className="mt-1 text-sm text-dark-300">
              Create inventory for a service with seat allocation
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
                  <label htmlFor="serviceId" className="block text-sm font-medium text-dark-200">
                    Service *
                  </label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    required
                    className="input-field mt-1"
                  >
                    <option value="">Select service</option>
                    {services.map((service, index) => (
                      <option key={service.id || service._id || `service-${index}`} value={service.id || service._id}>
                        {service.title} - {service.providerId?.name}
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-dark-100">Service Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="metadata-date" className="block text-sm font-medium text-dark-200">
                    Date *
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
                  <label htmlFor="metadata-flightClass" className="block text-sm font-medium text-dark-200">
                    Flight Class
                  </label>
                  <select
                    id="metadata-flightClass"
                    name="metadata.flightClass"
                    value={formData.metadata.flightClass}
                    onChange={handleChange}
                    className="input-field mt-1"
                  >
                    {flightClasses.map((option, index) => (
                      <option key={option.value || `flight-${index}`} value={option.value}>
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
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Cupo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CupoForm;