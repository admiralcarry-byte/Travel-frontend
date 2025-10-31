/**
 * Upload Utilities
 * Helper functions for handling file uploads and URLs
 */

import { apiConfig } from '../config/api';

/**
 * Get the full URL for an uploaded file
 * @param {string} relativePath - The relative path to the uploaded file (e.g., 'passports/image.jpg')
 * @returns {string} The full URL to access the uploaded file
 */
export const getUploadUrl = (relativePath) => {
  if (!relativePath) return '';
  
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Return full URL using the API base URL
  return `${apiConfig.baseURL}/uploads/${cleanPath}`;
};

/**
 * Get the upload endpoint for a specific upload type
 * @param {string} uploadType - The type of upload (e.g., 'passport', 'payment', 'sale')
 * @returns {string} The API endpoint for uploading files
 */
export const getUploadEndpoint = (uploadType) => {
  return `${apiConfig.baseURL}/api/upload/${uploadType}`;
};

export default {
  getUploadUrl,
  getUploadEndpoint
};
