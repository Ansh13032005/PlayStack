import { AppError } from '../../../utils/AppError';
import { generateEmployeeId } from '../../../utils/generateEmployeeId';
import { employeeRepository } from '../repository/employee.repository';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from '../dto/employee.dto';
import { Role } from '../../../models/Employee';
import { sendWelcomeEmail } from '../../../utils/email';
import { auditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../../models/AuditLog';

export class EmployeeService {

  async createEmployee(data: CreateEmployeeDto, createdByRole: Role, creatorId: string) {
    // HR Manager cannot create Super Admin
    if (data.role === Role.SUPER_ADMIN && createdByRole !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Admin can create another Super Admin.', 403);
    }

    // Check duplicate email
    const existingEmail = await employeeRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError('An employee with this email already exists.', 409);
    }

    // Auto-generate employee ID
    const employeeId = await generateEmployeeId();

    const employee = await employeeRepository.create({ ...data, employeeId });
    
    // Fire and forget welcome email
    sendWelcomeEmail(employee.email, employee.firstName, employee.employeeId);

    await auditService.log(
      creatorId,
      AuditAction.CREATE,
      'Employee',
      `Created employee ${employee.firstName} ${employee.lastName}`,
      employee._id.toString()
    );
    
    return employee;
  }

  async getAllEmployees(query: EmployeeQueryDto) {
    return employeeRepository.findAll(query);
  }

  async getEmployeeById(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }
    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeDto, requestingRole: Role, requestingUserId: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    // HR Manager cannot change role to Super Admin
    if (data.role === Role.SUPER_ADMIN && requestingRole !== Role.SUPER_ADMIN) {
      throw new AppError('Only Super Admin can assign the Super Admin role.', 403);
    }

    // Employee role can only update their own profile and limited fields
    if (requestingRole === Role.EMPLOYEE) {
      if (employee._id.toString() !== requestingUserId) {
        throw new AppError('You can only update your own profile.', 403);
      }
      // Strip restricted fields for Employee role
      const { phone, designation, profileImage } = data;
      const updated = await employeeRepository.update(id, { phone, designation, profileImage });
      
      await auditService.log(requestingUserId, AuditAction.UPDATE, 'Employee', `Updated own profile`, id);
      return updated;
    }

    const updated = await employeeRepository.update(id, data);
    await auditService.log(requestingUserId, AuditAction.UPDATE, 'Employee', `Updated employee ${employee.firstName} ${employee.lastName}`, id);
    return updated;
  }

  async deleteEmployee(id: string, requestingUserId: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    // Cannot delete yourself
    if (employee._id.toString() === requestingUserId) {
      throw new AppError('You cannot delete your own account.', 400);
    }

    const result = await employeeRepository.softDelete(id);
    await auditService.log(requestingUserId, AuditAction.DELETE, 'Employee', `Deleted employee ${employee.firstName} ${employee.lastName}`, id);
    return result;
  }

  async getOwnProfile(userId: string) {
    const employee = await employeeRepository.findById(userId);
    if (!employee) {
      throw new AppError('Profile not found.', 404);
    }
    return employee;
  }

  async changePassword(userId: string, data: import('../dto/employee.dto').ChangePasswordDto) {
    const employee = await employeeRepository.findByIdWithPassword(userId);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    if (!data.currentPassword || !data.newPassword) {
      throw new AppError('Both current and new passwords are required.', 400);
    }

    const isMatch = await employee.comparePassword(data.currentPassword);
    if (!isMatch) {
      throw new AppError('Incorrect current password.', 401);
    }

    employee.password = data.newPassword;
    employee.forcePasswordChange = false;
    await employee.save();

    return { success: true };
  }

  async bulkCreateEmployees(employeesData: any[], createdByRole: Role) {
    const createdEmployees = [];
    const errors = [];

    for (const [index, row] of employeesData.entries()) {
      try {
        const email = row['Email'] || row['email'];
        const firstName = row['First Name'] || row['firstName'];
        const lastName = row['Last Name'] || row['lastName'];
        const role = row['Role'] || row['role'] || Role.EMPLOYEE;
        
        if (!email || !firstName || !lastName) {
          throw new Error('Missing required fields (Email, First Name, Last Name)');
        }

        // HR Manager cannot create Super Admin
        if (role === Role.SUPER_ADMIN && createdByRole !== Role.SUPER_ADMIN) {
          throw new Error('Only Super Admin can create another Super Admin.');
        }

        // Check duplicate email
        const existingEmail = await employeeRepository.findByEmail(email);
        if (existingEmail) {
          throw new Error('An employee with this email already exists.');
        }

        // Auto-generate employee ID
        const employeeId = await generateEmployeeId();

        const employee = await employeeRepository.create({
          employeeId,
          email,
          firstName,
          lastName,
          role,
          designation: row['Designation'] || row['designation'] || 'Employee',
          department: undefined,
          reportingManager: undefined,
          password: 'Password123!', // Default password for bulk upload
          forcePasswordChange: true,
          joiningDate: new Date().toISOString(),
        });
        
        createdEmployees.push(employee);
        
        // Fire and forget welcome email
        sendWelcomeEmail(employee.email, employee.firstName, employee.employeeId);
      } catch (error: any) {
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    if (createdEmployees.length === 0 && errors.length > 0) {
      throw new AppError(`Bulk import failed. Errors: ${errors.join(', ')}`, 400);
    }

    return createdEmployees;
  }
}

export const employeeService = new EmployeeService();
