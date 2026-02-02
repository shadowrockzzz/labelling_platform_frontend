import api from './api';

const API_BASE = '/api/v1/annotations/text';

export const textAnnotationService = {
  // List annotations for a project
  listAnnotations: async (projectId, filters = {}) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/annotations`, {
      params: filters
    });
    return response.data;
  },

  // Get a specific annotation
  getAnnotation: async (projectId, annotationId) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/annotations/${annotationId}`);
    return response.data;
  },

  // Create a new annotation
  createAnnotation: async (projectId, data) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations`, data);
    return response.data;
  },

  // Update an annotation
  updateAnnotation: async (projectId, annotationId, data) => {
    const response = await api.put(`${API_BASE}/projects/${projectId}/annotations/${annotationId}`, data);
    return response.data;
  },

  // Submit an annotation for review
  submitAnnotation: async (projectId, annotationId) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations/${annotationId}/submit`);
    return response.data;
  },

  // Review an annotation (approve/reject)
  reviewAnnotation: async (projectId, annotationId, action, comment = null) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations/${annotationId}/review`, {
      action,
      comment
    });
    return response.data;
  },

  // Get queue tasks for a project
  getQueueTasks: async (projectId) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/queue`);
    return response.data;
  }
};