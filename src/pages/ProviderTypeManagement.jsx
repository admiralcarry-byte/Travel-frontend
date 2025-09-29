import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProviderTypeManagement = () => {
  const navigate = useNavigate();
  const [providerTypes, setProviderTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchProviderTypes();
  }, []);

  const fetchProviderTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/provider-types');
      
      if (response.data.success) {
        setProviderTypes(response.data.data.providerTypes);
      }
    } catch (error) {
      setError('Failed to fetch provider types');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/provider-types', formData);
      
      if (response.data.success) {
        setSuccess('Provider type created successfully!');
        setFormData({ name: '', description: '' });
        fetchProviderTypes();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create provider type');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type._id);
    setEditFormData({
      name: type.name,
      description: type.description || '',
      isActive: type.isActive
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/api/provider-types/${editingType}`, editFormData);
      
      if (response.data.success) {
        setSuccess('Provider type updated successfully!');
        setEditingType(null);
        fetchProviderTypes();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update provider type');
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this provider type?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/provider-types/${typeId}`);
      
      if (response.data.success) {
        setSuccess('Provider type deleted successfully!');
        fetchProviderTypes();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete provider type');
    }
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setEditFormData({ name: '', description: '', isActive: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading provider types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-100 mb-2">Provider Type Management</h1>
            <p className="text-dark-300">Manage provider types for the system</p>
          </div>
          <button
            onClick={() => navigate('/providers')}
            className="btn-secondary"
          >
            ← Back to Providers
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="notification bg-error-500/10 border border-error-500/20 text-error-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="notification bg-success-500/10 border border-success-500/20 text-success-400 mb-6">
            {success}
          </div>
        )}

        {/* Add New Provider Type Form */}
        <div className="card-glass p-6 mb-8">
          <h2 className="text-xl font-semibold text-dark-100 mb-4">Add New Provider Type</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-2">
                  Provider Type Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter provider type name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
              >
                Save Provider Type
              </button>
            </div>
          </form>
        </div>

        {/* Provider Types List */}
        <div className="card-glass p-6">
          <h2 className="text-xl font-semibold text-dark-100 mb-4">Existing Provider Types</h2>
          
          {providerTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-dark-300">No provider types found. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {providerTypes.map((type) => (
                <div key={type._id} className="bg-dark-700/50 rounded-lg p-4 border border-white/10">
                  {editingType === type._id ? (
                    // Edit Form
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            required
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditInputChange}
                            className="input-field"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={editFormData.isActive}
                              onChange={handleEditInputChange}
                              className="rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-sm text-dark-200">Active</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md transition-all duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-dark-100">{type.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            type.isActive 
                              ? 'bg-success-500/20 text-success-400 border border-success-500/30' 
                              : 'bg-error-500/20 text-error-400 border border-error-500/30'
                          }`}>
                            {type.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {type.description && (
                          <p className="text-sm text-dark-300 mt-1">{type.description}</p>
                        )}
                        <p className="text-xs text-dark-400 mt-1">
                          Created: {new Date(type.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="px-3 py-1 text-sm bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/30 rounded-md transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(type._id)}
                          className="px-3 py-1 text-sm bg-error-500/20 text-error-400 hover:bg-error-500/30 border border-error-500/30 rounded-md transition-all duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderTypeManagement;