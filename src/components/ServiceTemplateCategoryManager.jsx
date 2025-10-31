import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ServiceTemplateCategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/service-templates/categories');
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-dark-100 mb-2">Service Template Categories</h3>
        <p className="text-sm text-dark-400">
          These are the fixed categories available for service templates. Categories are predefined and cannot be modified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-dark-700 border border-white/10 rounded-lg p-4 hover:bg-dark-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-100">{category.label}</h4>
                <p className="text-sm text-dark-400 mt-1">
                  {category.value}
                </p>
              </div>
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-400">Fixed Categories</h4>
            <p className="text-sm text-blue-300 mt-1">
              These categories are predefined and managed by the system. They ensure consistency across all service templates and cannot be modified by users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTemplateCategoryManager;
