import React from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)'
        }}
      ></div>
      
      {/* Modal */}
      <div className="relative flex min-h-full items-center justify-center p-4" style={{ zIndex: 10000 }}>
        <div className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-xl transition-all`}>
          {/* Modal Container with Glass Effect */}
          <div className="card-glass p-0" style={{ backgroundColor: 'rgba(51, 65, 85, 0.95)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white font-poppins">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-white hover:text-primary-200 transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;