import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../service/leave.service';
import { sendResponse } from '../../../utils/response';
import { Types } from 'mongoose';

export class LeaveController {
  
  applyForLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const leaveData = { ...req.body, employee: new Types.ObjectId(employeeId) };
      const record = await leaveService.applyForLeave(leaveData);
      sendResponse(res, 201, true, 'Leave request submitted successfully', record);
    } catch (error: any) {
      if (error.message.includes('before end date')) {
        sendResponse(res, 400, false, error.message);
        return;
      }
      next(error);
    }
  };

  getMyLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const data = await leaveService.getMyLeaves(employeeId, page, limit);
      sendResponse(res, 200, true, 'My leaves fetched', data);
    } catch (error) {
      next(error);
    }
  };

  getAllLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const data = await leaveService.getAllLeaves(page, limit, status);
      sendResponse(res, 200, true, 'All leaves fetched', data);
    } catch (error) {
      next(error);
    }
  };

  reviewLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveId = req.params.id as string;
      const { status, reviewNote } = req.body;
      const reviewerId = req.user!.userId;

      const record = await leaveService.reviewLeave(leaveId, status, reviewerId, reviewNote);
      sendResponse(res, 200, true, `Leave marked as ${status}`, record);
    } catch (error: any) {
      if (error.message.includes('Cannot review') || error.message.includes('not found')) {
        sendResponse(res, 400, false, error.message);
        return;
      }
      next(error);
    }
  };

  cancelLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveId = req.params.id as string;
      const employeeId = req.user!.userId;

      await leaveService.cancelLeave(leaveId, employeeId);
      sendResponse(res, 200, true, 'Leave request cancelled successfully');
    } catch (error: any) {
      if (error.message.includes('Cannot cancel') || error.message.includes('not found')) {
        sendResponse(res, 400, false, error.message);
        return;
      }
      next(error);
    }
  };
}

export const leaveController = new LeaveController();
