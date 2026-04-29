import apiClient from './config';

export const librosService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/libros/?${queryString}` : '/libros/';
    return await apiClient.get(endpoint);
  },
};
