import * as projectService from './project.service.js';

// ==================== CLIENT CONTROLLERS ====================

// 1. Create Client
export const createClient = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client name is required'
        }
      });
    }

    const client = await projectService.createClient(req.body, req.user.id);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// 2. Get All Clients
export const getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const clients = await projectService.getClients({ search });
    res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Client
export const getClientById = async (req, res, next) => {
  try {
    const client = await projectService.getClientById(req.params.id);
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};


// ==================== PROJECT CONTROLLERS ====================

// 4. Create Project
export const createProject = async (req, res, next) => {
  try {
    const { client_id, title, total_cost } = req.body;

    if (!client_id || !title) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'client_id and title are required fields'
        }
      });
    }

    const project = await projectService.createProject(req.body, req.user.id);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// 5. Get All Projects (with balance)
export const getProjects = async (req, res, next) => {
  try {
    const { status, client_id, search } = req.query;
    const projects = await projectService.getProjects({ status, client_id, search });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// 6. Get Single Project
export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// 7. Update Project
export const updateProject = async (req, res, next) => {
  try {
    const updatedProject = await projectService.updateProject(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    next(error);
  }
};

// 8. Delete Project
export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
