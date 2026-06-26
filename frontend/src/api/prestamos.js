import apiClient from './config';

export const prestamosService = {
    getAll: () => apiClient.get('/prestamos/'),
    getById: (id) => apiClient.get(`/prestamos/${id}/`),
    create: (data) => apiClient.post('/prestamos/', data),
    aprobar: (id) => apiClient.post(`/prestamos/${id}/aprobar/`),
    devolver: (id) => apiClient.post(`/prestamos/${id}/devolver/`),
};