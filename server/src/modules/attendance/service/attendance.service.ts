import { attendanceRepository } from '../repository/attendance.repository';

export class AttendanceService {

  async clockIn(employeeId: string) {
    return attendanceRepository.clockIn(employeeId);
  }

  async clockOut(employeeId: string) {
    return attendanceRepository.clockOut(employeeId);
  }

  async getTodayStatus(employeeId: string) {
    return attendanceRepository.getTodayStatus(employeeId);
  }

  async getMyAttendance(employeeId: string, page: number, limit: number) {
    return attendanceRepository.getMyAttendance(employeeId, page, limit);
  }

  async getAllAttendance(page: number, limit: number, employeeId?: string, date?: string) {
    return attendanceRepository.getAllAttendance(page, limit, employeeId, date);
  }
}

export const attendanceService = new AttendanceService();
