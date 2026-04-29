import apiClient from './config';

export const solicitudesService = {
  getAll: async () => {
    return await apiClient.get('/solicitudes/');
  },

  create: async (data) => {
    return await apiClient.post('/solicitudes/', data);
  },

  aprobar: async (id) => {
    return await apiClient.patch(`/solicitudes/${id}/aprobar/`);
  },

  rechazar: async (id) => {
    return await apiClient.patch(`/solicitudes/${id}/rechazar/`);
  },
};
