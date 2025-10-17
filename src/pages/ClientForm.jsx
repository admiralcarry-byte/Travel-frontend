import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Companion Form Component
const CompanionForm = ({ onAddCompanion, onCancel, initialData = null, isEditing = false, onUpdateCompanion = null }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    surname: '',
    dni: '',
    dob: '',
    email: '',
    phone: '',
    passportNumber: '',
    nationality: '',
    expirationDate: '',
    gender: '',
    specialRequests: ''
  });
  const [passportImage, setPassportImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passportImageFilename, setPassportImageFilename] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateName = (name, fieldName) => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!name) return `${fieldName} is required`;
    if (!nameRegex.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    if (name.length < 2) return `${fieldName} must be at least 2 characters long`;
    return '';
  };

  const validateDNI = (dni) => {
    if (!dni) return 'DNI/CUIT is required';
    if (dni.length < 7) return 'DNI/CUIT must be at least 7 characters long';
    if (dni.length > 20) return 'DNI/CUIT cannot exceed 20 characters';
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) return 'Your email format is incorrect. Please enter it in the format kevin@gmail.com';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?[1-9]\d{9,14})$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      return 'Your phone number format is incorrect. Please enter a valid phone number (10-15 digits)';
    }
    
    return '';
  };

  const validatePassportNumber = (passportNumber) => {
    if (passportNumber && passportNumber.length < 3) return 'Passport number must be at least 3 characters long';
    if (passportNumber && passportNumber.length > 20) return 'Passport number cannot exceed 20 characters';
    return '';
  };

  const validateNationality = (nationality) => {
    const nationalityRegex = /^[a-zA-Z\s\-']+$/;
    if (nationality && !nationalityRegex.test(nationality)) return 'Nationality can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const validateDate = (date, fieldName) => {
    if (!date) return '';
    
    let dateObj;
    if (typeof date === 'string') {
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
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
    const newErrors = {};
    
    newErrors.name = validateName(formData.name, 'First Name');
    newErrors.surname = validateName(formData.surname, 'Last Name');
    newErrors.dni = validateDNI(formData.dni);
    
    if (formData.email) newErrors.email = validateEmail(formData.email);
    if (formData.phone) newErrors.phone = validatePhone(formData.phone);
    if (formData.dob) newErrors.dob = validateDate(formData.dob, 'Date of Birth');
    if (formData.passportNumber) newErrors.passportNumber = validatePassportNumber(formData.passportNumber);
    if (formData.nationality) newErrors.nationality = validateNationality(formData.nationality);
    if (formData.expirationDate) newErrors.expirationDate = validateDate(formData.expirationDate, 'Passport Expiration Date');
    
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
      setErrors({ general: 'Please upload a passport image first' });
      return;
    }

    setOcrLoading(true);
    setErrors({});

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

        // Show success message
        setErrors({ success: `Passport data extracted successfully using OpenAI Vision (confidence: ${result.data.confidence}%)` });
      } else {
        setErrors({ general: result.message || 'Failed to extract passport data' });
      }
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      setErrors({ general: 'Failed to extract passport data. Please try again.' });
    } finally {
      setOcrLoading(false);
    }
  };


  const handleSubmit = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Upload passport image first if one is selected
      let uploadedImageFilename = null;
      
      if (passportImage) {
        console.log('📁 Uploading passport image:', passportImage.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append('passportImage', passportImage);
        
        try {
          const uploadResponse = await api.post('/api/upload/passport', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes timeout for file upload
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
          setErrors({ general: 'Failed to upload passport image: ' + uploadError.message });
          return;
        }
      }

      // Prepare companion data with passport image
      const companionData = {
        ...formData,
        passportImage: uploadedImageFilename
      };
      
      // Call the appropriate callback based on whether we're editing or adding
      if (isEditing && onUpdateCompanion) {
        onUpdateCompanion(companionData);
      } else {
        onAddCompanion(companionData);
      }
      
      // Reset the companion form data only if we're adding (not editing)
      if (!isEditing) {
        setFormData({
          name: '',
          surname: '',
          dni: '',
          dob: '',
          email: '',
          phone: '',
          passportNumber: '',
          nationality: '',
          expirationDate: '',
          gender: '',
          specialRequests: ''
        });
        setPassportImage(null);
        setImagePreview(null);
        setPassportImageFilename(null);
      }
      setErrors({});
    } catch (error) {
      console.error('Error adding companion:', error);
      setErrors({ general: 'Failed to add companion. Please try again.' });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-dark-100 mb-4">
        {isEditing ? 'Edit Acompañante' : 'Add Acompañante'}
      </h4>
      
      {/* Error and Success Messages */}
      {errors.general && (
        <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-md">
          {errors.general}
        </div>
      )}

      {errors.success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-md">
          {errors.success}
        </div>
      )}

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={`input-field text-sm ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            required
            className={`input-field text-sm ${errors.surname ? 'border-red-500' : ''}`}
          />
          {errors.surname && <p className="mt-1 text-sm text-red-400">{errors.surname}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            DNI/CUIT *
          </label>
          <input
            type="text"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            required
            className={`input-field text-sm ${errors.dni ? 'border-red-500' : ''}`}
          />
          {errors.dni && <p className="mt-1 text-sm text-red-400">{errors.dni}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className={`input-field text-sm ${errors.dob ? 'border-red-500' : ''}`}
          />
          {errors.dob && <p className="mt-1 text-sm text-red-400">{errors.dob}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input-field text-sm ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+999"
            className={`input-field text-sm ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Passport Number
          </label>
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            className={`input-field text-sm ${errors.passportNumber ? 'border-red-500' : ''}`}
          />
          {errors.passportNumber && <p className="mt-1 text-sm text-red-400">{errors.passportNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Nationality
          </label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className={`input-field text-sm ${errors.nationality ? 'border-red-500' : ''}`}
          />
          {errors.nationality && <p className="mt-1 text-sm text-red-400">{errors.nationality}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Passport Expiration Date
          </label>
          <input
            type="date"
            name="expirationDate"
            value={formData.expirationDate}
            onChange={handleChange}
            className={`input-field text-sm ${errors.expirationDate ? 'border-red-500' : ''}`}
          />
          {errors.expirationDate && <p className="mt-1 text-sm text-red-400">{errors.expirationDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`input-field text-sm ${errors.gender ? 'border-red-500' : ''}`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <p className="mt-1 text-sm text-red-400">{errors.gender}</p>}
        </div>
      </div>

      {/* Special Requests / Notes */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1">
          Special Requests / Notes
        </label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests}
          onChange={handleChange}
          rows={3}
          placeholder="Dietary restrictions, medical conditions, travel preferences, or any other notes..."
          className={`input-field text-sm ${errors.specialRequests ? 'border-red-500' : ''}`}
        />
        {errors.specialRequests && <p className="mt-1 text-sm text-red-400">{errors.specialRequests}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-primary text-sm"
        >
          {isEditing ? 'Update Acompañante' : 'Add Acompañante'}
        </button>
      </div>
    </div>
  );
};

const ClientForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    dob: '',
    email: '',
    phone: '',
    passportNumber: '',
    nationality: '',
    expirationDate: '',
    gender: '',
    specialRequests: ''
  });
  const [companions, setCompanions] = useState([]);
  const [showCompanionForm, setShowCompanionForm] = useState(false);
  const [editingCompanionIndex, setEditingCompanionIndex] = useState(null);
  const [passportImage, setPassportImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [passportImageFilename, setPassportImageFilename] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [createSaleAfterClient, setCreateSaleAfterClient] = useState(false);

  const navigate = useNavigate();

  // Handle editing companions
  const handleEditCompanion = (index) => {
    setEditingCompanionIndex(index);
    setShowCompanionForm(false); // Hide the add form if it's open
  };

  const handleUpdateCompanion = (updatedCompanion) => {
    setCompanions(prev => prev.map((companion, index) => 
      index === editingCompanionIndex ? updatedCompanion : companion
    ));
    setEditingCompanionIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingCompanionIndex(null);
  };


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

  const validateDNI = (dni) => {
    if (!dni) return 'DNI/CUIT is required';
    if (dni.length < 7) return 'DNI/CUIT must be at least 7 characters long';
    if (dni.length > 20) return 'DNI/CUIT cannot exceed 20 characters';
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
    
    // Only name, surname, and DNI are required
    errors.name = validateName(formData.name, 'First Name');
    errors.surname = validateName(formData.surname, 'Last Name');
    errors.dni = validateDNI(formData.dni);
    
    // Optional fields validation
    if (formData.email) errors.email = validateEmail(formData.email);
    if (formData.phone) errors.phone = validatePhone(formData.phone);
    if (formData.dob) errors.dob = validateDate(formData.dob, 'Date of Birth');
    if (formData.passportNumber) errors.passportNumber = validatePassportNumber(formData.passportNumber);
    if (formData.nationality) errors.nationality = validateNationality(formData.nationality);
    if (formData.expirationDate) errors.expirationDate = validateDate(formData.expirationDate, 'Passport Expiration Date');
    
    // Remove empty error messages
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/clients/ocr`, {
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
    setError('');
    setValidationErrors({});

    // Validate form before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct the errors below before submitting');
      return;
    }

    setLoading(true);

    try {
      // Upload passport image first if one is selected
      let uploadedImageFilename = null;
      console.log('🔍 ClientForm - Checking passport image state:', {
        hasPassportImage: !!passportImage,
        passportImageType: typeof passportImage,
        passportImageName: passportImage?.name,
        passportImageSize: passportImage?.size
      });
      
      if (passportImage) {
        console.log('📁 ClientForm - Uploading passport image:', passportImage.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append('passportImage', passportImage);
        
        try {
          const uploadResponse = await api.post('/api/upload/passport', uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes timeout for file upload
          });
          
          console.log('📁 ClientForm - Upload response:', uploadResponse.data);
          
          if (uploadResponse.data.success) {
            uploadedImageFilename = uploadResponse.data.filename;
            console.log('✅ ClientForm - Upload successful, filename:', uploadedImageFilename);
          } else {
            console.error('❌ ClientForm - Upload failed:', uploadResponse.data.message);
          }
        } catch (uploadError) {
          console.error('❌ ClientForm - Upload error:', uploadError);
          setError('Failed to upload passport image: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      let response;
      
      // Include passport image filename in form data and structure preferences
      const clientData = {
        ...formData,
        passportImage: uploadedImageFilename || passportImageFilename,
        preferences: {
          specialRequests: formData.specialRequests || ''
        }
      };
      
      // Remove specialRequests from top level since it's now in preferences
      delete clientData.specialRequests;
      
      if (companions.length > 0) {
        // Create client with companions
        response = await api.post('/api/clients/bulk', {
          mainClient: clientData,
          companions: companions
        });
      } else {
        // Create single client
        response = await api.post('/api/clients', clientData);
      }

      if (response.data.success) {
        const clientId = response.data.data.mainClient?._id || response.data.data.client._id;
        setSuccess(companions.length > 0 ? 'Passenger and Acompañantes created successfully!' : 'Passenger created successfully!');
        
        if (createSaleAfterClient) {
          // Navigate to sale wizard with the new client pre-selected
          setTimeout(() => {
            navigate(`/sales/wizard?clientId=${clientId}`);
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/clients');
          }, 2000);
        }
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
          else if (err.includes('DNI') || err.includes('CUIT')) backendErrors.dni = err;
        });
        setValidationErrors(backendErrors);
        setError('Please correct the errors below');
      } else {
        setError(error.response?.data?.message || 'Failed to create passenger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Add New Passenger</h1>
        <p className="mt-1 text-sm text-dark-400">
          Create a new passenger record with passport information
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
                      onClick={handleOpenAIExtraction}
                      disabled={ocrLoading}
                      className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ocrLoading ? 'Processing with OpenAI...' : 'Extract Data with OpenAI'}
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
                <label htmlFor="dni" className="block text-sm font-medium text-dark-200">
                  DNI/CUIT *
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.dni ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.dni && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.dni}</p>
                )}
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-dark-200">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
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
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+999"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.phone ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-dark-200">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.gender ? 'border-red-500' : 'border-white/20'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {validationErrors.gender && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.gender}</p>
                )}
              </div>

              <div>
                <label htmlFor="passportNumber" className="block text-sm font-medium text-dark-200">
                  Passport Number
                </label>
                <input
                  type="text"
                  id="passportNumber"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
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
                  Nationality
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
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
                  Passport Expiration Date
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                    validationErrors.expirationDate ? 'border-red-500' : 'border-white/20'
                  }`}
                />
                {validationErrors.expirationDate && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.expirationDate}</p>
                )}
              </div>
            </div>

            {/* Special Requests / Notes */}
            <div className="mt-6">
              <label htmlFor="specialRequests" className="block text-sm font-medium text-dark-200">
                Special Requests / Notes
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={3}
                placeholder="Dietary restrictions, medical conditions, travel preferences, or any other notes..."
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-dark-100 bg-dark-800/50 ${
                  validationErrors.specialRequests ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {validationErrors.specialRequests && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.specialRequests}</p>
              )}
            </div>

            {/* Companions Section */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-dark-100">Acompañantes</h3>
                <button
                  type="button"
                  onClick={() => setShowCompanionForm(!showCompanionForm)}
                  className="btn-primary text-sm"
                >
                  {showCompanionForm ? 'Cancel' : 'Add Acompañante'}
                </button>
              </div>

              {/* Companion Form */}
              {showCompanionForm && (
                <div className="mb-6 p-4 bg-dark-700/50 rounded-lg border border-white/10">
                  <CompanionForm
                    onAddCompanion={(companion) => {
                      setCompanions(prev => [...prev, companion]);
                      setShowCompanionForm(false);
                    }}
                    onCancel={() => setShowCompanionForm(false)}
                  />
                </div>
              )}

              {/* Edit Companion Form */}
              {editingCompanionIndex !== null && (
                <div className="mb-6 p-4 bg-dark-700/50 rounded-lg border border-white/10">
                  <CompanionForm
                    initialData={companions[editingCompanionIndex]}
                    isEditing={true}
                    onUpdateCompanion={handleUpdateCompanion}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}

              {/* Companions List */}
              {companions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-dark-200">Added Acompañantes ({companions.length})</h4>
                  {companions.map((companion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg border border-white/10">
                      <div>
                        <span className="text-dark-100 font-medium">
                          {companion.name} {companion.surname}
                        </span>
                        <span className="text-dark-400 text-sm ml-2">DNI: {companion.dni}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditCompanion(index)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanions(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Options */}
            {/* <div className="pt-6 border-t border-white/10">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createSaleAfterClient"
                  checked={createSaleAfterClient}
                  onChange={(e) => setCreateSaleAfterClient(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/20 rounded bg-dark-800/50"
                />
                <label htmlFor="createSaleAfterClient" className="ml-2 block text-sm text-dark-200">
                  Create a sale for this passenger after creation (will appear in sales table)
                </label>
              </div>
            </div> */}

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
                {loading ? 'Creating...' : 'Create Passenger'}
              </button>
            </div>
          </form>

    </div>
  );
};

export default ClientForm;