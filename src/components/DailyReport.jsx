import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const DailyReport = ({ date, reportId, report: existingReport, onClose }) => {
  const [report, setReport] = useState(existingReport || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState(existingReport?.whatsappStatus?.status || 'pending');
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [passengerStatus, setPassengerStatus] = useState('expected');
  const [passengerNotes, setPassengerNotes] = useState('');
  const [dataChanged, setDataChanged] = useState(false);

  useEffect(() => {
    if (reportId) {
      // Fetch existing report by ID
      fetchReport();
    } else if (date && !existingReport) {
      // Generate new report for date
      generateReport();
    } else if (existingReport) {
      // Use existing report data
      setReport(existingReport);
      setWhatsappStatus(existingReport.whatsappStatus?.status || 'pending');
    }
  }, [date, reportId, existingReport]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/daily-reports/${reportId}`);

      if (response.data.success) {
        setReport(response.data.data.report);
        setWhatsappStatus(response.data.data.report.whatsappStatus?.status || 'pending');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch daily report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/daily-reports/generate', {
        date: date || new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        setReport(response.data.data.report);
        setWhatsappStatus(response.data.data.report.whatsappStatus?.status || 'pending');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate daily report');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (report?.whatsappShareUrl) {
      window.open(report.whatsappShareUrl, '_blank');
      
      // Mark as sent after opening WhatsApp
      markAsSent();
    }
  };

  const markAsSent = async () => {
    try {
      await api.put(`/api/daily-reports/${report._id}/mark-sent`, {
        messageId: `whatsapp_${Date.now()}`
      });
      setWhatsappStatus('sent');
      setDataChanged(true);
    } catch (error) {
      console.error('Failed to mark as sent:', error);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/api/daily-reports/${report._id}/mark-responded`, {
        responseMessage
      });
      setWhatsappStatus('responded');
      setResponseMessage('');
      setDataChanged(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit response');
    }
  };

  // Function to recalculate summary statistics
  const recalculateStatistics = (passengers) => {
    const stats = {
      totalExpected: 0,
      totalArrived: 0,
      totalDelayed: 0,
      totalCancelled: 0,
      totalNoShow: 0
    };

    passengers.forEach(passenger => {
      switch (passenger.status) {
        case 'expected':
          stats.totalExpected++;
          break;
        case 'arrived':
          stats.totalArrived++;
          break;
        case 'delayed':
          stats.totalDelayed++;
          break;
        case 'cancelled':
          stats.totalCancelled++;
          break;
        case 'no_show':
          stats.totalNoShow++;
          break;
        default:
          // Unknown status, count as expected
          stats.totalExpected++;
          break;
      }
    });

    // Calculate arrival rate based on total passengers
    const totalPassengers = passengers.length;
    const arrivalRate = totalPassengers > 0 
      ? ((stats.totalArrived / totalPassengers) * 100).toFixed(1)
      : 0;

    return {
      ...stats,
      arrivalRate: parseFloat(arrivalRate)
    };
  };

  const handlePassengerStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedPassenger) return;

    try {
      const response = await api.put(`/api/daily-reports/${report._id}/passenger/${selectedPassenger._id}/status`, {
        status: passengerStatus,
        notes: passengerNotes
      });
      
      // Update local state with the response from server (which includes recalculated statistics)
      if (response.data.success) {
        setReport(response.data.data.report);
        setDataChanged(true);
      } else {
        // Fallback to local calculation if server response doesn't include updated report
        setReport(prev => {
          const updatedPassengers = prev.arrivedPassengers.map(p => 
            p._id === selectedPassenger._id 
              ? { ...p, status: passengerStatus, notes: passengerNotes }
              : p
          );
          
          const newStats = recalculateStatistics(updatedPassengers);
          
          return {
            ...prev,
            arrivedPassengers: updatedPassengers,
            ...newStats
          };
        });
        setDataChanged(true);
      }
      
      setSelectedPassenger(null);
      setPassengerStatus('expected');
      setPassengerNotes('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update passenger status');
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'expected':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'arrived':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'delayed':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'no_show':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getWhatsAppStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'responded':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'expected':
        return 'Expected';
      case 'arrived':
        return 'Arrived';
      case 'delayed':
        return 'Delayed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return 'Unknown';
    }
  };

  const getWhatsAppStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'sent':
        return 'Sent';
      case 'responded':
        return 'Responded';
      default:
        return 'Unknown';
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
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={() => onClose(dataChanged)}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">No report data available</div>
          <button
            onClick={() => onClose(dataChanged)}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark-100 mb-2">
            Daily Arrival Report
          </h1>
          <p className="text-xl text-dark-300">
            {report.formattedReportDate}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="card-glass p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">{report.totalExpected}</div>
            <div className="text-sm text-dark-300">Expected</div>
          </div>
          <div className="card-glass p-6 text-center">
            <div className="text-2xl font-bold text-green-400">{report.totalArrived}</div>
            <div className="text-sm text-dark-300">Arrived</div>
          </div>
          <div className="card-glass p-6 text-center">
            <div className="text-2xl font-bold text-orange-400">{report.totalDelayed}</div>
            <div className="text-sm text-dark-300">Delayed</div>
          </div>
          <div className="card-glass p-6 text-center">
            <div className="text-2xl font-bold text-red-400">{report.totalCancelled}</div>
            <div className="text-sm text-dark-300">Cancelled</div>
          </div>
          <div className="card-glass p-6 text-center">
            <div className="text-2xl font-bold text-gray-400">{report.totalNoShow}</div>
            <div className="text-sm text-dark-300">No Show</div>
          </div>
        </div>

        {/* Arrival Rate and WhatsApp Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Arrival Rate */}
          <div className="card-glass p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">{report.arrivalRate}%</div>
              <div className="text-lg text-dark-300">Arrival Rate</div>
            </div>
          </div>

          {/* WhatsApp Status */}
          <div className="card-glass p-6">
            <div className="flex items-center justify-between h-full">
              <div>
                <h3 className="text-lg font-semibold text-dark-100">WhatsApp Status</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWhatsAppStatusColor(whatsappStatus)}`}>
                    {getWhatsAppStatusText(whatsappStatus)}
                  </span>
                  {whatsappStatus === 'sent' && report.whatsappStatus.sentAt && (
                    <span className="text-sm text-dark-400">
                      Sent: {new Date(report.whatsappStatus.sentAt).toLocaleString()}
                    </span>
                  )}
                  {whatsappStatus === 'responded' && report.whatsappStatus.respondedAt && (
                    <span className="text-sm text-dark-400">
                      Responded: {new Date(report.whatsappStatus.respondedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              {whatsappStatus === 'pending' && (
                <button
                  onClick={handleWhatsAppShare}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>Share via WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Passengers Table */}
        <div className="card-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-dark-100">Passengers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Expected Arrival
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-800/30 divide-y divide-white/10">
                {report.arrivedPassengers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-dark-400 mb-2">
                        <svg className="mx-auto h-12 w-12 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-dark-300 mb-1">No passengers found</p>
                      <p className="text-sm text-dark-400 mb-4">
                        No passengers are expected to arrive on this date. 
                        <br />
                        This could mean there are no services ending on this date, or no sales have been made yet.
                      </p>
                      <p className="text-xs text-dark-500">
                        To see passenger data, ensure you have sales with services ending on this date.
                      </p>
                    </td>
                  </tr>
                ) : (
                  report.arrivedPassengers.map((passenger) => (
                    <tr key={passenger._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-dark-100">
                            {passenger.passengerDetails.name} {passenger.passengerDetails.surname}
                          </div>
                          <div className="text-sm text-dark-400">
                            {passenger.passengerDetails.passportNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-100">{passenger.serviceDetails.title}</div>
                        <div className="text-sm text-dark-400">{passenger.serviceDetails.providerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-100">
                        {new Date(passenger.arrivalDetails.expectedArrivalDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(passenger.status)}`}>
                          {getStatusText(passenger.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedPassenger(passenger);
                            setPassengerStatus(passenger.status);
                            setPassengerNotes(passenger.notes || '');
                          }}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Response Form */}
        {whatsappStatus === 'sent' && (
          <div className="card-glass p-6 mt-8">
            <h3 className="text-lg font-semibold text-dark-100 mb-3">Customer Response</h3>
            <form onSubmit={handleResponseSubmit} className="space-y-4">
              <div>
                <label htmlFor="responseMessage" className="block text-sm font-medium text-dark-200 mb-2">
                  Response Message
                </label>
                <textarea
                  id="responseMessage"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800/50 text-dark-100"
                  placeholder="Enter customer response..."
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Mark as Responded
              </button>
            </form>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-6">
          <button
            onClick={() => onClose(dataChanged)}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>

      {/* Passenger Status Update Modal */}
      {selectedPassenger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/20 w-96 shadow-lg rounded-md card-glass">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-dark-100 mb-4">
                Update Status - {selectedPassenger.passengerDetails.name} {selectedPassenger.passengerDetails.surname}
              </h3>
              <form onSubmit={handlePassengerStatusUpdate} className="space-y-4">
                <div>
                  <label htmlFor="passengerStatus" className="block text-sm font-medium text-dark-200 mb-2">
                    Status
                  </label>
                  <select
                    id="passengerStatus"
                    value={passengerStatus}
                    onChange={(e) => setPassengerStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800/50 text-dark-100"
                  >
                    <option value="expected">Expected</option>
                    <option value="arrived">Arrived</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="passengerNotes" className="block text-sm font-medium text-dark-200 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="passengerNotes"
                    value={passengerNotes}
                    onChange={(e) => setPassengerNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-800/50 text-dark-100"
                    placeholder="Enter notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPassenger(null);
                      setPassengerStatus('expected');
                      setPassengerNotes('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Update
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

export default DailyReport;