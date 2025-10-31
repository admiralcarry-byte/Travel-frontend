import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import { getUploadUrl } from '../utils/uploadUtils';

const PassengerCard = ({ passenger, onUpdate, onDelete, clientId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: passenger.name || '',
    surname: passenger.surname || '',
    dni: passenger.dni || '',
    email: passenger.email || '',
    phone: passenger.phone || '',
    dob: passenger.dob ? passenger.dob.split('T')[0] : '', // Convert to YYYY-MM-DD format
    passportNumber: passenger.passportNumber || '',
    nationality: passenger.nationality || '',
    expirationDate: passenger.expirationDate ? passenger.expirationDate.split('T')[0] : '',
    specialRequests: passenger.specialRequests || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const openImageModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
  };

  const toggleCardExpansion = () => {
    setIsCardExpanded(!isCardExpanded);
  };

  // Handle Escape key to close modal and expanded card
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showImageModal) {
          closeImageModal();
        } else if (isCardExpanded) {
          setIsCardExpanded(false);
        }
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal, isCardExpanded]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Clean up form data - remove empty strings for optional fields
      const cleanedFormData = {
        ...formData,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        dob: formData.dob || undefined,
        passportNumber: formData.passportNumber.trim() || undefined,
        nationality: formData.nationality.trim() || undefined,
        expirationDate: formData.expirationDate || undefined,
        specialRequests: formData.specialRequests.trim() || undefined
      };

      const response = await api.put(
        `/api/passengers/${passenger._id}`,
        cleanedFormData
      );

      if (response.data.success) {
        onUpdate(response.data.data.passenger);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Passenger update error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Handle validation errors
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          fieldErrors[err.field] = err.message;
        });
        setValidationErrors(fieldErrors);
        setError('Please fix the validation errors below');
      } else {
        setError(error.response?.data?.message || error.response?.data?.error || 'Failed to update passenger');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: passenger.name || '',
      surname: passenger.surname || '',
      dni: passenger.dni || '',
      email: passenger.email || '',
      phone: passenger.phone || '',
      dob: passenger.dob ? passenger.dob.split('T')[0] : '',
      passportNumber: passenger.passportNumber || '',
      nationality: passenger.nationality || '',
      expirationDate: passenger.expirationDate ? passenger.expirationDate.split('T')[0] : '',
      specialRequests: passenger.specialRequests || ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      try {
      await api.delete(`/api/passengers/${passenger._id}`);
        onDelete(passenger._id);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete passenger');
      }
    }
  };

  return (
    <>
    <div className="card p-6">
      {error && (
        <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-3 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-dark-100">
            {passenger.fullName || `${passenger.name || ''} ${passenger.surname || ''}`.trim() || 'Unknown Passenger'}
          </h3>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              {passenger.passportImage && (
                <button
                  onClick={() => {
                    const imageUrl = getUploadUrl(`passports/${passenger.passportImage}`);
                    openImageModal(imageUrl);
                  }}
                  className="text-blue-400 hover:text-blue-300 p-2 rounded-md hover:bg-blue-400/10 transition-colors duration-200"
                  title="View Passport Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button
                onClick={toggleCardExpansion}
                className="text-blue-400 hover:text-blue-300 p-2 rounded-md hover:bg-blue-400/10 transition-colors duration-200"
                title={isCardExpanded ? "Collapse" : "Expand"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-200 ${isCardExpanded ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-error-400 hover:text-error-300 text-sm font-medium"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="text-success-400 hover:text-success-300 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="text-dark-400 hover:text-dark-300 text-sm font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>


      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.name ? 'border-red-500' : ''}`}
            />
            {validationErrors.name && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              className={`input-field text-sm ${validationErrors.surname ? 'border-red-500' : ''}`}
            />
            {validationErrors.surname && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.surname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              DNI/CUIT
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
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

          <div className="md:col-span-2">
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
        </div>
      ) : (
        /* Read-only display section */
        <div className="mt-4 space-y-4">
          {isCardExpanded ? (
            /* Expanded view - show all details */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-dark-400">Full Name</span>
                <p className="text-dark-100">{passenger.fullName || `${passenger.name || ''} ${passenger.surname || ''}`.trim() || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Email</span>
                <p className="text-dark-100">{passenger.email || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Phone</span>
                <p className="text-dark-100">{passenger.phone || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Date of Birth</span>
                <p className="text-dark-100">{passenger.dob ? new Date(passenger.dob).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Passport Number</span>
                <p className="text-dark-100">{passenger.passportNumber || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Nationality</span>
                <p className="text-dark-100">{passenger.nationality || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Passport Expiration</span>
                <p className="text-dark-100">{passenger.expirationDate ? new Date(passenger.expirationDate).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Passport Status</span>
                <span className={`ml-2 badge ${passenger.isPassportValid
                    ? 'badge-success'
                    : 'badge-error'
                  }`}>
                  {passenger.isPassportValid ? 'Valid' : 'Expired'}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-sm font-medium text-dark-400">Special Requests / Notes</span>
                <p className="text-dark-100">{passenger.specialRequests || 'No special requests'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Created</span>
                <p className="text-dark-100">{new Date(passenger.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            /* Collapsed view - show only essential info */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-dark-400">Email</span>
                <p className="text-dark-100">{passenger.email || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Phone</span>
                <p className="text-dark-100">{passenger.phone || 'N/A'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-dark-400">Passport Status</span>
                <span className={`ml-2 badge ${passenger.isPassportValid
                    ? 'badge-success'
                    : 'badge-error'
                  }`}>
                  {passenger.isPassportValid ? 'Valid' : 'Expired'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Full Screen Image Modal */}
      {showImageModal && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ 
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={closeImageModal}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeImageModal();
            }}
            className="absolute top-6 right-6 z-10 text-white hover:text-gray-300 bg-black bg-opacity-70 rounded-full p-3 transition-colors duration-200"
            style={{ zIndex: 100000 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Full Screen Image */}
          {modalImageUrl && (
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
              <img 
                src={modalImageUrl} 
                alt="Passport Full Screen" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ 
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  objectFit: 'contain'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
    </>
  );
};

export default PassengerCard;