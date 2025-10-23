/**
 * Update Database Values Utility
 * 
 * This utility helps identify and update database value displays
 * to use the DatabaseValue component for translation blocking.
 */

// Common patterns to look for and update
export const databaseValuePatterns = [
  // Service-related patterns
  { pattern: /service\.type/g, fieldName: 'type' },
  { pattern: /service\.name/g, fieldName: 'name' },
  { pattern: /service\.destino/g, fieldName: 'destino' },
  { pattern: /service\.description/g, fieldName: 'description' },
  { pattern: /service\.providerId/g, fieldName: 'providerId' },
  { pattern: /service\.serviceType/g, fieldName: 'serviceType' },
  { pattern: /service\.serviceTypeName/g, fieldName: 'serviceTypeName' },
  { pattern: /service\.serviceName/g, fieldName: 'serviceName' },
  { pattern: /service\.serviceDescription/g, fieldName: 'serviceDescription' },
  
  // Provider-related patterns
  { pattern: /provider\.name/g, fieldName: 'providerName' },
  { pattern: /provider\._id/g, fieldName: 'providerId' },
  { pattern: /providerId\.name/g, fieldName: 'providerName' },
  
  // Client-related patterns
  { pattern: /client\.name/g, fieldName: 'clientName' },
  { pattern: /client\.email/g, fieldName: 'email' },
  { pattern: /client\.phone/g, fieldName: 'phone' },
  { pattern: /client\.address/g, fieldName: 'address' },
  
  // Passenger-related patterns
  { pattern: /passenger\.name/g, fieldName: 'passengerName' },
  { pattern: /passenger\.email/g, fieldName: 'email' },
  { pattern: /passenger\.phone/g, fieldName: 'phone' },
  
  // Payment-related patterns
  { pattern: /payment\.method/g, fieldName: 'paymentMethod' },
  { pattern: /payment\.currency/g, fieldName: 'currency' },
  { pattern: /payment\.status/g, fieldName: 'status' },
  
  // Sale-related patterns
  { pattern: /sale\.status/g, fieldName: 'status' },
  { pattern: /sale\.currency/g, fieldName: 'currency' },
  
  // General patterns
  { pattern: /\.name/g, fieldName: 'name' },
  { pattern: /\.type/g, fieldName: 'type' },
  { pattern: /\.description/g, fieldName: 'description' },
  { pattern: /\.currency/g, fieldName: 'currency' },
  { pattern: /\.status/g, fieldName: 'status' },
];

/**
 * Generates a DatabaseValue wrapper for a given field
 * @param {string} fieldName - The database field name
 * @param {string} value - The value to wrap
 * @param {string} className - Additional CSS classes
 * @returns {string} - JSX string with DatabaseValue wrapper
 */
export const generateDatabaseValueWrapper = (fieldName, value, className = '') => {
  return `<DatabaseValue data-field="${fieldName}"${className ? ` className="${className}"` : ''}>${value}</DatabaseValue>`;
};

/**
 * Common database field mappings
 */
export const fieldMappings = {
  // Service fields
  'service.type': 'type',
  'service.name': 'name',
  'service.destino': 'destino',
  'service.description': 'description',
  'service.providerId': 'providerId',
  'service.serviceType': 'serviceType',
  'service.serviceTypeName': 'serviceTypeName',
  'service.serviceName': 'serviceName',
  'service.serviceDescription': 'serviceDescription',
  
  // Provider fields
  'provider.name': 'providerName',
  'provider._id': 'providerId',
  'providerId.name': 'providerName',
  
  // Client fields
  'client.name': 'clientName',
  'client.email': 'email',
  'client.phone': 'phone',
  'client.address': 'address',
  
  // Passenger fields
  'passenger.name': 'passengerName',
  'passenger.email': 'email',
  'passenger.phone': 'phone',
  
  // Payment fields
  'payment.method': 'paymentMethod',
  'payment.currency': 'currency',
  'payment.status': 'status',
  
  // Sale fields
  'sale.status': 'status',
  'sale.currency': 'currency',
};

/**
 * Gets the appropriate field name for translation blocking
 * @param {string} fieldPath - The full field path (e.g., 'service.type')
 * @returns {string} - The field name for data-field attribute
 */
export const getFieldName = (fieldPath) => {
  return fieldMappings[fieldPath] || fieldPath.split('.').pop();
};
