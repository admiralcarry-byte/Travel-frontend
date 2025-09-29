import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
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

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/clients/${clientId}`);

      if (response.data.success) {
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
          <button
            onClick={() => navigate('/clients')}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium mb-4"
          >
            ← Back to Passengers
          </button>
          <h1 className="text-3xl font-bold text-dark-100">{client.fullName}</h1>
          <p className="text-dark-300 mt-2">Passenger Details and Passengers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-dark-100 mb-4">Passenger Information</h2>

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
                  <span className="text-sm font-medium text-dark-400">Created</span>
                  <p className="text-dark-100">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {client.passportImage && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <span className="text-sm font-medium text-dark-400">Passport Image</span>
                  <div className="mt-2">
                    <a
                      href={`${api.getUri()}/uploads/passports/${client.passportImage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 text-sm"
                    >
                      View Passport Image
                    </a>
                  </div>
                </div>
              )}
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
    </div>
  );
};

export default ClientDetails;