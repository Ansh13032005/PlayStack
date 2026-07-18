import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../service/notification.service';
import { sendResponse } from '../../../utils/response';

export class NotificationController {
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const data = await notificationService.getNotifications(employeeId, limit);
      sendResponse(res, 200, true, 'Notifications fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const count = await notificationService.getUnreadCount(employeeId);
      sendResponse(res, 200, true, 'Unread count fetched', { count });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = String(req.params['id'] || req.params.id);
      const employeeId = req.user!.userId;
      
      const notification = await notificationService.markAsRead(notificationId, employeeId);
      sendResponse(res, 200, true, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      await notificationService.markAllAsRead(employeeId);
      sendResponse(res, 200, true, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
