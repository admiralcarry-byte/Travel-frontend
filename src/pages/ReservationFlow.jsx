import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

    if (!cupo._id && !cupo.id) {
      setError('Invalid inventory data. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(`http://localhost:5000/api/cupos/${cupo._id || cupo.id}/reserve`, {
        seatsToReserve: seatsToReserve,
        clientId: selectedClient._id
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Create Reservation
          </h1>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-8">
            Reserve seats from inventory and create a new sale
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="p-6 space-y-6">
              {error && (
                <div className="notification">
                  <div className="flex items-center space-x-4">
                    <div className="icon-container bg-error-500">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-error-400 font-medium text-lg">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="notification">
                  <div className="flex items-center space-x-4">
                    <div className="icon-container bg-success-500">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-success-400 font-medium text-lg">{success}</span>
                  </div>
                </div>
              )}

              {/* Cupo Information */}
              <div className="bg-dark-700 shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Inventory Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Service</label>
                    <p className="text-dark-100">{cupo.serviceId?.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Provider</label>
                    <p className="text-dark-100">{cupo.serviceId?.providerId?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Date</label>
                    <p className="text-dark-100">{cupo.formattedDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200">Available Seats</label>
                    <p className="text-dark-100 font-semibold">{cupo.availableSeats}</p>
                  </div>
                  {cupo.metadata.roomType && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200">Room Type</label>
                      <p className="text-dark-100">{cupo.metadata.roomType}</p>
                    </div>
                  )}
                  {cupo.metadata.flightClass && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200">Flight Class</label>
                      <p className="text-dark-100">{cupo.metadata.flightClass.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Selection */}
              <div className="bg-dark-600/30 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Select Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {clients.map(client => (
                    <div
                      key={client._id}
                      onClick={() => handleClientSelect(client)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedClient?._id === client._id
                          ? 'border-primary-500 bg-primary-500/20'
                          : 'border-white/30 hover:border-white/40 bg-dark-700/70'
                      }`}
                    >
                      <h4 className="font-medium text-dark-100">
                        {client.name} {client.surname}
                      </h4>
                      <p className="text-sm text-dark-300">{client.email}</p>
                      <p className="text-sm text-dark-400">{client.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seats to Reserve */}
              <div>
                <h3 className="text-xl font-semibold text-dark-100 mb-4">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seatsToReserve" className="block text-sm font-semibold text-dark-200 mb-4">
                      Number of Seats to Reserve *
                    </label>
                    <input
                      type="number"
                      id="seatsToReserve"
                      value={seatsToReserve}
                      onChange={(e) => setSeatsToReserve(parseInt(e.target.value) || 1)}
                      min="1"
                      max={cupo.availableSeats}
                      className="input-field"
                    />
                    <p className="mt-1 text-sm text-dark-400">
                      Maximum: {cupo.availableSeats} seats available
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-dark-200 mb-4">
                      Total Cost (Estimated)
                    </label>
                    <div className="mt-1 p-3 bg-dark-700/50 rounded-md border border-white/10">
                      <p className="text-lg font-semibold text-dark-100">
                        ${cupo.serviceId?.cost ? (cupo.serviceId.cost * seatsToReserve).toFixed(2) : 'N/A'}
                      </p>
                      <p className="text-sm text-dark-400">
                        {cupo.serviceId?.currency || 'USD'} per seat
                        {!cupo.serviceId?.cost && (
                          <span className="block text-warning-400 text-xs mt-1">
                            Cost information not available
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Client Summary */}
              {selectedClient && (
                <div className="bg-success-500/10 border border-success-500/20 p-4 rounded-md">
                  <h4 className="font-medium text-success-400 mb-2">Selected Client</h4>
                  <p className="text-success-300">
                    <strong>{selectedClient.name} {selectedClient.surname}</strong>
                  </p>
                  <p className="text-success-400 text-sm">{selectedClient.email}</p>
                </div>
              )}

              {/* Reservation Summary */}
              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-md">
                <h4 className="font-medium text-primary-400 mb-2">Reservation Summary</h4>
                <div className="text-primary-300 space-y-1">
                  <p><strong>Service:</strong> {cupo.serviceId?.title}</p>
                  <p><strong>Date:</strong> {cupo.formattedDate}</p>
                  <p><strong>Seats:</strong> {seatsToReserve}</p>
                  <p><strong>Client:</strong> {selectedClient ? `${selectedClient.name} ${selectedClient.surname}` : 'Not selected'}</p>
                  <p><strong>Estimated Total:</strong> ${cupo.serviceId?.cost ? (cupo.serviceId.cost * seatsToReserve).toFixed(2) : 'N/A'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <button
                  onClick={() => navigate('/inventory')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReserve}
                  disabled={loading || !selectedClient || seatsToReserve <= 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Reservation...' : 'Create Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFlow;