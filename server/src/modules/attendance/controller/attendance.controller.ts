import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../service/attendance.service';
import { sendResponse } from '../../../utils/response';

export class AttendanceController {
  
  clockIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const record = await attendanceService.clockIn(employeeId);
      sendResponse(res, 200, true, 'Clocked in successfully', record);
    } catch (error: any) {
      if (error.message.includes('Already clocked in')) {
        sendResponse(res, 400, false, error.message);
        return;
      }
      next(error);
    }
  };

  clockOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const record = await attendanceService.clockOut(employeeId);
      sendResponse(res, 200, true, 'Clocked out successfully', record);
    } catch (error: any) {
      if (error.message.includes('clock') || error.message.includes('found')) {
        sendResponse(res, 400, false, error.message);
        return;
      }
      next(error);
    }
  };

  getTodayStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const record = await attendanceService.getTodayStatus(employeeId);
      sendResponse(res, 200, true, 'Today status fetched', record);
    } catch (error) {
      next(error);
    }
  };

  getMyAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const data = await attendanceService.getMyAttendance(employeeId, page, limit);
      sendResponse(res, 200, true, 'My attendance fetched', data);
    } catch (error) {
      next(error);
    }
  };

  getAllAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const employeeId = req.query.employeeId as string;
      const date = req.query.date as string;

      const data = await attendanceService.getAllAttendance(page, limit, employeeId, date);
      sendResponse(res, 200, true, 'All attendance fetched', data);
    } catch (error) {
      next(error);
    }
  };
}

export const attendanceController = new AttendanceController();
