import React, { useState } from 'react';
import api from '../utils/api';

const PassengerForm = ({ clientId, onPassengerAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dob: '',
    passportNumber: '',
    nationality: '',
    expirationDate: '',
    gender: ''
  });
  const [passportImage, setPassportImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      const response = await api.post('/api/passengers/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const extractedData = response.data.data.extractedData;

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
      }
    } catch (error) {
      setError(error.response?.data?.message || 'OCR extraction failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(
        `/api/clients/${clientId}/passengers`,
        formData
      );

      if (response.data.success) {
        onPassengerAdded(response.data.data.passenger);
        // Reset form
        setFormData({
          name: '',
          surname: '',
          dob: '',
          passportNumber: '',
          nationality: '',
          expirationDate: ''
        });
        setPassportImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add passenger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-dark-100 mb-4">Add New Passenger</h3>
      
      {error && (
        <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Passport Image Upload */}
        <div className="card p-4">
          <h4 className="text-sm font-medium text-dark-400 mb-3">Passport Image (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onClick={handleOcrExtraction}
                  disabled={ocrLoading}
                  className="mt-2 w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ocrLoading ? 'Extracting...' : 'Extract Data with OCR'}
                </button>
              )}
            </div>

            {imagePreview && (
              <div>
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
              className="input-field text-sm"
            />
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
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="input-field text-sm"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Passport Number *
            </label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              required
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Nationality *
            </label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              required
              className="input-field text-sm"
            />
          </div>
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
            {loading ? 'Adding...' : 'Add Passenger'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;