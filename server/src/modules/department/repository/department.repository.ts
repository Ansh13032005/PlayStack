import { Department, IDepartment } from '../../../models/Department';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto/department.dto';

export class DepartmentRepository {
  async create(data: CreateDepartmentDto): Promise<IDepartment> {
    const department = new Department(data);
    return department.save();
  }

  async findAll(): Promise<IDepartment[]> {
    return Department.find().populate('headOfDepartment', 'firstName lastName email employeeId').sort({ name: 1 });
  }

  async findById(id: string): Promise<IDepartment | null> {
    return Department.findById(id).populate('headOfDepartment', 'firstName lastName email employeeId');
  }

  async findByName(name: string): Promise<IDepartment | null> {
    return Department.findOne({ name });
  }

  async update(id: string, data: UpdateDepartmentDto): Promise<IDepartment | null> {
    return Department.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate('headOfDepartment', 'firstName lastName email employeeId');
  }

  async delete(id: string): Promise<IDepartment | null> {
    return Department.findByIdAndDelete(id);
  }
}

export const departmentRepository = new DepartmentRepository();
