import { AppError } from '../../../utils/AppError';
import { organizationRepository } from '../repository/organization.repository';

export interface OrgTreeNode {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation?: string;
  role: string;
  department?: { name: string };
  profileImage?: string;
  children: OrgTreeNode[];
}

export class OrganizationService {

  /**
   * Circular Reference Prevention Algorithm
   *
   * Scenario: A → B → C, and we try to set C's manager to A
   * → Traverse from the proposed manager (B) upward
   * → If we encounter A (the employee being updated), it's circular → REJECT
   *
   * Time: O(n) depth traversal
   */
  private async detectCircularReference(
    employeeId: string,
    proposedManagerId: string
  ): Promise<boolean> {
    let currentId: string | null = proposedManagerId;
    const visited = new Set<string>();

    while (currentId) {
      // Found the employee in the manager chain → circular!
      if (currentId === employeeId) return true;

      // Prevent infinite loop in case of existing corrupt data
      if (visited.has(currentId)) return true;
      visited.add(currentId);

      // Move up the chain
      const current = await organizationRepository.findByIdWithManager(currentId);
      if (!current || !current.reportingManager) break;

      const manager = current.reportingManager as any;
      currentId = manager._id ? manager._id.toString() : null;
    }

    return false;
  }

  async assignManager(employeeId: string, managerId: string | null) {
    // Cannot assign yourself as manager
    if (managerId && managerId === employeeId) {
      throw new AppError('An employee cannot be their own manager.', 400);
    }

    if (managerId) {
      // Verify the proposed manager exists
      const manager = await organizationRepository.findByIdWithManager(managerId);
      if (!manager) {
        throw new AppError('Proposed manager not found.', 404);
      }

      // Run circular reference check
      const isCircular = await this.detectCircularReference(employeeId, managerId);
      if (isCircular) {
        throw new AppError(
          'Cannot assign manager: this would create a circular reporting chain.',
          400
        );
      }
    }

    const updated = await organizationRepository.updateManager(employeeId, managerId);
    if (!updated) {
      throw new AppError('Employee not found.', 404);
    }

    return updated;
  }

  async getDirectReports(managerId: string) {
    const manager = await organizationRepository.findByIdWithManager(managerId);
    if (!manager) {
      throw new AppError('Manager not found.', 404);
    }

    const reports = await organizationRepository.findDirectReports(managerId);
    return {
      manager: {
        _id: manager._id,
        employeeId: manager.employeeId,
        firstName: manager.firstName,
        lastName: manager.lastName,
        role: manager.role,
      },
      directReports: reports,
      count: reports.length,
    };
  }

  /**
   * Build the full organization tree using an adjacency list approach.
   * Much faster than recursive DB calls — fetches all employees in ONE query,
   * then builds the tree in-memory.
   */
  async getOrganizationTree(): Promise<OrgTreeNode[]> {
    const allEmployees = await organizationRepository.findAllActive();

    // Build a map for O(1) access
    const employeeMap = new Map<string, OrgTreeNode>();
    allEmployees.forEach((emp: any) => {
      employeeMap.set(emp._id.toString(), {
        _id: emp._id.toString(),
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        designation: emp.designation,
        role: emp.role,
        department: emp.department,
        profileImage: emp.profileImage,
        children: [],
      });
    });

    // Build tree by linking children to parents
    const roots: OrgTreeNode[] = [];

    allEmployees.forEach((emp: any) => {
      const node = employeeMap.get(emp._id.toString())!;

      if (!emp.reportingManager) {
        // Top-level employee (CEO / Super Admin)
        roots.push(node);
      } else {
        const managerId = emp.reportingManager.toString();
        const parentNode = employeeMap.get(managerId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // Manager not found or deleted — treat as root
          roots.push(node);
        }
      }
    });

    return roots;
  }
}

export const organizationService = new OrganizationService();
