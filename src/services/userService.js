import api from './api';

export const userService = {
  async getAllUsers(params = {}) {
    const { role, search, page = 1, limit = 100 } = params;
    const queryParams = new URLSearchParams();
    
    if (role) queryParams.append('role', role);
    if (search) queryParams.append('search', search);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/users?${queryParams}`);
    return response.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },

  async updateUser(id, updates) {
    const response = await api.put(`/users/${id}`, updates);
    return response.data.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async changeUserRole(id, role) {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data.data;
  },
};