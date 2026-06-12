import apiClient from './config';

export const usersService = {
  getAll: async () => {
    return await apiClient.get('/users/');
  },

  getById: async (id) => {
    return await apiClient.get(`/users/${id}/`);
  },

  create: async (data) => {
    return await apiClient.post('/users/', data);
  },

  update: async (id, data) => {
    return await apiClient.patch(`/users/${id}/`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/users/${id}/`);
  },
};

