import { AppError } from '../../../utils/AppError';
import { departmentRepository } from '../repository/department.repository';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto/department.dto';
import { employeeRepository } from '../../employee/repository/employee.repository';

export class DepartmentService {
  async createDepartment(data: CreateDepartmentDto) {
    const existing = await departmentRepository.findByName(data.name);
    if (existing) {
      throw new AppError('Department with this name already exists.', 409);
    }

    if (data.headOfDepartment) {
      const emp = await employeeRepository.findById(data.headOfDepartment);
      if (!emp) throw new AppError('Head of Department not found.', 404);
    }

    return departmentRepository.create(data);
  }

  async getAllDepartments() {
    return departmentRepository.findAll();
  }

  async getDepartmentById(id: string) {
    const dept = await departmentRepository.findById(id);
    if (!dept) {
      throw new AppError('Department not found.', 404);
    }
    return dept;
  }

  async updateDepartment(id: string, data: UpdateDepartmentDto) {
    const dept = await departmentRepository.findById(id);
    if (!dept) {
      throw new AppError('Department not found.', 404);
    }

    if (data.name && data.name !== dept.name) {
      const existing = await departmentRepository.findByName(data.name);
      if (existing) {
        throw new AppError('Department with this name already exists.', 409);
      }
    }

    if (data.headOfDepartment) {
      const emp = await employeeRepository.findById(data.headOfDepartment);
      if (!emp) throw new AppError('Head of Department not found.', 404);
    }

    return departmentRepository.update(id, data);
  }

  async deleteDepartment(id: string) {
    const dept = await departmentRepository.findById(id);
    if (!dept) {
      throw new AppError('Department not found.', 404);
    }

    // Check if any employees are in this department
    const employeesInDept = await employeeRepository.findAll({ department: dept.name, limit: 1 });
    if (employeesInDept.employees.length > 0) {
      throw new AppError('Cannot delete department because there are employees assigned to it.', 400);
    }

    return departmentRepository.delete(id);
  }
}

export const departmentService = new DepartmentService();
