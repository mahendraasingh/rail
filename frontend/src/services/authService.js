import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('railtogether_token', response.data.token);
      localStorage.setItem('railtogether_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('railtogether_token', response.data.token);
      localStorage.setItem('railtogether_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('railtogether_token');
    localStorage.removeItem('railtogether_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('railtogether_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
