import { Request, Response, NextFunction } from 'express';
import { payrollService } from '../service/payroll.service';

export class PayrollController {
  async generatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.body;
      const result = await payrollService.generateMonthlyPayroll(month, year, req.user!.userId);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getAllPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year, page, limit } = req.query;
      const result = await payrollService.getAllPayroll(
        Number(month) || new Date().getMonth() + 1,
        Number(year) || new Date().getFullYear(),
        Number(page) || 1,
        Number(limit) || 20
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await payrollService.getMyPayslips(
        req.user!.userId,
        Number(page) || 1,
        Number(limit) || 10
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.markAsPaid(req.params.id as string, req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const payrollController = new PayrollController();
