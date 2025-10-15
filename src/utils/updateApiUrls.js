// Utility script to help update API URLs
// This is a temporary file to help with the migration

import { apiConfig } from '../config/api';

// Helper function to get API URL for different endpoints
export const getApiUrl = (endpoint, params = {}) => {
  let url = apiConfig.baseURL;
  
  // Handle different endpoint types
  if (endpoint.startsWith('/api/')) {
    url += endpoint;
  } else if (endpoint.includes('users')) {
    url += '/api/users';
  } else if (endpoint.includes('clients')) {
    url += '/api/clients';
  } else if (endpoint.includes('services')) {
    url += '/api/services';
  } else if (endpoint.includes('providers')) {
    url += '/api/providers';
  } else if (endpoint.includes('sales')) {
    url += '/api/sales';
  } else if (endpoint.includes('payments')) {
    url += '/api/payments';
  } else if (endpoint.includes('passengers')) {
    url += '/api/passengers';
  } else if (endpoint.includes('cupos')) {
    url += '/api/cupos';
  } else if (endpoint.includes('notifications')) {
    url += '/api/notifications';
  } else if (endpoint.includes('reports')) {
    url += '/api/reports';
  } else if (endpoint.includes('activity-logs')) {
    url += '/api/activity-logs';
  } else if (endpoint.includes('system')) {
    url += '/api/system';
  } else if (endpoint.includes('uploads')) {
    url += '/uploads';
  }
  
  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export default getApiUrl;