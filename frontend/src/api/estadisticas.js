import apiClient from './config';

export const estadisticasService = {
  getTendencias: async () => {
    return await apiClient.get('/estadisticas/tendencias/');
  },

  getTrabajosPorMes: async () => {
    return await apiClient.get('/estadisticas/trabajos-mes/');
  },
};
