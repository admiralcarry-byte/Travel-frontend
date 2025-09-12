import React from 'react';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  options = null, // For select fields
  disabled = false,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const baseInputClasses = `input-field ${inputClassName}`;
  const errorClasses = error ? 'border-error-500 focus:border-error-500' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const renderInput = () => {
    if (type === 'select' && options) {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${baseInputClasses} ${errorClasses} ${disabledClasses}`}
          {...props}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={`${baseInputClasses} ${errorClasses} ${disabledClasses}`}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseInputClasses} ${errorClasses} ${disabledClasses}`}
        {...props}
      />
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-dark-200">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <p className="text-error-400 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="text-dark-400 text-sm">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;