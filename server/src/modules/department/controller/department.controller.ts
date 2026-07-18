import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../service/department.service';
import { createDepartmentSchema, updateDepartmentSchema } from '../validation/department.validation';
import { sendResponse } from '../../../utils/response';

export class DepartmentController {
  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      // Normalise null → undefined so DTO is satisfied
      const data = {
        ...parsed.data,
        headOfDepartment: parsed.data.headOfDepartment ?? undefined,
      };

      const department = await departmentService.createDepartment(data);
      sendResponse(res, 201, true, 'Department created successfully', department);
    } catch (error) {
      next(error);
    }
  }

  async getAllDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await departmentService.getAllDepartments();
      sendResponse(res, 200, true, 'Departments retrieved successfully', departments);
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id as string);
      sendResponse(res, 200, true, 'Department retrieved successfully', department);
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      const { id } = req.params;

      // Normalise null → undefined so DTO is satisfied
      const data = {
        ...parsed.data,
        headOfDepartment: parsed.data.headOfDepartment ?? undefined,
      };

      const department = await departmentService.updateDepartment(id as string, data);
      sendResponse(res, 200, true, 'Department updated successfully', department);
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await departmentService.deleteDepartment(id as string);
      sendResponse(res, 200, true, 'Department deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
