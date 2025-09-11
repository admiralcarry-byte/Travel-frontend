import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dob: '',
    email: '',
    phone: '',
    passportNumber: '',
    nationality: '',
    expirationDate: ''
  });
  const [passportImage, setPassportImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Your email format is incorrect. Please enter it in the format kevin@gmail.com';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    
    // Remove all non-digit characters except + at the beginning
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with + and has 10-15 digits, or just has 10-15 digits
    const phoneRegex = /^(\+?[1-9]\d{9,14})$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      return 'Your phone number format is incorrect. Please enter a valid phone number (10-15 digits)';
    }
    
    return '';
  };

  const validateName = (name, fieldName) => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!name) return `${fieldName} is required`;
    if (!nameRegex.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    if (name.length < 2) return `${fieldName} must be at least 2 characters long`;
    return '';
  };

  const validatePassportNumber = (passportNumber) => {
    if (!passportNumber) return 'Passport number is required';
    if (passportNumber.length < 3) return 'Passport number must be at least 3 characters long';
    if (passportNumber.length > 20) return 'Passport number cannot exceed 20 characters';
    return '';
  };

  const validateNationality = (nationality) => {
    const nationalityRegex = /^[a-zA-Z\s\-']+$/;
    if (!nationality) return 'Nationality is required';
    if (!nationalityRegex.test(nationality)) return 'Nationality can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const validateDate = (date, fieldName) => {
    if (!date) return `${fieldName} is required`;
    
    // Handle different date formats
    let dateObj;
    if (typeof date === 'string') {
      // Check if it's in MM/DD/YYYY format
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          // Convert MM/DD/YYYY to YYYY-MM-DD for proper parsing
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2];
          dateObj = new Date(`${year}-${month}-${day}`);
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) return `Please enter a valid ${fieldName.toLowerCase()}`;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (fieldName === 'Date of Birth') {
      if (dateObj >= today) return 'Date of birth must be in the past';
      const age = today.getFullYear() - dateObj.getFullYear();
      if (age > 120) return 'Please enter a valid date of birth';
    } else if (fieldName === 'Passport Expiration Date') {
      if (dateObj <= today) return 'Passport expiration date must be in the future';
    }
    
    return '';
  };

  const validateForm = () => {
    const errors = {};
    
    errors.name = validateName(formData.name, 'First Name');
    errors.surname = validateName(formData.surname, 'Last Name');
    errors.email = validateEmail(formData.email);
    errors.phone = validatePhone(formData.phone);
    errors.dob = validateDate(formData.dob, 'Date of Birth');
    errors.passportNumber = validatePassportNumber(formData.passportNumber);
    errors.nationality = validateNationality(formData.nationality);
    errors.expirationDate = validateDate(formData.expirationDate, 'Passport Expiration Date');
    
    // Remove empty error messages
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });
    
    // Debug logging
    console.log('Form data:', formData);
    console.log('Validation errors:', errors);
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrExtraction = async () => {
    if (!passportImage) {
      setError('Please upload a passport image first');
      return;
    }

    setOcrLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('passportImage', passportImage);

      const response = await axios.post('http://localhost:5000/api/clients/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const extractedData = response.data.data.extractedData;
        const validation = response.data.data.validation;

        // Log OCR results to console
        console.log('=== OCR EXTRACTION RESULTS ===');
        console.log('Full Response:', response.data);
        console.log('Extracted Data:', extractedData);
        console.log('Validation:', validation);
        console.log('Confidence:', validation.confidence + '%');
        console.log('Errors:', validation.errors);
        console.log('==============================');

        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          name: extractedData.name || prev.name,
          surname: extractedData.surname || prev.surname,
          passportNumber: extractedData.passportNumber || prev.passportNumber,
          nationality: extractedData.nationality || prev.nationality,
          dob: extractedData.dob || prev.dob,
          expirationDate: extractedData.expirationDate || prev.expirationDate
        }));

        setSuccess(`OCR extraction completed with ${validation.confidence}% confidence`);
        
        if (validation.errors.length > 0) {
          setError(`Some fields could not be extracted: ${validation.errors.join(', ')}`);
        }
      }
    } catch (error) {
      // Log OCR error to console
      console.log('=== OCR EXTRACTION ERROR ===');
      console.log('Error:', error);
      console.log('Error Response:', error.response?.data);
      console.log('Error Message:', error.response?.data?.message || 'OCR extraction failed');
      console.log('============================');
      
      setError(error.response?.data?.message || 'OCR extraction failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate form before submission
    const errors = validateForm();
    console.log('Validation errors found:', errors);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct the errors below before submitting');
      console.log('Setting validation errors:', errors);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/clients', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess('Client created successfully!');
        setTimeout(() => {
          navigate('/clients');
        }, 2000);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          // Map backend error messages to field names
          if (err.includes('email')) backendErrors.email = err;
          else if (err.includes('passport')) backendErrors.passportNumber = err;
          else if (err.includes('name')) backendErrors.name = err;
          else if (err.includes('surname')) backendErrors.surname = err;
          else if (err.includes('phone')) backendErrors.phone = err;
          else if (err.includes('nationality')) backendErrors.nationality = err;
          else if (err.includes('date of birth')) backendErrors.dob = err;
          else if (err.includes('expiration')) backendErrors.expirationDate = err;
        });
        setValidationErrors(backendErrors);
        setError('Please correct the errors below');
      } else {
        setError(error.response?.data?.message || 'Failed to create client');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Add New Client</h1>
        <p className="mt-1 text-sm text-dark-400">
          Create a new client record with passport information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Debug: Show validation errors */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-md">
                <strong>Validation Errors:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>{field}: {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Passport Image Upload Section */}
            <div className="bg-dark-700/50 p-6 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium text-dark-100 mb-4">Passport Image</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Upload Passport Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-400 hover:file:bg-primary-500/30"
                  />
                  
                  {passportImage && (
                    <button
                      type="button"
                      onClick={handleOcrExtraction}
                      disabled={ocrLoading}
                      className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ocrLoading ? 'Extracting Data...' : 'Extract Data with OCR'}
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Image Preview
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
                      <img
                        src={imagePreview}
                        alt="Passport preview"
                        className="max-w-full h-48 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-200">
                  First Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.name ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-dark-200">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.surname ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.surname && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.surname}</p>
                )}
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-dark-200">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.dob ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.dob && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.dob}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-200">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.email ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-dark-200">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.phone ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="passportNumber" className="block text-sm font-medium text-dark-200">
                  Passport Number *
                </label>
                <input
                  type="text"
                  id="passportNumber"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.passportNumber ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.passportNumber && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.passportNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-dark-200">
                  Nationality *
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.nationality ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.nationality && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.nationality}</p>
                )}
              </div>

              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-dark-200">
                  Passport Expiration Date *
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.expirationDate ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.expirationDate && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.expirationDate}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-4 py-2 text-sm font-medium text-dark-300 bg-dark-700/50 hover:bg-dark-700 border border-white/10 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
    </div>
  );
};

export default ClientForm;