import { Employee, IEmployee } from '../../../models/Employee';

export class OrganizationRepository {

  // Find all employees with no reporting manager (top of tree)
  async findRootEmployees(): Promise<IEmployee[]> {
    return Employee.find({
      reportingManager: { $exists: false },
      isDeleted: false,
    })
      .select('-password')
      .populate('department', 'name');
  }

  // Find direct reports of a manager
  async findDirectReports(managerId: string): Promise<IEmployee[]> {
    return Employee.find({
      reportingManager: managerId,
      isDeleted: false,
    })
      .select('-password')
      .populate('department', 'name')
      .populate('reportingManager', 'firstName lastName employeeId');
  }

  // Find employee with their manager populated (for chain traversal)
  async findByIdWithManager(id: string): Promise<IEmployee | null> {
    return Employee.findOne({ _id: id, isDeleted: false })
      .select('_id firstName lastName employeeId reportingManager role')
      .populate('reportingManager', '_id firstName lastName employeeId');
  }

  // Update reporting manager
  async updateManager(
    employeeId: string,
    managerId: string | null
  ): Promise<IEmployee | null> {
    const update =
      managerId === null
        ? { $unset: { reportingManager: 1 } }
        : { $set: { reportingManager: managerId } };

    return Employee.findOneAndUpdate(
      { _id: employeeId, isDeleted: false },
      update,
      { new: true }
    )
      .select('-password')
      .populate('department', 'name')
      .populate('reportingManager', 'firstName lastName employeeId designation');
  }

  // Get all active employees (for building full tree)
  async findAllActive(): Promise<IEmployee[]> {
    return Employee.find({ isDeleted: false })
      .select('-password')
      .populate('department', 'name')
      .lean();
  }
}

export const organizationRepository = new OrganizationRepository();
