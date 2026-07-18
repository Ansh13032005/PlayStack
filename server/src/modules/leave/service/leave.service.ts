import { leaveRepository } from '../repository/leave.repository';
import { Leave, ILeave, LeaveStatus, LeaveType } from '../../../models/Leave';
import { Employee, Role } from '../../../models/Employee';
import { notificationService } from '../../notification/service/notification.service';
import { NotificationType } from '../../../models/Notification';
import { Attendance, AttendanceStatus } from '../../../models/Attendance';

export class LeaveService {
  async applyForLeave(leaveData: Partial<ILeave>) {
    const start = new Date(leaveData.startDate!);
    const end = new Date(leaveData.endDate!);

    // Basic validation
    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    // 1. Overlapping Leave Check
    const overlappingLeave = await Leave.findOne({
      employee: leaveData.employee,
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingLeave) {
      throw new Error('You already have a pending or approved leave during this period.');
    }

    // 2. Annual Leave Quota Enforcement
    if (leaveData.leaveType !== LeaveType.UNPAID) {
      const yearStart = new Date(start.getFullYear(), 0, 1);
      const yearEnd = new Date(start.getFullYear(), 11, 31, 23, 59, 59);

      const existingLeaves = await Leave.find({
        employee: leaveData.employee,
        leaveType: leaveData.leaveType,
        status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { $gte: yearStart, $lte: yearEnd }
      });

      const usedDays = existingLeaves.reduce((acc, leave) => acc + leave.totalDays, 0);
      const requestedDays = leaveData.totalDays || 0;

      const limits = {
        [LeaveType.SICK]: 10,
        [LeaveType.CASUAL]: 12,
        [LeaveType.EARNED]: 15,
      };

      const maxDays = limits[leaveData.leaveType as keyof typeof limits];

      if (usedDays + requestedDays > maxDays) {
        throw new Error(`Annual quota exceeded for ${leaveData.leaveType} leave. You have ${Math.max(0, maxDays - usedDays)} days left.`);
      }
    }

    const leave = await leaveRepository.applyForLeave(leaveData);
    
    // Notify HR Managers and Super Admins
    const admins = await Employee.find({ role: { $in: [Role.SUPER_ADMIN, Role.HR_MANAGER] } });
    const employee = await Employee.findById(leaveData.employee);
    
    admins.forEach(admin => {
      notificationService.createNotification(
        admin.id,
        'New Leave Request',
        `${employee?.firstName} ${employee?.lastName} applied for leave.`,
        NotificationType.LEAVE,
        '/leaves'
      ).catch(console.error);
    });

    return leave;
  }

  async getMyLeaves(employeeId: string, page: number, limit: number) {
    return leaveRepository.getMyLeaves(employeeId, page, limit);
  }

  async getAllLeaves(page: number, limit: number, status?: string) {
    return leaveRepository.getAllLeaves(page, limit, status);
  }

  async reviewLeave(leaveId: string, status: LeaveStatus, reviewerId: string, note?: string) {
    const leave = await leaveRepository.reviewLeave(leaveId, status, reviewerId, note);
    if (leave) {
      notificationService.createNotification(
        leave.employee.toString(),
        `Leave Request ${status}`,
        `Your leave request was ${status.toLowerCase()}.`,
        NotificationType.LEAVE,
        '/leaves'
      ).catch(console.error);

      // If approved, create Attendance records marked as ON_LEAVE
      if (status === LeaveStatus.APPROVED) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const attendanceRecords = [];

        // Loop through each day from start to end date
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Skip weekends (0 = Sunday, 6 = Saturday)
          if (d.getDay() !== 0 && d.getDay() !== 6) {
            const dateStr = d.toISOString().split('T')[0];
            const recordDate = new Date(dateStr);
            recordDate.setHours(0, 0, 0, 0);

            attendanceRecords.push({
              updateOne: {
                filter: { employee: leave.employee, date: recordDate },
                update: {
                  $set: {
                    employee: leave.employee,
                    date: recordDate,
                    status: AttendanceStatus.ON_LEAVE,
                    notes: `On ${leave.leaveType} Leave`,
                  }
                },
                upsert: true
              }
            });
          }
        }

        if (attendanceRecords.length > 0) {
          Attendance.bulkWrite(attendanceRecords).catch(console.error);
        }
      }
    }
    return leave;
  }

  async cancelLeave(leaveId: string, employeeId: string) {
    return leaveRepository.cancelLeave(leaveId, employeeId);
  }
}

export const leaveService = new LeaveService();
