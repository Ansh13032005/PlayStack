import { AuditLog, AuditAction } from '../../../models/AuditLog';
import { Types } from 'mongoose';

export class AuditService {
  async log(
    userId: string,
    action: AuditAction,
    resource: string,
    details: string,
    resourceId?: string,
    ipAddress?: string
  ) {
    try {
      await AuditLog.create({
        user: new Types.ObjectId(userId),
        action,
        resource,
        resourceId,
        details,
        ipAddress,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't throw here to prevent audit logging failures from breaking the main app flow
    }
  }

  async getLogs(page: number, limit: number, filter: any = {}) {
    const skip = (page - 1) * limit;
    
    const [records, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    
    return { records, total, page, pages: Math.ceil(total / limit) };
  }
}

export const auditService = new AuditService();
