import { Attendance, AttendanceStatus, IAttendance } from '../../../models/Attendance';
import { Types } from 'mongoose';

export class AttendanceRepository {

  async clockIn(employeeId: string): Promise<IAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employee: new Types.ObjectId(employeeId),
      date: today,
    });

    if (existing) {
      if (existing.clockIn) throw new Error('Already clocked in for today.');
      existing.clockIn = new Date();
      existing.status = AttendanceStatus.PRESENT;
      return existing.save();
    }

    const clockInTime = new Date();
    const nineAM = new Date();
    nineAM.setHours(9, 0, 0, 0);

    const status = clockInTime > nineAM ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    return Attendance.create({
      employee: new Types.ObjectId(employeeId),
      date: today,
      clockIn: clockInTime,
      status,
    });
  }

  async clockOut(employeeId: string): Promise<IAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({
      employee: new Types.ObjectId(employeeId),
      date: today,
    });

    if (!record) throw new Error('No clock-in record found for today.');
    if (record.clockOut) throw new Error('Already clocked out for today.');
    if (!record.clockIn) throw new Error('Must clock in before clocking out.');

    const clockOutTime = new Date();
    const totalMs = clockOutTime.getTime() - record.clockIn.getTime();
    const totalHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;

    record.clockOut = clockOutTime;
    record.totalHours = totalHours;

    // If worked less than 4 hours, mark as Half-Day
    if (totalHours < 4) {
      record.status = AttendanceStatus.HALF_DAY;
    }

    return record.save();
  }

  async getTodayStatus(employeeId: string): Promise<IAttendance | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Attendance.findOne({ employee: new Types.ObjectId(employeeId), date: today });
  }

  async getMyAttendance(employeeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { employee: new Types.ObjectId(employeeId) };
    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ]);
    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async getAllAttendance(page: number, limit: number, employeeId?: string, date?: string) {
    const filter: any = {};
    if (employeeId) filter.employee = new Types.ObjectId(employeeId);
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: end };
    }
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'firstName lastName employeeId department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);
    return { records, total, page, pages: Math.ceil(total / limit) };
  }
}

export const attendanceRepository = new AttendanceRepository();
