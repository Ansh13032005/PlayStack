import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../service/dashboard.service';
import { sendResponse } from '../../../utils/response';

export class DashboardController {

  // GET /api/dashboard/stats — Super Admin, HR Manager
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getDashboardStats();
      sendResponse(res, 200, true, 'Dashboard statistics fetched successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
