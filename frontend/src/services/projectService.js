import api from '@/lib/api';

export const projectService = {
  // ==================== CLIENTS API ====================

  // 1. Fetch all clients (with optional search query)
  getClients: async (params = {}) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  // 2. Fetch single client by UUID
  getClientById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // 3. Create a new client profile
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // ==================== PROJECTS API ====================

  // 4. Fetch all projects (includes real-time total_paid & due_balance)
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // 5. Fetch single project details with payment records
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // 6. Create a new project linked to a client
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // 7. Update project information (status, target date, budget)
  updateProject: async (id, projectData) => {
    const response = await api.patch(`/projects/${id}`, projectData);
    return response.data;
  },

  // 8. Delete or archive a project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};

export default projectService;
