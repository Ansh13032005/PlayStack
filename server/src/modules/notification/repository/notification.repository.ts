import { Notification, INotification, NotificationType } from '../../../models/Notification';
import { Types } from 'mongoose';

export class NotificationRepository {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(data);
    return notification.save();
  }

  async getNotifications(employeeId: string, limit: number = 20) {
    return Notification.find({ recipient: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    return Notification.countDocuments({
      recipient: new Types.ObjectId(employeeId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, employeeId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), recipient: new Types.ObjectId(employeeId) },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(employeeId: string) {
    return Notification.updateMany(
      { recipient: new Types.ObjectId(employeeId), isRead: false },
      { isRead: true }
    );
  }
}

export const notificationRepository = new NotificationRepository();
