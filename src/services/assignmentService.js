import api from './api';

export const assignmentService = {
  // Basic team operations
  async getProjectTeam(projectId) {
    const response = await api.get(`/projects/${projectId}/team`);
    return response.data;
  },

  // Reviewer operations with multi-level support
  async getReviewers(projectId) {
    const response = await api.get(`/projects/${projectId}/reviewers`);
    return response.data;
  },

  async addReviewers(projectId, userIds) {
    const response = await api.post(`/projects/${projectId}/reviewers`, { user_ids: userIds });
    return response.data;
  },

  async addReviewersWithLevels(projectId, reviewers) {
    // reviewers: [{ user_id: 1, review_level: 1 }, ...]
    const response = await api.post(`/projects/${projectId}/reviewers/with-levels`, { reviewers });
    return response.data;
  },

  async updateReviewerLevel(projectId, userId, reviewLevel) {
    const response = await api.put(`/projects/${projectId}/reviewers/${userId}/level`, { review_level: reviewLevel });
    return response.data;
  },

  async reorderReviewers(projectId, reviewerLevels) {
    // reviewerLevels: [{ user_id: 1, review_level: 1 }, ...]
    const response = await api.put(`/projects/${projectId}/reviewers/reorder`, reviewerLevels);
    return response.data;
  },

  async removeReviewer(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/reviewers/${userId}`);
    return response.data;
  },

  async getMaxReviewLevel(projectId) {
    const response = await api.get(`/projects/${projectId}/max-review-level`);
    return response.data;
  },

  async getReviewerChain(projectId) {
    const response = await api.get(`/projects/${projectId}/reviewers/chain`);
    return response.data;
  },

  async updateReviewerChain(projectId, reviewers) {
    // reviewers: [{ user_id: 1, review_level: 1 }, ...]
    const response = await api.put(`/projects/${projectId}/reviewers/chain`, { reviewers });
    return response.data;
  },

  // Annotator operations
  async addAnnotators(projectId, userIds) {
    const response = await api.post(`/projects/${projectId}/annotators`, { user_ids: userIds });
    return response.data;
  },

  async removeAnnotator(projectId, userId) {
    const response = await api.delete(`/projects/${projectId}/annotators/${userId}`);
    return response.data;
  },

  // Manager operations
  async updateManager(projectId, userId) {
    const response = await api.put(`/projects/${projectId}/manager?user_id=${userId}`);
    return response.data;
  },
};
