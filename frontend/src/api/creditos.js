import apiClient from './config';

export const creditosService = {
    // Ver créditos disponibles (autenticado o por token)
    getMisCreditos: async () => {
        return await apiClient.get('/creditos/mis_creditos/');
    },

    // Consumir 1 crédito para descargar un trabajo
    usarCredito: async (trabajoId, token = null) => {
        const payload = { trabajo_id: trabajoId };
        if (token) payload.token = token;
        return await apiClient.post('/creditos/usar/', payload);
    },

    // Verificar si un token externo tiene acceso a un trabajo
    verificarAcceso: async (token, trabajoId) => {
        return await apiClient.get('/accesos-externos/verificar/', {
            params: { token, trabajo_id: trabajoId }
        });
    },
};