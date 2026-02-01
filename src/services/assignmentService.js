import api from './api';

export const assignmentService = {
  async getProjectTeam(projectId) {
    const response = await api.get(`/projects/${projectId}/team`);
    return response.data.data;
  },

  async addReviewer(projectId, userId) {
    const response = await api.post(`/projects/${projectId}/reviewers`, { user_id: userId });
    return response.data;
  },

  async removeReviewer(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/reviewers/${userId}`);
    return response.data;
  },

  async addAnnotator(projectId, userId) {
    const response = await api.post(`/projects/${projectId}/annotators`, { user_id: userId });
    return response.data;
  },

  async removeAnnotator(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/annotators/${userId}`);
    return response.data;
  },
};