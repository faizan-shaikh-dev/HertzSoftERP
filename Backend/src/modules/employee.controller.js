import * as employeeService from './employee.service.js';

export const getEmployees = async (req, res, next) => {
  try {
    const data = await employeeService.getEmployees(req.query);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const data = await employeeService.getEmployeeById(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee/Intern record not found' }
      });
    }
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const data = await employeeService.createEmployee(req.body, userId);
    res.status(201).json({
      success: true,
      message: 'Employee / Intern record created successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const data = await employeeService.updateEmployee(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee/Intern not found' }
      });
    }
    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const deleted = await employeeService.deleteEmployee(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employee/Intern not found' }
      });
    }
    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeStats = async (req, res, next) => {
  try {
    const stats = await employeeService.getEmployeeStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
