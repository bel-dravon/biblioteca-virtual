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
    const message = serverResponse?.message || 'Error de conexion';
    const errors = serverResponse?.errors || null;

    const normalizedError = {
      message,
      errors,
      status: error.response?.status,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
export { API_URL };
