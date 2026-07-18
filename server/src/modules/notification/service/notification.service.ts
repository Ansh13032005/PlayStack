import { notificationRepository } from '../repository/notification.repository';
import { AppError } from '../../../utils/AppError';
import { NotificationType } from '../../../models/Notification';
import { Types } from 'mongoose';

export class NotificationService {
  async createNotification(
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string
  ) {
    return notificationRepository.createNotification({
      recipient: new Types.ObjectId(recipientId),
      title,
      message,
      type,
      link,
    });
  }

  async getNotifications(employeeId: string, limit?: number) {
    return notificationRepository.getNotifications(employeeId, limit);
  }

  async getUnreadCount(employeeId: string) {
    return notificationRepository.getUnreadCount(employeeId);
  }

  async markAsRead(notificationId: string, employeeId: string) {
    const notification = await notificationRepository.markAsRead(notificationId, employeeId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return notification;
  }

  async markAllAsRead(employeeId: string) {
    return notificationRepository.markAllAsRead(employeeId);
  }
}

export const notificationService = new NotificationService();
