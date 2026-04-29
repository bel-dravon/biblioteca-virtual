import apiClient from './config';

const buildRequestConfig = (data) => {
  if (!(data instanceof FormData)) {
    return undefined;
  }

  return {
    headers: {
      'Content-Type': undefined,
    },
  };
};

export const convocatoriasService = {
  getAll: async () => {
    return await apiClient.get('/convocatorias/');
  },

  create: async (data) => {
    return await apiClient.post('/convocatorias/', data, buildRequestConfig(data));
  },

  update: async (id, data) => {
    return await apiClient.patch(`/convocatorias/${id}/`, data, buildRequestConfig(data));
  },

  delete: async (id) => {
    return await apiClient.delete(`/convocatorias/${id}/`);
  },
};
