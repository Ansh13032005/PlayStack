import { Employee } from '../models/Employee';

/**
 * Generates a unique employee ID in the format EMP001, EMP002, etc.
 */
export const generateEmployeeId = async (): Promise<string> => {
  const lastEmployee = await Employee.findOne(
    {},
    { employeeId: 1 },
    { sort: { createdAt: -1 } }
  );

  if (!lastEmployee || !lastEmployee.employeeId) {
    return 'EMP001';
  }

  const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
  const nextNumber = lastNumber + 1;
  return `EMP${String(nextNumber).padStart(3, '0')}`;
};
