import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const InventoryCalendar = () => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode]);

  // Listen for cupo updates from other components
  useEffect(() => {
    const handleCupoUpdate = () => {
      // Refresh calendar data when a cupo is updated
      fetchCalendarData();
    };

    window.addEventListener('cupoUpdated', handleCupoUpdate);
    
    return () => {
      window.removeEventListener('cupoUpdated', handleCupoUpdate);
    };
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      const date = new Date(currentDate);
      
      if (viewMode === 'month') {
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      } else if (viewMode === 'week') {
        const dayOfWeek = date.getDay();
        startDate = new Date(date);
        startDate.setDate(date.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else { // day
        startDate = new Date(date);
        endDate = new Date(date);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const response = await api.get(`/api/cupos/calendar?${params}`);

      if (response.data.success) {
        setCalendarData(response.data.data.calendarData);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else { // day
      newDate.setDate(newDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const getAvailabilityColor = (availabilityStatus) => {
    switch (availabilityStatus) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'limited_availability': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low_availability': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sold_out': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = () => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getCuposForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return calendarData[dateKey] || [];
  };

  const handleCupoClick = (cupo) => {
    if (cupo.availableSeats > 0) {
      navigate('/reservations/new', { 
        state: { 
          cupo: cupo,
          prefillData: {
            serviceId: cupo.serviceId.id,
            providerId: cupo.serviceId.providerId.id,
            serviceTitle: cupo.serviceId.destino,
            date: cupo.metadata.date,
            availableSeats: cupo.availableSeats
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Calendar</h1>
              <p className="text-gray-600 mt-2">View inventory by date with availability status</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Grid View
              </button>
              <button
                onClick={() => navigate('/cupos/new')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Cupo
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Calendar Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                →
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'month' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'week' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'day' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {viewMode === 'month' && (
            <div className="p-6">
              {/* Month Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getMonthDays().map((date, index) => (
                  <div key={index} className="min-h-24 p-2 border border-gray-200">
                    {date && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getCuposForDate(date).slice(0, 3).map(cupo => (
                            <div
                              key={cupo.id}
                              onClick={() => handleCupoClick(cupo)}
                              className={`text-xs p-1 rounded cursor-pointer border ${getAvailabilityColor(cupo.availabilityStatus)} ${
                                cupo.availableSeats > 0 ? 'hover:opacity-80' : 'cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div className="font-medium truncate">{cupo.serviceId?.destino}</div>
                              <div>{cupo.availableSeats} seats</div>
                            </div>
                          ))}
                          {getCuposForDate(date).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{getCuposForDate(date).length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {getWeekDays().map((date, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">
                      {formatDate(date)}
                    </div>
                    <div className="space-y-2">
                      {getCuposForDate(date).map(cupo => (
                        <div
                          key={cupo.id}
                          onClick={() => handleCupoClick(cupo)}
                          className={`text-xs p-2 rounded cursor-pointer border ${getAvailabilityColor(cupo.availabilityStatus)} ${
                            cupo.availableSeats > 0 ? 'hover:opacity-80' : 'cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="font-medium truncate">{cupo.serviceId?.destino}</div>
                          <div className="text-xs">{cupo.availableSeats} seats</div>
                          <div className="text-xs">{cupo.serviceId?.providerId?.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="p-6">
              <div className="text-lg font-medium text-gray-900 mb-4">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="space-y-3">
                {getCuposForDate(currentDate).map(cupo => (
                  <div
                    key={cupo.id}
                    onClick={() => handleCupoClick(cupo)}
                    className={`p-4 rounded-lg cursor-pointer border ${getAvailabilityColor(cupo.availabilityStatus)} ${
                      cupo.availableSeats > 0 ? 'hover:opacity-80' : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{cupo.serviceId?.destino}</h3>
                        <p className="text-sm text-gray-600">{cupo.serviceId?.providerId?.name}</p>
                        {cupo.metadata.roomType && (
                          <p className="text-sm text-gray-500">Room: {cupo.metadata.roomType}</p>
                        )}
                        {cupo.metadata.flightClass && (
                          <p className="text-sm text-gray-500">Class: {cupo.metadata.flightClass.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{cupo.availableSeats}</div>
                        <div className="text-sm text-gray-500">available</div>
                        <div className="text-sm text-gray-500">{cupo.occupancyPercentage}% occupied</div>
                      </div>
                    </div>
                  </div>
                ))}
                {getCuposForDate(currentDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No inventory available for this date
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Availability Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
              <span>Limited Availability</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
              <span>Low Availability</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
              <span>Sold Out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryCalendar;