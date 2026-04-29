import apiClient from './config';

export const perfilesService = {
  getAll: async () => {
    return await apiClient.get('/perfiles/');
  },

  update: async (userId, data) => {
    return await apiClient.patch(`/perfiles/${userId}/`, data);
  },
};
