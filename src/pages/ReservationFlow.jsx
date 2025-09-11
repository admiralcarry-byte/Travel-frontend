import React, { useState, useEffect, useLocation } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReservationFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cupo, setCupo] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [seatsToReserve, setSeatsToReserve] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.cupo) {
      setCupo(location.state.cupo);
    } else {
      navigate('/inventory');
    }
    fetchClients();
  }, [location.state, navigate]);

  const fetchClients = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clients?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      setError('Failed to fetch clients');
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleReserve = async () => {
    if (!selectedClient || seatsToReserve <= 0) {
      setError('Please select a client and enter valid number of seats');
      return;
    }

    if (seatsToReserve > cupo.availableSeats) {
      setError(`Only ${cupo.availableSeats} seats available`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(`http://localhost:5000/api/cupos/${cupo.id}/reserve`, {
        seatsToReserve: seatsToReserve,
        clientId: selectedClient.id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess('Reservation created successfully!');
        
        // If a sale was created, navigate to it
        if (response.data.data.sale) {
          setTimeout(() => {
            navigate(`/sales/${response.data.data.sale.id}`);
          }, 2000);
        } else {
          // Otherwise, go back to inventory
          setTimeout(() => {
            navigate('/inventory');
          }, 2000);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  if (!cupo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create Reservation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Reserve seats from inventory and create a new sale
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Cupo Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Inventory Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service</label>
                  <p className="text-gray-900">{cupo.serviceId?.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <p className="text-gray-900">{cupo.serviceId?.providerId?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">{cupo.formattedDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                  <p className="text-gray-900 font-semibold">{cupo.availableSeats}</p>
                </div>
                {cupo.metadata.roomType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Type</label>
                    <p className="text-gray-900">{cupo.metadata.roomType}</p>
                  </div>
                )}
                {cupo.metadata.flightClass && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Flight Class</label>
                    <p className="text-gray-900">{cupo.metadata.flightClass.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Client Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Select Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">
                      {client.name} {client.surname}
                    </h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <p className="text-sm text-gray-500">{client.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seats to Reserve */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Reservation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="seatsToReserve" className="block text-sm font-medium text-gray-700">
                    Number of Seats to Reserve *
                  </label>
                  <input
                    type="number"
                    id="seatsToReserve"
                    value={seatsToReserve}
                    onChange={(e) => setSeatsToReserve(parseInt(e.target.value) || 1)}
                    min="1"
                    max={cupo.availableSeats}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum: {cupo.availableSeats} seats available
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Cost (Estimated)
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(cupo.serviceId?.cost * seatsToReserve).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cupo.serviceId?.currency || 'USD'} per seat
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Client Summary */}
            {selectedClient && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">Selected Client</h4>
                <p className="text-green-700">
                  <strong>{selectedClient.name} {selectedClient.surname}</strong>
                </p>
                <p className="text-green-600 text-sm">{selectedClient.email}</p>
              </div>
            )}

            {/* Reservation Summary */}
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-md">
              <h4 className="font-medium text-indigo-800 mb-2">Reservation Summary</h4>
              <div className="text-indigo-700 space-y-1">
                <p><strong>Service:</strong> {cupo.serviceId?.title}</p>
                <p><strong>Date:</strong> {cupo.formattedDate}</p>
                <p><strong>Seats:</strong> {seatsToReserve}</p>
                <p><strong>Client:</strong> {selectedClient ? `${selectedClient.name} ${selectedClient.surname}` : 'Not selected'}</p>
                <p><strong>Estimated Total:</strong> ${(cupo.serviceId?.cost * seatsToReserve).toFixed(2)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReserve}
                disabled={loading || !selectedClient || seatsToReserve <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Reservation...' : 'Create Reservation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFlow;