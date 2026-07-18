import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Users, Briefcase, UserCheck, UserX, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-md">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const { overview, charts, recentJoinees, salaryStats } = data;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const statCards = [
    { label: 'Total Employees', value: overview.totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Active Employees', value: overview.activeEmployees, icon: UserCheck, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
    { label: 'Inactive Employees', value: overview.inactiveEmployees, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Total Departments', value: overview.totalDepartments, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-900">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={cn("p-6 bg-white border rounded-xl shadow-sm", stat.border)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark-900 mt-2">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.bg)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution (Pie Chart) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-dark-900">Department Distribution</h2>
          </div>
          <div className="p-6 h-80 flex items-center justify-center">
            {charts?.departmentDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {charts.departmentDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value, 'Employees']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">No department data available</p>
            )}
          </div>
        </div>

        {/* Role Distribution (Bar Chart) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-dark-900">Role Distribution</h2>
          </div>
          <div className="p-6 h-80">
            {charts?.roleDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.roleDistribution}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f3f4f6' }} formatter={(value) => [value, 'Employees']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 flex h-full items-center justify-center">No role data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Joinees */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-dark-900">Recent Joinees</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJoinees.map((emp: any) => (
              <div key={emp._id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-dark-900">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-gray-500">{emp.designation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">{emp.employeeId}</p>
                  <p className="text-xs text-gray-400">{new Date(emp.joiningDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {recentJoinees.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">No recent joinees found.</div>
            )}
          </div>
        </div>

        {/* Salary Stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-dark-900">Financial Overview (Monthly)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Payroll Execution</p>
              <p className="text-3xl font-bold text-dark-900">
                ₹{salaryStats.totalSalary.toLocaleString()}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Average Salary</p>
                <p className="text-lg font-semibold text-dark-800">
                  ₹{salaryStats.averageSalary.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Max Salary</p>
                <p className="text-lg font-semibold text-dark-800">
                  ₹{salaryStats.maxSalary.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
