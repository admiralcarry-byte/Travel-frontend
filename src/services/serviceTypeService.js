import api from '../utils/api';

class ServiceTypeService {
  // Get all service types
  static async getAllServiceTypes(params = {}) {
    try {
      const response = await api.get('/api/service-types', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
  }

  // Get service type by ID
  static async getServiceTypeById(id) {
    try {
      const response = await api.get(`/api/service-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service type:', error);
      throw error;
    }
  }

  // Create new service type
  static async createServiceType(serviceTypeData) {
    try {
      const response = await api.post('/api/service-types', serviceTypeData);
      return response.data;
    } catch (error) {
      console.error('Error creating service type:', error);
      throw error;
    }
  }

  // Update service type
  static async updateServiceType(id, serviceTypeData) {
    try {
      const response = await api.put(`/api/service-types/${id}`, serviceTypeData);
      return response.data;
    } catch (error) {
      console.error('Error updating service type:', error);
      throw error;
    }
  }

  // Delete service type (soft delete)
  static async deleteServiceType(id) {
    try {
      const response = await api.delete(`/api/service-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service type:', error);
      throw error;
    }
  }

  // Get service type statistics
  static async getServiceTypeStats() {
    try {
      const response = await api.get('/api/service-types/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching service type stats:', error);
      throw error;
    }
  }

  // Get service types formatted for dropdowns
  static async getServiceTypesForSelect() {
    try {
      const response = await this.getAllServiceTypes({ active: true });
      if (response.success) {
        return response.data.serviceTypes.map(serviceType => ({
          value: serviceType._id,
          label: serviceType.name,
          category: serviceType.category
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching service types for select:', error);
      return [];
    }
  }
}

export default ServiceTypeService;
