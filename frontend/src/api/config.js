import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload.data;
    }
    return response.data;
  },
  (error) => {
    const serverResponse = error.response?.data;
    const status = error.response?.status;

    // DRF devuelve errores por campo: { email: ["..."], username: ["..."] }
    // Normalizamos a un formato útil para el frontend
    let message = 'Error de conexión';
    let fieldErrors = null;

    if (serverResponse && typeof serverResponse === 'object') {
      // Si el backend envía { detail: "..." } (errores genéricos de DRF)
      if (serverResponse.detail) {
        message = serverResponse.detail;
      }
      // Si el backend envía { message: "..." } (tu formato custom)
      else if (serverResponse.message) {
        message = serverResponse.message;
      }
      // Si hay errores por campo (validación), construir mensaje
      else {
        const firstField = Object.keys(serverResponse)[0];
        if (firstField && Array.isArray(serverResponse[firstField])) {
            message = serverResponse[firstField][0];
        }
        fieldErrors = serverResponse;
        
        // Extraer username del mensaje si es email duplicado
        const emailMatch = message.match(/usuario: (\w+)/);
        if (emailMatch) {
            fieldErrors._existingUsername = emailMatch[1];
        }
      }
    }

    return Promise.reject({
      message,
      fieldErrors,
      status,
      isEmailTaken: !!fieldErrors?.email?.some(e => e.includes('registrado')),
      isUsernameTaken: !!fieldErrors?.username?.some(e => e.includes('registrado') || e.includes('existe')),
    });
  }
);

export default apiClient;
export { API_URL };
