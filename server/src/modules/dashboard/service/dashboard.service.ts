import { dashboardRepository } from '../repository/dashboard.repository';

export class DashboardService {

  async getDashboardStats() {
    // Run all queries in parallel for maximum performance
    const [
      employeeStats,
      departmentDistribution,
      roleDistribution,
      statusDistribution,
      recentJoinees,
      salaryStats,
    ] = await Promise.all([
      dashboardRepository.getEmployeeStats(),
      dashboardRepository.getDepartmentDistribution(),
      dashboardRepository.getRoleDistribution(),
      dashboardRepository.getStatusDistribution(),
      dashboardRepository.getRecentJoinees(5),
      dashboardRepository.getMonthlySalaryExpenditure(),
    ]);

    return {
      overview: {
        totalEmployees: employeeStats.totalEmployees,
        activeEmployees: employeeStats.activeEmployees,
        inactiveEmployees: employeeStats.inactiveEmployees,
        totalDepartments: employeeStats.totalDepartments,
      },
      charts: {
        departmentDistribution,
        roleDistribution,
        statusDistribution,
      },
      recentJoinees,
      salaryStats: salaryStats[0] ?? {
        totalSalary: 0,
        averageSalary: 0,
        maxSalary: 0,
        minSalary: 0,
      },
    };
  }
}

export const dashboardService = new DashboardService();
