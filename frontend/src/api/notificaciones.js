import apiClient from './config';
export const notificacionesService = {
    getMisNotificaciones: () => apiClient.get('/notificaciones/mis-notificaciones/'),
    marcarLeida: (id) => apiClient.patch(`/notificaciones/${id}/marcar-leida/`),
    marcarTodasLeidas: () => apiClient.post('/notificaciones/marcar-todas-leidas/'),
    getNoLeidasCount: () => apiClient.get('/notificaciones/no-leidas/'),
    create: (data) => apiClient.post('/notificaciones/', data),
};