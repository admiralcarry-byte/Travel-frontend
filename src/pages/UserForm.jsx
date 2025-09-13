import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'seller',
    phone: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    } else {
      // Reset form when creating a new user
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'seller',
        phone: '',
        timezone: 'UTC'
      });
    }
  }, [id, isEditing]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${id}`);

      if (response.data.success) {
        const user = response.data.data.user;
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'seller',
          phone: user.phone || '',
          timezone: user.timezone || 'UTC'
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch user details');
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

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!isEditing && !formData.password) {
      setError('Password is required for new users');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        timezone: formData.timezone
      };

      // Only include password if it's provided (for new users or password changes)
      if (formData.password) {
        submitData.password = formData.password;
      }

      let response;
      if (isEditing) {
        response = await api.put(`/api/users/${id}`, submitData);
      } else {
        response = await api.post('/api/users', submitData);
      }

      if (response.data.success) {
        setSuccess(isEditing ? 'User updated successfully!' : 'User created successfully!');
        setTimeout(() => {
          navigate('/users');
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const dismissError = () => {
    setError('');
  };

  const dismissSuccess = () => {
    setSuccess('');
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="icon-container">
                <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-dark-300 text-lg font-medium ml-4">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            {isEditing ? 'Update user information and permissions' : 'Add a new user to the system'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="notification">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container bg-error-500">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-error-400 font-medium text-lg">{error}</span>
              </div>
              <button
                onClick={dismissError}
                className="text-error-400 hover:text-error-300 transition-colors p-1"
                aria-label="Dismiss error message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="notification">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="icon-container bg-success-500">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-success-400 font-medium text-lg">{success}</span>
              </div>
              <button
                onClick={dismissSuccess}
                className="text-success-400 hover:text-success-300 transition-colors p-1"
                aria-label="Dismiss success message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter username"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter email address"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Password {!isEditing && '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  required={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Confirm Password {!isEditing && '*'}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Confirm password"
                  required={!isEditing}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter first name"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter last name"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Role and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-4">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter phone number"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-4">
                Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                  </span>
                ) : (
                  isEditing ? 'Update User' : 'Create User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;