import api from '@/lib/api';

export const projectService = {
  // 1. Get all projects with optional filters (status, client_id, search)
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    // Expected response format: { success: true, count: number, data: Project[] }
    return response.data;
  },

  // 2. Get single project details + payments list
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // 3. Create a new Project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // 4. Update Project details
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // 5. Delete Project by ID (Admin only)
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // 6. Get all clients (for project assignment dropdown)
  getClients: async (params = {}) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  // 7. Create a new Client
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // 8. Get Single Client with full Projects, Payments & Analytics
  getClientById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }
};

export default projectService;
