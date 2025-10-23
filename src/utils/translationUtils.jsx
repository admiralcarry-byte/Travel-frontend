/**
 * Translation Utilities
 * 
 * This utility helps identify and update database value displays
 * to use the DatabaseValue component for translation blocking.
 */

import React from 'react';
import DatabaseValue from '../components/DatabaseValue';

/**
 * Wraps database values with translation blocking attributes
 * @param {string} value - The database value to wrap
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - A span with translation blocking
 */
export const DatabaseValueWrapper = ({ children, className = '', ...props }) => {
  return (
    <span 
      className={`db-value ${className}`} 
      data-db-value="true"
      translate="no"
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Wraps UI labels that should be translatable
 * @param {string} children - The UI label text
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - A span without translation blocking
 */
export const TranslatableLabel = ({ children, className = '', ...props }) => {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
};

/**
 * Determines if a value should be treated as a database value
 * @param {string} fieldName - The field name from the database
 * @returns {boolean} - True if it's a database value that shouldn't be translated
 */
export const isDatabaseValue = (fieldName) => {
  const databaseFields = [
    'type', 'name', 'destino', 'description', 'provider', 'providerId',
    'serviceType', 'serviceTypeName', 'serviceName', 'serviceDescription',
    'providerName', 'clientName', 'passengerName', 'currency', 'status',
    'paymentMethod', 'paymentTerms', 'destination', 'origin', 'category',
    'subcategory', 'brand', 'model', 'serial', 'code', 'reference',
    'id', '_id', 'email', 'phone', 'address', 'city', 'country',
    'zipCode', 'company', 'department', 'position', 'notes', 'metadata'
  ];
  
  return databaseFields.some(field => 
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
};

/**
 * Automatically wraps values based on field type
 * @param {~any} value - The value to display
 * @param {string} fieldName - The field name
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - Appropriately wrapped value
 */
export const AutoWrapValue = ({ value, fieldName, className = '' }) => {
  if (isDatabaseValue(fieldName)) {
    return <DatabaseValue className={className}>{value}</DatabaseValue>;
  }
  return <TranslatableLabel className={className}>{value}</TranslatableLabel>;
};
