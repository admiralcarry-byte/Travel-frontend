import React, { useState } from 'react';
import api from '../utils/api';

const PassengerForm = ({ clientId, onPassengerAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    email: '',
    phone: '',
    dob: '',
    passportNumber: '',
    nationality: '',
    expirationDate: '',
    gender: '',
    specialRequests: ''
  });
  const [passportImage, setPassportImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passportImageFilename, setPassportImageFilename] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    let value = e.target.value;
    
    // For DNI field, only allow numbers
    if (e.target.name === 'dni') {
      value = value.replace(/\D/g, '');
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
    // Clear validation error for this field when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log('📁 File selected:', file);
    if (file) {
      setPassportImage(file);
      console.log('✅ Passport image state set:', file.name, file.size, file.type);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAIExtraction = async () => {
    if (!passportImage) {
      setError('Please upload a passport image first');
      return;
    }

    setOcrLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('passportImage', passportImage);

      // Call the backend OpenAI Vision API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/passengers/ocr`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        const extractedData = result.data.extractedData;
        
        // Auto-fill form with OpenAI extracted data
        setFormData(prev => ({
          ...prev,
          name: extractedData.name || prev.name,
          surname: extractedData.surname || prev.surname,
          passportNumber: extractedData.passportNumber || prev.passportNumber,
          dni: extractedData.dni || prev.dni,
          nationality: extractedData.nationality || prev.nationality,
          dob: extractedData.dob || prev.dob,
          expirationDate: extractedData.expirationDate || prev.expirationDate,
          email: extractedData.email || prev.email,
          phone: extractedData.phone || prev.phone,
          gender: extractedData.gender || prev.gender
        }));

        setSuccess(`Passport data extracted successfully using OpenAI Vision (confidence: ${result.data.confidence}%)`);
      } else {
        setError(result.message || 'Failed to extract passport data');
      }
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      setError('Failed to extract passport data. Please try again.');
    } finally {
      setOcrLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Validate required fields first
      if (!formData.name?.trim()) {
        setValidationErrors({ name: 'Name is required' });
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      if (!formData.surname?.trim()) {
        setValidationErrors({ surname: 'Surname is required' });
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      if (!formData.dni?.trim()) {
        setValidationErrors({ dni: 'DNI is required' });
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Upload passport image first if one is selected
      let uploadedImageFilename = null;
      console.log('🔍 Checking passport image state:', {
        hasPassportImage: !!passportImage,
        passportImageType: typeof passportImage,
        passportImageName: passportImage?.name,
        passportImageSize: passportImage?.size
      });
      
      if (passportImage) {
        console.log('📁 Uploading passport image:', passportImage.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append('passportImage', passportImage);
        
        try {
          const uploadResponse = await api.post('/api/upload/passport', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 second timeout for file upload
          });
          
          console.log('📁 Upload response:', uploadResponse.data);
          
          if (uploadResponse.data.success) {
            uploadedImageFilename = uploadResponse.data.filename;
            console.log('✅ Upload successful, filename:', uploadedImageFilename);
          } else {
            console.error('❌ Upload failed:', uploadResponse.data.message);
          }
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          setError('Failed to upload passport image: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      // Clean up form data - only include fields that have values
      const cleanedFormData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        dni: formData.dni.replace(/\D/g, '') // Remove all non-digits
      };
      
      // Only add optional fields if they have values
      if (formData.email?.trim()) cleanedFormData.email = formData.email.trim();
      if (formData.phone?.trim()) cleanedFormData.phone = formData.phone.trim();
      if (formData.dob) cleanedFormData.dob = new Date(formData.dob).toISOString().split('T')[0];
      if (formData.passportNumber?.trim()) cleanedFormData.passportNumber = formData.passportNumber.trim();
      if (formData.nationality?.trim()) cleanedFormData.nationality = formData.nationality.trim();
      if (formData.expirationDate) cleanedFormData.expirationDate = new Date(formData.expirationDate).toISOString().split('T')[0];
      if (formData.gender) cleanedFormData.gender = formData.gender;
      if (formData.specialRequests?.trim()) cleanedFormData.specialRequests = formData.specialRequests.trim();
      if (uploadedImageFilename) cleanedFormData.passportImage = uploadedImageFilename;

      // Validate DNI length after cleaning
      if (cleanedFormData.dni.length < 7 || cleanedFormData.dni.length > 20) {
        setValidationErrors({ dni: 'DNI must be between 7 and 20 characters' });
        setError('Please enter a valid DNI');
        setLoading(false);
        return;
      }

      console.log('=== PASSENGER FORM SUBMIT DEBUG ===');
      console.log('Form data:', formData);
      console.log('Uploaded image filename:', uploadedImageFilename);
      console.log('Cleaned form data being sent:', cleanedFormData);
      console.log('DNI validation check:', {
        original: formData.dni,
        cleaned: cleanedFormData.dni,
        length: cleanedFormData.dni.length,
        isValid: cleanedFormData.dni.length >= 7 && cleanedFormData.dni.length <= 20
      });
      console.log('===================================');

      const response = await api.post(
        `/api/clients/${clientId}/passengers`,
        cleanedFormData
      );

      if (response.data.success) {
        onPassengerAdded(response.data.data.passenger);
        // Reset form
        setFormData({
          name: '',
          surname: '',
          dni: '',
          email: '',
          phone: '',
          dob: '',
          passportNumber: '',
          nationality: '',
          expirationDate: '',
          gender: '',
          specialRequests: ''
        });
        setPassportImage(null);
        setImagePreview(null);
        setPassportImageFilename(null);
        setSuccess('Acompañante added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Passenger creation error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Handle validation errors
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          fieldErrors[err.field] = err.message;
        });
        setValidationErrors(fieldErrors);
        setError('Please fix the validation errors below');
      } else if (error.response?.status === 400) {
        // Handle general 400 errors
        setError(error.response?.data?.message || 'Invalid data provided. Please check all fields.');
      } else {
        setError(error.response?.data?.message || 'Failed to add Acompañante');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-dark-100 mb-4">Add New Acompañante</h3>
      
      {error && (
        <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Passport Image Upload */}
        <div className="card p-4">
          <h4 className="text-sm font-medium text-dark-400 mb-3">Passport Data Extraction</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {/* File Upload */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
              />
              
              {passportImage && (
                <button
                  type="button"
                  onClick={handleOpenAIExtraction}
                  disabled={ocrLoading}
                  className="mt-2 w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {ocrLoading ? 'Processing with OpenAI...' : 'Extract Data with OpenAI'}
                </button>
              )}
              </div>
            </div>

            {imagePreview && (
              <div>
                <h5 className="text-sm font-medium text-dark-400 mb-2">Uploaded Image</h5>
                <img
                  src={imagePreview}
                  alt="Passport preview"
                  className="max-w-full h-32 object-contain border border-white/10 rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Passenger Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`input-field text-sm ${validationErrors.name ? 'border-red-500' : ''}`}
            />
            {validationErrors.name && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
              className={`input-field text-sm ${validationErrors.surname ? 'border-red-500' : ''}`}
            />
            {validationErrors.surname && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.surname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              DNI/CUIT *
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              required
              placeholder="Enter DNI/CUIT (numbers only)"
              maxLength={20}
              className={`input-field text-sm ${validationErrors.dni ? 'border-red-500' : ''}`}
            />
            {validationErrors.dni && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.dni}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.email ? 'border-red-500' : ''}`}
            />
            {validationErrors.email && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+999"
              className={`input-field text-sm ${validationErrors.phone ? 'border-red-500' : ''}`}
            />
            {validationErrors.phone && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.dob ? 'border-red-500' : ''}`}
            />
            {validationErrors.dob && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.dob}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.gender ? 'border-red-500' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {validationErrors.gender && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.gender}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Passport Number
            </label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.passportNumber ? 'border-red-500' : ''}`}
            />
            {validationErrors.passportNumber && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.passportNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Nationality
            </label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.nationality ? 'border-red-500' : ''}`}
            />
            {validationErrors.nationality && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.nationality}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.expirationDate ? 'border-red-500' : ''}`}
            />
            {validationErrors.expirationDate && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.expirationDate}</p>
            )}
          </div>
        </div>

        {/* Special Requests / Notes */}
        <div>
          <label className="block text-sm font-medium text-dark-400 mb-1">
            Special Requests / Notes
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            placeholder="Dietary restrictions, medical conditions, travel preferences, or any other notes..."
            className={`input-field text-sm ${validationErrors.specialRequests ? 'border-red-500' : ''}`}
          />
          {validationErrors.specialRequests && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.specialRequests}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Acompañante'}
          </button>
        </div>
      </form>

    </div>
  );
};

export default PassengerForm;