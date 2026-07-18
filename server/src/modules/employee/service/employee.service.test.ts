import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService } from './employee.service';
import { employeeRepository } from '../repository/employee.repository';
import { Role } from '../../../models/Employee';
import { AppError } from '../../../utils/AppError';

vi.mock('../repository/employee.repository', () => ({
  employeeRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock('../../audit/service/audit.service', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../utils/generateEmployeeId', () => ({
  generateEmployeeId: vi.fn().mockResolvedValue('EMP001'),
}));

vi.mock('../../../utils/email', () => ({
  sendWelcomeEmail: vi.fn(),
}));

describe('EmployeeService', () => {
  const service = new EmployeeService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEmployee', () => {
    const basePayload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@company.com',
      password: 'Password123!',
      role: Role.EMPLOYEE,
      designation: 'Developer',
    };

    it('prevents HR Manager from creating a Super Admin', async () => {
      await expect(
        service.createEmployee(
          { ...basePayload, role: Role.SUPER_ADMIN },
          Role.HR_MANAGER,
          'hr-id'
        )
      ).rejects.toMatchObject({
        message: 'Only Super Admin can create another Super Admin.',
        statusCode: 403,
      });

      expect(employeeRepository.create).not.toHaveBeenCalled();
    });

    it('allows Super Admin to create a Super Admin', async () => {
      vi.mocked(employeeRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(employeeRepository.create).mockResolvedValue({
        _id: 'new-id',
        ...basePayload,
        employeeId: 'EMP001',
      } as any);

      const result = await service.createEmployee(
        { ...basePayload, role: Role.SUPER_ADMIN },
        Role.SUPER_ADMIN,
        'admin-id'
      );

      expect(result.employeeId).toBe('EMP001');
      expect(employeeRepository.create).toHaveBeenCalled();
    });

    it('rejects duplicate email addresses', async () => {
      vi.mocked(employeeRepository.findByEmail).mockResolvedValue({ _id: 'existing' } as any);

      await expect(
        service.createEmployee(basePayload, Role.HR_MANAGER, 'hr-id')
      ).rejects.toMatchObject({
        message: 'An employee with this email already exists.',
        statusCode: 409,
      });
    });
  });

  describe('updateEmployee', () => {
    it('restricts Employee role to own profile with limited fields', async () => {
      vi.mocked(employeeRepository.findById).mockResolvedValue({
        _id: 'emp-1',
        firstName: 'John',
        lastName: 'Smith',
      } as any);
      vi.mocked(employeeRepository.update).mockResolvedValue({
        _id: 'emp-1',
        phone: '9876543210',
      } as any);

      await service.updateEmployee(
        'emp-1',
        { phone: '9876543210', firstName: 'Hacked', role: Role.HR_MANAGER },
        Role.EMPLOYEE,
        'emp-1'
      );

      expect(employeeRepository.update).toHaveBeenCalledWith('emp-1', {
        phone: '9876543210',
        designation: undefined,
        profileImage: undefined,
      });
    });

    it('prevents Employee from updating another employee profile', async () => {
      vi.mocked(employeeRepository.findById).mockResolvedValue({
        _id: 'other-emp',
        firstName: 'Other',
        lastName: 'User',
      } as any);

      await expect(
        service.updateEmployee('other-emp', { phone: '9876543210' }, Role.EMPLOYEE, 'emp-1')
      ).rejects.toMatchObject({
        message: 'You can only update your own profile.',
        statusCode: 403,
      });
    });

    it('prevents HR Manager from assigning Super Admin role', async () => {
      vi.mocked(employeeRepository.findById).mockResolvedValue({
        _id: 'emp-1',
        firstName: 'John',
        lastName: 'Smith',
      } as any);

      await expect(
        service.updateEmployee('emp-1', { role: Role.SUPER_ADMIN }, Role.HR_MANAGER, 'hr-id')
      ).rejects.toMatchObject({
        message: 'Only Super Admin can assign the Super Admin role.',
        statusCode: 403,
      });
    });
  });
});
