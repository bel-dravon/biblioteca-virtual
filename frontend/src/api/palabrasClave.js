import apiClient from './config';

export const palabrasClaveService = {
  getAll: async () => {
    return await apiClient.get('/palabras-clave/');
  },

  create: async (data) => {
    return await apiClient.post('/palabras-clave/', data);
  },

  update: async (id, data) => {
    return await apiClient.patch(`/palabras-clave/${id}/`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/palabras-clave/${id}/`);
  },
};
