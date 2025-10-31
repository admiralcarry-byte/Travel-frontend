import React from 'react';

/**
 * DatabaseValue Component
 * 
 * A component specifically designed to display database values that should NOT be translated.
 * This ensures that values stored in the database (like service types, provider names, etc.)
 * are displayed as-is without being translated by the browser's translation function.
 * 
 * Usage:
 * <DatabaseValue>hotel</DatabaseValue>
 * <DatabaseValue className="font-bold">provider name</DatabaseValue>
 */
const DatabaseValue = ({ children, className = '', ...props }) => {
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

export default DatabaseValue;
