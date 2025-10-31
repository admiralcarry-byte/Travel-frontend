// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://travel-backend-production-5253.up.railway.app' : 'http://localhost:5000');

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Development API Configuration:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    PROD: import.meta.env.PROD,
    API_BASE_URL
  });
}

// Log API configuration in production for debugging
if (import.meta.env.PROD) {
  console.log('🚀 Production API Configuration:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_BASE_URL,
    NODE_ENV: import.meta.env.NODE_ENV
  });
  
  // Validate API configuration
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    console.error('❌ API_BASE_URL is not properly configured');
  }
}

// Export API_BASE_URL for components that need direct URL access
export { API_BASE_URL };

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      register: `${API_BASE_URL}/api/auth/register`,
      me: `${API_BASE_URL}/api/auth/me`,
      profile: `${API_BASE_URL}/api/auth/profile`,
      password: `${API_BASE_URL}/api/auth/password`,
      logout: `${API_BASE_URL}/api/auth/logout`,
      logoutAll: `${API_BASE_URL}/api/auth/logout-all`,
      sessions: `${API_BASE_URL}/api/auth/sessions`
    },
    users: `${API_BASE_URL}/api/users`,
    clients: `${API_BASE_URL}/api/clients`,
    services: `${API_BASE_URL}/api/services`,
    providers: `${API_BASE_URL}/api/providers`,
    sales: `${API_BASE_URL}/api/sales`,
    payments: `${API_BASE_URL}/api/payments`,
    passengers: `${API_BASE_URL}/api/passengers`,
    cupos: `${API_BASE_URL}/api/cupos`,
    notifications: `${API_BASE_URL}/api/notifications`,
    reports: `${API_BASE_URL}/api/reports`,
    activityLogs: `${API_BASE_URL}/api/activity-logs`,
    system: `${API_BASE_URL}/api/system`,
    uploads: `${API_BASE_URL}/uploads`
  }
};

export default apiConfig;