import React, { useState } from 'react';
import api from '../utils/api';

const PassengerCard = ({ passenger, onUpdate, onDelete, clientId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: passenger.name,
    surname: passenger.surname,
    dob: passenger.dob.split('T')[0], // Convert to YYYY-MM-DD format
    passportNumber: passenger.passportNumber,
    nationality: passenger.nationality,
    expirationDate: passenger.expirationDate.split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.put(
        `/api/passengers/${passenger._id}`,
        formData
      );

      if (response.data.success) {
        onUpdate(response.data.data.passenger);
        setIsEditing(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update passenger');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: passenger.name,
      surname: passenger.surname,
      dob: passenger.dob.split('T')[0],
      passportNumber: passenger.passportNumber,
      nationality: passenger.nationality,
      expirationDate: passenger.expirationDate.split('T')[0]
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
    <div className="card p-6">
      {error && (
        <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-3 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-dark-100">
            {passenger.fullName}
          </h3>
          <p className="text-sm text-dark-300">
            Passport: {passenger.passportNumber}
          </p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-dark-400">Date of Birth:</span>
            <span className="ml-2 text-dark-100">
              {new Date(passenger.dob).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-dark-400">Nationality:</span>
            <span className="ml-2 text-dark-100">{passenger.nationality}</span>
          </div>
          <div>
            <span className="font-medium text-dark-400">Expiration Date:</span>
            <span className="ml-2 text-dark-100">
              {new Date(passenger.expirationDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-dark-400">Status:</span>
            <span className={`ml-2 badge ${
              passenger.isPassportValid 
                ? 'badge-success' 
                : 'badge-error'
            }`}>
              {passenger.isPassportValid ? 'Valid' : 'Expired'}
            </span>
          </div>
        </div>
      )}

      {passenger.passportImage && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-dark-400">Passport Image:</span>
            <a
                        href={`${api.getUri()}/uploads/passports/${passenger.passportImage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              View Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerCard;