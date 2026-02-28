import api from './api';

const API_BASE = '/annotations/text';

export const textResourceService = {
  // List resources for a project
  listResources: async (projectId, page = 1, limit = 20) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/resources`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get a specific resource with content
  getResource: async (projectId, resourceId) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/resources/${resourceId}`);
    return response.data;
  },

  // Upload a text file
  uploadResource: async (projectId, file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    
    const response = await api.post(`${API_BASE}/projects/${projectId}/resources/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Add a URL resource
  addUrlResource: async (projectId, url, name) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/resources/url`, {
      name,
      source_type: 'url',
      external_url: url
    });
    return response.data;
  },

  // Delete/archive a resource
  deleteResource: async (projectId, resourceId) => {
    const response = await api.delete(`${API_BASE}/projects/${projectId}/resources/${resourceId}`);
    return response.data;
  },

  // Get unannotated resources for queue-based workflow
  getUnannotatedResources: async (projectId, limit = 50) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/queue/unannotated`, {
      params: { limit }
    });
    return response.data;
  }
};
