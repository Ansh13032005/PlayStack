import { Employee, IEmployee } from '../../../models/Employee';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto } from '../dto/employee.dto';
import { getPaginationOptions, buildPaginationResult } from '../../../utils/pagination';

export class EmployeeRepository {

  async create(data: CreateEmployeeDto & { employeeId: string }): Promise<IEmployee> {
    const employee = new Employee(data);
    return employee.save();
  }

  async findAll(query: EmployeeQueryDto) {
    const { page = 1, limit = 10, search, department, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const paginationOptions = getPaginationOptions({ page, limit });
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;

    // Build dynamic filter (Mongoose v9 — use plain object, types are inferred)
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter['$or'] = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) filter['department'] = department;
    if (role) filter['role'] = role;
    if (status) filter['status'] = status;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['firstName', 'lastName', 'salary', 'joiningDate', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('reportingManager', 'firstName lastName email employeeId')
        .select('-password')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(paginationOptions.limit),
      Employee.countDocuments(filter),
    ]);

    const pagination = buildPaginationResult(total, paginationOptions);
    return { employees, pagination };
  }

  async findById(id: string): Promise<IEmployee | null> {
    return Employee.findOne({ _id: id, isDeleted: false })
      .populate('reportingManager', 'firstName lastName email employeeId designation')
      .select('-password');
  }

  async findByIdWithPassword(id: string): Promise<IEmployee | null> {
    return Employee.findOne({ _id: id, isDeleted: false })
      .select('+password');
  }

  async findByEmail(email: string): Promise<IEmployee | null> {
    return Employee.findOne({ email, isDeleted: false });
  }

  async findByEmployeeId(employeeId: string): Promise<IEmployee | null> {
    return Employee.findOne({ employeeId, isDeleted: false });
  }

  async update(id: string, data: UpdateEmployeeDto): Promise<IEmployee | null> {
    return Employee.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('department', 'name')
      .populate('reportingManager', 'firstName lastName email employeeId')
      .select('-password');
  }

  async softDelete(id: string): Promise<IEmployee | null> {
    return Employee.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
  }

  async findDirectReports(managerId: string): Promise<IEmployee[]> {
    return Employee.find({ reportingManager: managerId, isDeleted: false })
      .select('-password')
      .populate('department', 'name');
  }
}

export const employeeRepository = new EmployeeRepository();
