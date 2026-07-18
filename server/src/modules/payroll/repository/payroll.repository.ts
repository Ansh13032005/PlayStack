import { Payroll, IPayroll, PayrollStatus } from '../../../models/Payroll';
import { Types } from 'mongoose';

export class PayrollRepository {
  async createOrUpdatePayroll(data: Partial<IPayroll>) {
    return Payroll.findOneAndUpdate(
      { employee: data.employee, month: data.month, year: data.year },
      { $set: data },
      { new: true, upsert: true }
    );
  }

  async getPayrollById(id: string) {
    return Payroll.findById(id).populate('employee', 'firstName lastName email department designation');
  }

  async getEmployeePayroll(employeeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Payroll.find({ employee: new Types.ObjectId(employeeId) })
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments({ employee: new Types.ObjectId(employeeId) })
    ]);
    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async getAllPayroll(month: number, year: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { month, year };
    
    const [records, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employee', 'firstName lastName employeeId department salary status')
        .sort({ 'createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter)
    ]);
    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async markAsPaid(id: string, hrId: string) {
    return Payroll.findByIdAndUpdate(
      id,
      { status: PayrollStatus.PAID, processedBy: new Types.ObjectId(hrId) },
      { new: true }
    );
  }
}

export const payrollRepository = new PayrollRepository();
