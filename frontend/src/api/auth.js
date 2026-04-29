import apiClient from './config';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'username';

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/api-token-auth/', { username, password });
    
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, username);
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUsername: () => {
    return localStorage.getItem(USER_KEY);
  },

  isAuthenticated: () => {
    return !!authService.getToken();
  }
};
