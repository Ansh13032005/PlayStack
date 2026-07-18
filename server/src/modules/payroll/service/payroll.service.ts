import { payrollRepository } from '../repository/payroll.repository';
import { Employee, Status } from '../../../models/Employee';
import { Leave, LeaveStatus, LeaveType } from '../../../models/Leave';
import { Attendance } from '../../../models/Attendance';
import { PayrollStatus } from '../../../models/Payroll';
import { Types } from 'mongoose';
import { AppError } from '../../../utils/AppError';

export class PayrollService {
  async generateMonthlyPayroll(month: number, year: number, adminId: string) {
    if (month < 1 || month > 12) {
      throw new AppError('Invalid month', 400);
    }

    // Get number of days in the requested month
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const activeEmployees = await Employee.find({ 
      status: Status.ACTIVE,
      salary: { $gt: 0 } // only generate for employees with a defined salary
    });

    let generatedCount = 0;

    for (const employee of activeEmployees) {
      if (!employee.salary) continue;

      const perDaySalary = employee.salary / totalDaysInMonth;

      // 1. Fetch UNPAID Leaves
      // Note: We need to find leaves that overlap with the current month
      const unpaidLeaves = await Leave.find({
        employee: employee._id,
        leaveType: LeaveType.UNPAID,
        status: LeaveStatus.APPROVED,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      });

      let unpaidLeaveDays = 0;
      unpaidLeaves.forEach(leave => {
        // Calculate days falling exactly within this month
        const leaveStart = leave.startDate < startDate ? startDate : leave.startDate;
        const leaveEnd = leave.endDate > endDate ? endDate : leave.endDate;
        const diffTime = Math.abs(leaveEnd.getTime() - leaveStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        unpaidLeaveDays += diffDays;
      });

      // 2. Fetch Half-Days (uncovered by Half-Day paid leaves)
      // If the system marks attendance as Half-Day, we consider it a 0.5 deduction
      const halfDayAttendances = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate },
        isHalfDay: true
      });

      const halfDaysCount = halfDayAttendances.length;

      // Deductions
      const totalDeductionDays = unpaidLeaveDays + (halfDaysCount * 0.5);
      const deductionAmount = totalDeductionDays * perDaySalary;
      const netPay = Math.max(0, employee.salary - deductionAmount);

      await payrollRepository.createOrUpdatePayroll({
        employee: employee._id as Types.ObjectId,
        month,
        year,
        baseSalary: employee.salary,
        perDaySalary,
        totalDaysInMonth,
        unpaidLeaveDays,
        halfDays: halfDaysCount,
        lateDays: 0, // placeholder if lateness policy added later
        totalDeductionDays,
        deductionAmount,
        netPay,
        status: PayrollStatus.DRAFT,
      });

      generatedCount++;
    }

    return { message: `Successfully generated payroll for ${generatedCount} employees.` };
  }

  async getMyPayslips(employeeId: string, page = 1, limit = 10) {
    return await payrollRepository.getEmployeePayroll(employeeId, page, limit);
  }

  async getAllPayroll(month: number, year: number, page = 1, limit = 20) {
    return await payrollRepository.getAllPayroll(month, year, page, limit);
  }

  async markAsPaid(id: string, hrId: string) {
    const payroll = await payrollRepository.getPayrollById(id);
    if (!payroll) throw new AppError('Payroll record not found', 404);
    if (payroll.status === PayrollStatus.PAID) throw new AppError('Already paid', 400);
    
    return await payrollRepository.markAsPaid(id, hrId);
  }
}

export const payrollService = new PayrollService();
