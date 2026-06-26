import apiClient from './config';

export const aportesService = {
    // Cualquiera puede crear (externo o interno)
    create: async (data) => {
        // Si hay archivo, usar FormData
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return await apiClient.post('/aportes/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Listar (solo admin ve todos, usuario ve sus propios)
    getAll: async () => {
        return await apiClient.get('/aportes/');
    },

    getById: async (id) => {
        return await apiClient.get(`/aportes/${id}/`);
    },

    // Admin aprueba
    aprobar: async (id) => {
        return await apiClient.post(`/aportes/${id}/aprobar/`);
    },

    // Admin rechaza
    rechazar: async (id, motivo_rechazo, comentario_rechazo = '') => {
        return await apiClient.post(`/aportes/${id}/rechazar/`, {
            motivo_rechazo,
            comentario_rechazo,
        });
    },
};
