import apiClient from './config';

export const historialService = {
  registrarVisualizacion: async (trabajoId) => {
    if (!trabajoId) return null;

    try {
      return await apiClient.post('/historial/', { trabajo: trabajoId });
    } catch (error) {
      console.warn('Error guardando historial:', error);
      return null;
    }
  },

  getUserHistory: async () => {
    return await apiClient.get('/historial/');
  },
};
