import api from './api';

export const assignmentService = {
  async getProjectTeam(projectId) {
    const response = await api.get(`/projects/${projectId}/team`);
    return response.data;
  },

  async addReviewers(projectId, userIds) {
    const response = await api.post(`/projects/${projectId}/reviewers`, { user_ids: userIds });
    return response.data;
  },

  async removeReviewer(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/reviewers/${userId}`);
    return response.data;
  },

  async addAnnotators(projectId, userIds) {
    const response = await api.post(`/projects/${projectId}/annotators`, { user_ids: userIds });
    return response.data;
  },

  async removeAnnotator(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/annotators/${userId}`);
    return response.data;
  },
};
