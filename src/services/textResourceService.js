import api from './api';

export const textResourceService = {
  // Original resource endpoints
  async uploadResource(projectId, formData) {
    const response = await api.post(`/annotations/text/projects/${projectId}/resources/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async addUrlResource(projectId, data) {
    const response = await api.post(`/annotations/text/projects/${projectId}/resources/url`, data);
    return response.data;
  },

  async getResources(projectId, page = 1, limit = 20) {
    const response = await api.get(`/annotations/text/projects/${projectId}/resources`, {
      params: { page, limit }
    });
    return response.data;
  },

  async getResource(projectId, resourceId) {
    const response = await api.get(`/annotations/text/projects/${projectId}/resources/${resourceId}`);
    return response.data;
  },

  async deleteResource(projectId, resourceId) {
    const response = await api.delete(`/annotations/text/projects/${projectId}/resources/${resourceId}`);
    return response.data;
  },

  async getUnannotatedResources(projectId, limit = 50) {
    const response = await api.get(`/annotations/text/projects/${projectId}/queue/unannotated`, {
      params: { limit }
    });
    return response.data;
  },

  // Resource Pool endpoints (for PM-provided resources)
  async bulkUploadResources(projectId, files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await api.post(
      `/annotations/text/projects/${projectId}/resources/bulk-upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async getNextPoolResource(projectId) {
    const response = await api.get(`/annotations/text/projects/${projectId}/pool/next`);
    return response.data;
  },

  async skipPoolResource(projectId, resourceId) {
    const response = await api.post(
      `/annotations/text/projects/${projectId}/resources/${resourceId}/skip`
    );
    return response.data;
  },

  async releaseResourceLock(projectId, resourceId) {
    const response = await api.post(
      `/annotations/text/projects/${projectId}/resources/${resourceId}/release-lock`
    );
    return response.data;
  },

  async getPoolStatus(projectId) {
    const response = await api.get(`/annotations/text/projects/${projectId}/pool/status`);
    return response.data;
  },

  // Review Pool endpoints
  async getNextReviewAnnotation(projectId, level = 1) {
    const response = await api.get(
      `/annotations/text/projects/${projectId}/review-pool/next`,
      { params: { level } }
    );
    return response.data;
  },

  async skipReviewAnnotation(projectId, annotationId, level = 1) {
    const response = await api.post(
      `/annotations/text/projects/${projectId}/annotations/${annotationId}/skip-review`,
      null,
      { params: { level } }
    );
    return response.data;
  }
};