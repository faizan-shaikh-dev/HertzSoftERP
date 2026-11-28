import api from '@/lib/api';

export const employeeService = {
  // 1. Get all employees / interns with optional filters (type, department, status, work_mode, search)
  getEmployees: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  // 2. Get single employee by ID
  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // 3. Create employee or intern
  createEmployee: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  // 4. Update employee
  updateEmployee: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  // 5. Delete employee
  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  // 6. Summary stats
  getEmployeeStats: async () => {
    const response = await api.get('/employees/stats/summary');
    return response.data;
  }
};

export default employeeService;
