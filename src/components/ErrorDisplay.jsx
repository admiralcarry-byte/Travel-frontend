import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorDisplay = ({ 
  error, 
  title = 'Error',
  showBackButton = true,
  backButtonText = 'Go Back',
  backButtonPath = null,
  onRetry = null,
  retryText = 'Try Again',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backButtonPath) {
      navigate(backButtonPath);
    } else {
      navigate(-1);
    }
  };

  if (!error) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="notification max-w-md w-full">
        <div className="flex items-center space-x-4 mb-4">
          <div className="icon-container bg-error-500">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-error-400 font-semibold text-lg">{title}</h3>
            <p className="text-error-300 text-sm">{error}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="btn-secondary flex-1 sm:flex-none"
            >
              {backButtonText}
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary flex-1 sm:flex-none"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;