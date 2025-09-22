import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import SellerDashboard from '../components/SellerDashboard';

const Dashboard = () => {
  const { user, logout, isAdmin, isSeller, loading } = useAuth();

  // Debug logging
  // console.log('Dashboard - User:', user);
  // console.log('Dashboard - isAdmin:', isAdmin);
  // console.log('Dashboard - isSeller:', isSeller);
  // console.log('Dashboard - loading:', loading);

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="icon-container">
                <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-dark-300 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (isAdmin) {
      return <AdminDashboard />;
    } else if (isSeller) {
      return <SellerDashboard />;
    } else {
      // Fallback dashboard for users without specific roles
      return (
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-6 font-poppins">
              Welcome to Your Dashboard
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              Welcome back, <span className="font-semibold text-primary-400">{user?.username || 'User'}</span>! 
              Your travel management command center awaits!
            </p>
          </div>
          
          {/* Role Information */}
          <div className="card-neon p-8 mb-12">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-warning-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-dark-100 mb-2">Account Status</h3>
                <p className="text-dark-300">
                  Your account is currently set up as a regular user. Contact an administrator to assign you a specific role (Admin or Seller) for full access to dashboard features.
                </p>
              </div>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card hover-lift p-8 text-center">
              <div className="icon-container bg-primary-500 mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-dark-100 mb-3">Analytics</h3>
              <p className="text-dark-300">Track your performance and insights</p>
            </div>
            
            <div className="card hover-lift p-8 text-center">
              <div className="icon-container bg-success-500 mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-dark-100 mb-3">Quick Actions</h3>
              <p className="text-dark-300">Access your most used features</p>
            </div>
            
            <div className="card hover-lift p-8 text-center">
              <div className="icon-container bg-accent-500 mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-dark-100 mb-3">Real-time Updates</h3>
              <p className="text-dark-300">Stay updated with live information</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;