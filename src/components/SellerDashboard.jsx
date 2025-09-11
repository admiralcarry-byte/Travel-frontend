import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sales, setSales] = useState([
    // Mock data for demonstration - using proper MongoDB ObjectId format
    {
      id: '507f1f77bcf86cd799439011',
      customer: 'John Doe',
      destination: 'Paris, France',
      amount: 2500,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '507f1f77bcf86cd799439012',
      customer: 'Jane Smith',
      destination: 'Tokyo, Japan',
      amount: 3200,
      date: '2024-01-20',
      status: 'pending'
    },
    {
      id: '507f1f77bcf86cd799439013',
      customer: 'Bob Johnson',
      destination: 'New York, USA',
      amount: 1800,
      date: '2024-01-25',
      status: 'completed'
    }
  ]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const completedSales = sales.filter(sale => sale.status === 'completed').length;
  const pendingSales = sales.filter(sale => sale.status === 'pending').length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.relative')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  return (
    <div className="min-h-screen">
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
            Seller Dashboard
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Welcome back, <span className="font-semibold text-primary-400">{user?.username || 'Seller'}</span>! 
            Here's your comprehensive sales overview and performance metrics.
          </p>
        </div>
          
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Sales Card */}
          <div className="card-neon hover-lift p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="icon-container bg-primary-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-primary-300">Total Revenue</div>
                <div className="text-xs text-primary-400">All time</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-dark-100 mb-3">Total Sales</h3>
            <p className="text-5xl font-bold text-primary-400 mb-3">${totalSales.toLocaleString()}</p>
            <p className="text-sm text-primary-300">+12% from last month</p>
          </div>
          
          {/* Completed Sales Card */}
          <div className="card hover-lift p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="icon-container bg-success-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-success-300">Success Rate</div>
                <div className="text-xs text-success-400">Completed</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-dark-100 mb-3">Completed Sales</h3>
            <p className="text-5xl font-bold text-success-400 mb-3">{completedSales}</p>
            <p className="text-sm text-success-300">Successful bookings</p>
          </div>
          
          {/* Pending Sales Card */}
          <div className="card hover-lift p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="icon-container bg-warning-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-warning-300">In Progress</div>
                <div className="text-xs text-warning-400">Awaiting</div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-dark-100 mb-3">Pending Sales</h3>
            <p className="text-5xl font-bold text-warning-400 mb-3">{pendingSales}</p>
            <p className="text-sm text-warning-300">Awaiting confirmation</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass p-8 mb-12">
          <h3 className="text-3xl font-bold text-dark-100 mb-8 flex items-center">
            <div className="icon-container bg-accent-500 mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => navigate('/sales/new')}
              className="group card hover-lift p-8"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-primary-500 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-dark-100 mb-3 group-hover:text-primary-400 transition-colors">Add New Sale</div>
                  <div className="text-dark-300 group-hover:text-primary-300 transition-colors">Record a new travel booking and expand your business</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/reports')}
              className="group card hover-lift p-8"
            >
              <div className="flex items-center space-x-6">
                <div className="icon-container bg-success-500 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-dark-100 mb-3 group-hover:text-success-400 transition-colors">View Reports</div>
                  <div className="text-dark-300 group-hover:text-success-300 transition-colors">Analyze sales performance and track your growth</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Sales Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-dark-100 flex items-center">
              <div className="icon-container bg-primary-500 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Recent Sales
            </h3>
            <button 
              onClick={() => navigate('/sales')}
              className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All →
            </button>
          </div>
            
          <div className="grid gap-6">
            {sales.map((sale, index) => (
              <div
                key={sale.id}
                className="card hover-lift p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-500 via-accent-500 to-success-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {sale.customer.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-2xl font-bold text-dark-100 mb-2">
                        {sale.customer}
                      </div>
                      <div className="text-dark-300 flex items-center mb-2">
                        <svg className="w-4 h-4 mr-2 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {sale.destination}
                      </div>
                      <div className="text-sm text-dark-400 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(sale.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-dark-100 mb-3">
                        ${sale.amount.toLocaleString()}
                      </div>
                      <span className={`badge ${
                        sale.status === 'completed' 
                          ? 'badge-success' 
                          : 'badge-warning'
                      }`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === sale.id ? null : sale.id)}
                        className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {activeDropdown === sale.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-white/10 rounded-lg shadow-lg z-10">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                navigate(`/sales/${sale.id}`);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                navigate(`/sales/${sale.id}/edit`);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              Edit Sale
                            </button>
                            <button
                              onClick={() => {
                                // Handle delete functionality
                                console.log('Delete sale:', sale.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-error-400 hover:bg-error-500/10 hover:text-error-300 transition-colors"
                            >
                              Delete Sale
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;