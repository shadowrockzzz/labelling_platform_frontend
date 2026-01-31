import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data.data;
    
    // Store tokens and user data
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  async logout() {
    await api.post('/auth/logout');
    
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },
};