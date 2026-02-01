import api from './api';

export const projectService = {
  async getAllProjects(params = {}) {
    const response = await api.get('/projects', { params });
    return response.data.data;
  },

  async getProjectById(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  async createProject(projectData) {
    const response = await api.post('/projects', projectData);
    return response.data.data;
  },

  async updateProject(id, updates) {
    const response = await api.put(`/projects/${id}`, updates);
    return response.data.data;
  },

  async deleteProject(id) {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};