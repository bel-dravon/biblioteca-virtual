import apiClient from './config';

export const trabajosService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/trabajos/?${queryString}` : '/trabajos/';
    return await apiClient.get(endpoint);
  },

  getById: async (id) => {
    return await apiClient.get(`/trabajos/${id}/`);
  },

  create: async (formData) => {
    return await apiClient.post('/trabajos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  update: async (id, data) => {
    return await apiClient.patch(`/trabajos/${id}/`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/trabajos/${id}/`);
  },
};
