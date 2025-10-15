import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUploadUrl } from '../utils/updateAllApiCalls';
import PassengerCard from '../components/PassengerCard';
import PassengerForm from '../components/PassengerForm';

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const openImageModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showImageModal) {
          closeImageModal();
        } else if (showEditModal) {
          closeEditModal();
        }
      }
    };

    if (showImageModal || showEditModal) {
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
  }, [showImageModal, showEditModal]);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/clients/${clientId}`);

      if (response.data.success) {
        console.log('Client data:', response.data.data.client);
        console.log('Passengers data:', response.data.data.passengers);
        console.log('Passengers with passport images:', response.data.data.passengers.filter(p => p.passportImage));
        
        setClient(response.data.data.client);
        setPassengers(response.data.data.passengers);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch passenger data');
    } finally {
      setLoading(false);
    }
  };

  const handlePassengerAdded = (newPassenger) => {
    console.log('New passenger added:', newPassenger);
    console.log('Passenger has passport image:', newPassenger.passportImage);
    
    setPassengers(prev => [newPassenger, ...prev]);
    setShowPassengerForm(false);
  };

  const handlePassengerUpdated = (updatedPassenger) => {
    setPassengers(prev =>
      prev.map(p => (p._id || p.id) === (updatedPassenger._id || updatedPassenger.id) ? updatedPassenger : p)
    );
  };

  const handlePassengerDeleted = (passengerId) => {
    setPassengers(prev => prev.filter(p => (p._id || p.id) !== passengerId));
  };

  const openEditModal = () => {
    setEditFormData({
      name: client.name || '',
      surname: client.surname || '',
      email: client.email || '',
      phone: client.phone || '',
      dob: client.dob ? client.dob.split('T')[0] : '',
      passportNumber: client.passportNumber || '',
      nationality: client.nationality || '',
      expirationDate: client.expirationDate ? client.expirationDate.split('T')[0] : '',
      specialRequests: client.preferences?.specialRequests || ''
    });
    setShowEditModal(true);
    setEditError('');
    setValidationErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditFormData({});
    setEditError('');
    setValidationErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setValidationErrors({});

    try {
      // Clean up form data - remove empty strings for optional fields
      const cleanedFormData = {
        ...editFormData,
        email: editFormData.email.trim() || undefined,
        phone: editFormData.phone.trim() || undefined,
        dob: editFormData.dob || undefined,
        passportNumber: editFormData.passportNumber.trim() || undefined,
        nationality: editFormData.nationality.trim() || undefined,
        expirationDate: editFormData.expirationDate || undefined,
        preferences: {
          specialRequests: editFormData.specialRequests.trim() || undefined
        }
      };

      const response = await api.put(`/api/clients/${clientId}`, cleanedFormData);

      if (response.data.success) {
        setClient(response.data.data.client);
        closeEditModal();
      }
    } catch (error) {
      console.error('Client update error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Handle validation errors
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          fieldErrors[err.field] = err.message;
        });
        setValidationErrors(fieldErrors);
        setEditError('Please fix the validation errors below');
      } else {
        setEditError(error.response?.data?.message || error.response?.data?.error || 'Failed to update passenger information');
      }
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-400 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => navigate('/clients')}
            className="btn-primary"
          >
            Back to Passengers
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-300 text-lg font-medium mb-4">Passenger not found</div>
          <button
            onClick={() => navigate('/clients')}
            className="btn-primary"
          >
            Back to Passengers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/clients')}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium mb-4"
              >
                ← Back to Passengers
              </button>
              <h1 className="text-3xl font-bold text-dark-100">{client.fullName}</h1>
              <p className="text-dark-300 mt-2">Passenger Details and Acompañantes</p>
            </div>
            <div>
              <button
                onClick={() => navigate('/sales/new', { 
                  state: { 
                    preSelectedPassenger: {
                      _id: client._id,
                      name: client.name,
                      surname: client.surname,
                      phone: client.phone,
                      email: client.email,
                      passportNumber: client.passportNumber
                    }
                  } 
                })}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Proceed to Sale</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-dark-100">Passenger Information</h2>
                <button
                  onClick={openEditModal}
                  className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-400/10 transition-colors duration-200"
                  title="Edit Passenger Information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-dark-400">Full Name</span>
                  <p className="text-dark-100">{client.fullName}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Email</span>
                  <p className="text-dark-100">{client.email}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Phone</span>
                  <p className="text-dark-100">{client.phone}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Date of Birth</span>
                  <p className="text-dark-100">{new Date(client.dob).toLocaleDateString()}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Passport Number</span>
                  <p className="text-dark-100">{client.passportNumber}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Nationality</span>
                  <p className="text-dark-100">{client.nationality}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Passport Expiration</span>
                  <p className="text-dark-100">{new Date(client.expirationDate).toLocaleDateString()}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Passport Status</span>
                  <span className={`ml-2 badge ${client.isPassportValid
                      ? 'badge-success'
                      : 'badge-error'
                    }`}>
                    {client.isPassportValid ? 'Valid' : 'Expired'}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Special Requests / Notes</span>
                  <p className="text-dark-100">{client.preferences?.specialRequests || 'No special requests'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-dark-400">Created</span>
                  <p className="text-dark-100">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-dark-400">Passport Image</span>
                  {(() => {
                    const hasClientImage = client.passportImage && client.passportImage.trim() !== '';
                    
                    return hasClientImage ? (
                      <button
                        onClick={() => {
                          const imageUrl = getUploadUrl(`passports/${client.passportImage}`);
                          openImageModal(imageUrl);
                        }}
                        className="text-primary-400 hover:text-primary-300 p-2 rounded-md hover:bg-primary-400/10 transition-colors duration-200"
                        title="View Passport Image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-dark-500 text-sm">No image uploaded</span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Passengers Section */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-dark-100">
                  Acompañantes ({passengers.length})
                </h2>
                <button
                  onClick={() => setShowPassengerForm(!showPassengerForm)}
                  className="btn-primary text-sm"
                >
                  {showPassengerForm ? 'Cancel' : 'Add Acompañante'}
                </button>
              </div>

              {/* Passenger Form */}
              {showPassengerForm && (
                <div className="mb-6">
                  <PassengerForm
                    clientId={clientId}
                    onPassengerAdded={handlePassengerAdded}
                    onCancel={() => setShowPassengerForm(false)}
                  />
                </div>
              )}

              {/* Passengers List */}
              {passengers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-dark-300 text-lg mb-2">No Acompañantes added yet</div>
                  <p className="text-dark-400 text-sm">Add Acompañantes to this passenger to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passengers.map((passenger) => (
                    <PassengerCard
                      key={passenger._id || passenger.id}
                      passenger={passenger}
                      onUpdate={handlePassengerUpdated}
                      onDelete={handlePassengerDeleted}
                      clientId={clientId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full Screen Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-50"
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeImageModal}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeImageModal();
            }}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            style={{ zIndex: 100000 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Full Screen Image */}
          {modalImageUrl && (
            <img 
              src={modalImageUrl} 
              alt="Passport Full Screen" 
              style={{ 
                width: '100vw',
                height: '100vh',
                objectFit: 'contain',
                objectPosition: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Edit Passenger Information Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-dark-100">Edit Passenger Information</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editError && (
                <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-3 py-2 rounded-md mb-4 text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
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
                      value={editFormData.surname}
                      onChange={handleEditChange}
                      className={`input-field text-sm ${validationErrors.surname ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.surname && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.surname}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
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
                      value={editFormData.phone}
                      onChange={handleEditChange}
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
                      value={editFormData.dob}
                      onChange={handleEditChange}
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
                      value={editFormData.passportNumber}
                      onChange={handleEditChange}
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
                      value={editFormData.nationality}
                      onChange={handleEditChange}
                      className={`input-field text-sm ${validationErrors.nationality ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.nationality && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.nationality}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-1">
                      Passport Expiration
                    </label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={editFormData.expirationDate}
                      onChange={handleEditChange}
                      className={`input-field text-sm ${validationErrors.expirationDate ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.expirationDate && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.expirationDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">
                    Special Requests / Notes
                  </label>
                  <textarea
                    name="specialRequests"
                    value={editFormData.specialRequests}
                    onChange={handleEditChange}
                    rows={3}
                    placeholder="Dietary restrictions, medical conditions, travel preferences, or any other notes..."
                    className={`input-field text-sm ${validationErrors.specialRequests ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.specialRequests && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.specialRequests}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;