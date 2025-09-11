import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.get(`http://localhost:5000/api/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setClient(response.data.data.client);
        setPassengers(response.data.data.passengers);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch client data');
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
      prev.map(p => p.id === updatedPassenger.id ? updatedPassenger : p)
    );
  };

  const handlePassengerDeleted = (passengerId) => {
    setPassengers(prev => prev.filter(p => p.id !== passengerId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-medium mb-4">Client not found</div>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/clients')}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-4"
          >
            ← Back to Clients
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{client.fullName}</h1>
          <p className="text-gray-600 mt-2">Client Details and Passengers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Full Name</span>
                  <p className="text-gray-900">{client.fullName}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-gray-900">{client.email}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-gray-900">{client.phone}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  <p className="text-gray-900">{new Date(client.dob).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Passport Number</span>
                  <p className="text-gray-900">{client.passportNumber}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Nationality</span>
                  <p className="text-gray-900">{client.nationality}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Passport Expiration</span>
                  <p className="text-gray-900">{new Date(client.expirationDate).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Passport Status</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    client.isPassportValid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.isPassportValid ? 'Valid' : 'Expired'}
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <p className="text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {client.passportImage && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Passport Image</span>
                  <div className="mt-2">
                    <a
                      href={`http://localhost:5000/uploads/passports/${client.passportImage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
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
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Passengers ({passengers.length})
                </h2>
                <button
                  onClick={() => setShowPassengerForm(!showPassengerForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                >
                  {showPassengerForm ? 'Cancel' : 'Add Passenger'}
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
                  <div className="text-gray-500 text-lg mb-2">No passengers added yet</div>
                  <p className="text-gray-400 text-sm">Add passengers to this client to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passengers.map((passenger) => (
                    <PassengerCard
                      key={passenger.id}
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