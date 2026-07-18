import { Leave, ILeave, LeaveStatus } from '../../../models/Leave';
import { Types } from 'mongoose';

export class LeaveRepository {
  async applyForLeave(leaveData: Partial<ILeave>): Promise<ILeave> {
    return Leave.create(leaveData);
  }

  async getMyLeaves(employeeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { employee: new Types.ObjectId(employeeId) };
    
    const [records, total] = await Promise.all([
      Leave.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Leave.countDocuments(filter),
    ]);
    
    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async getAllLeaves(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;

    const [records, total] = await Promise.all([
      Leave.find(filter)
        .populate('employee', 'firstName lastName email department')
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Leave.countDocuments(filter),
    ]);
    
    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async reviewLeave(leaveId: string, status: LeaveStatus, reviewerId: string, note?: string): Promise<ILeave> {
    const leave = await Leave.findById(leaveId);
    if (!leave) throw new Error('Leave request not found');

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error(`Cannot review a leave that is already ${leave.status}`);
    }

    leave.status = status;
    leave.reviewedBy = new Types.ObjectId(reviewerId);
    if (note) leave.reviewNote = note;

    return leave.save();
  }

  async cancelLeave(leaveId: string, employeeId: string): Promise<ILeave> {
    const leave = await Leave.findOne({ _id: leaveId, employee: new Types.ObjectId(employeeId) });
    if (!leave) throw new Error('Leave request not found or unauthorized');

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error(`Cannot cancel a leave that is already ${leave.status}`);
    }

    await Leave.deleteOne({ _id: leaveId });
    return leave;
  }
}

export const leaveRepository = new LeaveRepository();
