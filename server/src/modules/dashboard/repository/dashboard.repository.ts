import { Employee, Status } from '../../../models/Employee';
import { Department } from '../../../models/Department';

export class DashboardRepository {

  async getEmployeeStats() {
    const [totalEmployees, activeEmployees, inactiveEmployees] =
      await Promise.all([
        Employee.countDocuments({ isDeleted: false }),
        Employee.countDocuments({ isDeleted: false, status: Status.ACTIVE }),
        Employee.countDocuments({ isDeleted: false, status: Status.INACTIVE }),
      ]);

    const distinctDepartments = await Employee.distinct('department', { isDeleted: false, department: { $ne: null } });
    const totalDepartments = distinctDepartments.length;

    return { totalEmployees, activeEmployees, inactiveEmployees, totalDepartments };
  }

  async getDepartmentDistribution() {
    return Employee.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $ifNull: ['$department', 'Unassigned'] },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  }

  async getRoleDistribution() {
    return Employee.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, role: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  }

  async getStatusDistribution() {
    return Employee.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
  }

  async getRecentJoinees(limit = 5) {
    return Employee.find({ isDeleted: false })
      .sort({ joiningDate: -1 })
      .limit(limit)
      .select('firstName lastName email employeeId designation joiningDate profileImage department');
  }

  async getMonthlySalaryExpenditure() {
    return Employee.aggregate([
      { $match: { isDeleted: false, status: Status.ACTIVE, salary: { $exists: true } } },
      {
        $group: {
          _id: null,
          totalSalary: { $sum: '$salary' },
          averageSalary: { $avg: '$salary' },
          maxSalary: { $max: '$salary' },
          minSalary: { $min: '$salary' },
        },
      },
      {
        $project: {
          _id: 0,
          totalSalary: 1,
          averageSalary: { $round: ['$averageSalary', 2] },
          maxSalary: 1,
          minSalary: 1,
        },
      },
    ]);
  }
}

export const dashboardRepository = new DashboardRepository();
