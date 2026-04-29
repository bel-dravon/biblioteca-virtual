import apiClient from './config';

export const rolesService = {
  getAll: async () => {
    return await apiClient.get('/roles/');
  },
};
