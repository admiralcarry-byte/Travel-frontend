// Utility script to help update all API calls
// This file contains helper functions to replace hardcoded localhost URLs

import { apiConfig } from '../config/api';

// Helper function to get the correct API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If it already starts with api/, use it as is
  if (cleanEndpoint.startsWith('api/')) {
    return `${apiConfig.baseURL}/${cleanEndpoint}`;
  }
  
  // Otherwise, add api/ prefix
  return `${apiConfig.baseURL}/api/${cleanEndpoint}`;
};

// Helper function to get upload URLs
export const getUploadUrl = (path) => {
  return `${apiConfig.baseURL}/uploads/${path}`;
};

// Helper function to get static asset URLs
export const getStaticUrl = (path) => {
  return `${apiConfig.baseURL}/${path}`;
};

export default {
  getApiUrl,
  getUploadUrl,
  getStaticUrl
};