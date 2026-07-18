import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

const editEmployeeSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), 'Phone must be a 10-digit number'),
  role: z.enum(['Employee', 'HR Manager', 'Super Admin']),
  department: z.string().optional(),
  designation: z.string().min(2, 'Designation is required'),
  salary: z.string().optional(),
  reportingManager: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type EditEmployeeForm = z.infer<typeof editEmployeeSchema>;

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export function EditEmployeeModal({ isOpen, onClose, employee }: EditEmployeeModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch employees for the manager dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: async () => {
      const res = await api.get('/employees?limit=1000');
      return res.data.data.employees;
    },
    enabled: isOpen,
  });

  // Fetch departments for the department dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditEmployeeForm>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Employee',
      department: '',
      designation: '',
      salary: '',
      reportingManager: '',
      status: 'Active',
    },
  });

  // Populate form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'Employee',
        department: employee.department || '',
        designation: employee.designation || '',
        salary: employee.salary ? String(employee.salary) : '',
        reportingManager: employee.reportingManager?._id || employee.reportingManager || '',
        status: employee.status || 'Active',
      });
    }
  }, [employee, reset]);

  if (!isOpen || !employee) return null;

  const onSubmit = async (data: EditEmployeeForm) => {
    try {
      setError(null);
      const payload = {
        ...data,
        salary: data.salary ? Number(data.salary) : undefined,
        reportingManager: data.reportingManager === '' ? null : data.reportingManager,
      };
      
      // We must call the PUT endpoint to update employee details
      await api.put(`/employees/${employee._id}`, payload);
      
      // We also must call PATCH /employees/:id/manager to assign the manager securely 
      if (payload.reportingManager !== undefined && employee) {
        if (payload.reportingManager !== employee.reportingManager) {
          await api.patch(`/employees/${employee._id}/manager`, { managerId: payload.reportingManager });
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.invalidateQueries({ queryKey: ['orgTree'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update employee');
    }
  };

  // Filter out the current employee from the manager list to prevent selecting self
  const availableManagers = employeesData?.filter((emp: any) => emp._id !== employee._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dark-900">Edit Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form id="edit-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">First Name</label>
                <input
                  type="text"
                  className={cn(
                    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                    errors.firstName && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('firstName')}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">Last Name</label>
                <input
                  type="text"
                  className={cn(
                    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                    errors.lastName && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('lastName')}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-900 mb-1">Email Address</label>
              <input
                type="email"
                className={cn(
                  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.email && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-900 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit number"
                className={cn(
                  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.phone && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register('phone')}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">Role</label>
                <select
                  className={cn(
                    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                    errors.role && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('role')}
                >
                  <option value="Employee">Employee</option>
                  <option value="HR Manager">HR Manager</option>
                  {user?.role === 'Super Admin' && (
                    <option value="Super Admin">Super Admin</option>
                  )}
                </select>
                {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">Status</label>
                <select
                  className={cn(
                    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                    errors.status && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('status')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-900 mb-1">Department</label>
              <select
                className={cn(
                  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.department && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register('department')}
              >
                <option value="">Select Department</option>
                {departmentsData?.map((dept: any) => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-900 mb-1">Reporting Manager</label>
              <select
                className={cn(
                  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.reportingManager && "border-red-300 focus:border-red-500 focus:ring-red-500"
                )}
                {...register('reportingManager')}
              >
                <option value="">None (Top Level)</option>
                {availableManagers?.map((emp: any) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
              {errors.reportingManager && <p className="mt-1 text-xs text-red-600">{errors.reportingManager.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">Designation</label>
                <input
                  type="text"
                  className={cn(
                    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                    errors.designation && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  {...register('designation')}
                />
                {errors.designation && <p className="mt-1 text-xs text-red-600">{errors.designation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-900 mb-1">Salary (Annual)</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className={cn(
                      "block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                      errors.salary && "border-red-300 focus:border-red-500 focus:ring-red-500"
                    )}
                    {...register('salary')}
                  />
                </div>
                {errors.salary && <p className="mt-1 text-xs text-red-600">{errors.salary.message}</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
