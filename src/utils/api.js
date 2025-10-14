import axios from 'axios';
import { apiConfig } from '../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 120000, // Increased timeout to 120 seconds for OCR processing
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      response: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;