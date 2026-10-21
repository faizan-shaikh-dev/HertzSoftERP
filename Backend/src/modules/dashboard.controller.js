import * as dashboardService from './dashboard.service.js';

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardMetrics();
    return res.status(200).json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
