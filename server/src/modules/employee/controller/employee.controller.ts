import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { employeeService } from '../service/employee.service';
import { createEmployeeSchema, updateEmployeeSchema, updateOwnProfileSchema, changePasswordSchema } from '../validation/employee.validation';
import { sendResponse } from '../../../utils/response';
import { Role } from '../../../models/Employee';
import { EmployeeQueryDto } from '../dto/employee.dto';

export class EmployeeController {

  // POST /api/employees — Super Admin, HR Manager
  async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      const employee = await employeeService.createEmployee(
        parsed.data,
        req.user!.role as Role,
        req.user!.userId
      );

      sendResponse(res, 201, true, 'Employee created successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/employees — Super Admin, HR Manager
  async getAllEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: EmployeeQueryDto = {
        page: req.query['page'] ? parseInt(String(req.query['page'])) : 1,
        limit: req.query['limit'] ? parseInt(String(req.query['limit'])) : 10,
        search: req.query['search'] as string | undefined,
        department: req.query['department'] as string | undefined,
        role: req.query['role'] as Role | undefined,
        status: req.query['status'] as any,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc',
      };

      const result = await employeeService.getAllEmployees(query);
      sendResponse(res, 200, true, 'Employees fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/employees/me — Any authenticated user
  async getOwnProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getOwnProfile(req.user!.userId);
      sendResponse(res, 200, true, 'Profile fetched successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/employees/me/change-password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      await employeeService.changePassword(req.user!.userId, parsed.data);
      sendResponse(res, 200, true, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/employees/:id — Super Admin, HR Manager (any), Employee (own only)
  async getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);

      // If Employee role, can only view own profile
      if (req.user!.role === Role.EMPLOYEE && req.user!.userId !== id) {
        sendResponse(res, 403, false, 'You can only view your own profile.');
        return;
      }

      const employee = await employeeService.getEmployeeById(id);
      sendResponse(res, 200, true, 'Employee fetched successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/employees/:id — Super Admin (all), HR Manager (no role change to SA), Employee (own limited)
  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);

      const isOwnProfile =
        req.user!.role === Role.EMPLOYEE && req.user!.userId === id;
      const schema = isOwnProfile ? updateOwnProfileSchema : updateEmployeeSchema;
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      const employee = await employeeService.updateEmployee(
        id,
        parsed.data,
        req.user!.role as Role,
        req.user!.userId
      );

      sendResponse(res, 200, true, 'Employee updated successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/employees/:id — Super Admin only (soft delete)
  async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      await employeeService.deleteEmployee(id, req.user!.userId);
      sendResponse(res, 200, true, 'Employee deleted successfully');
    } catch (error) {
      next(error);
    }
  }
  // PATCH /api/employees/:id/avatar — Upload to Cloudinary
  async uploadProfileImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);

      // Only Super Admin, HR Manager, or the employee themselves can upload
      if (
        req.user!.role === Role.EMPLOYEE &&
        req.user!.userId !== id
      ) {
        sendResponse(res, 403, false, 'You can only upload your own profile image.');
        return;
      }

      if (!req.file) {
        sendResponse(res, 400, false, 'No image file provided.');
        return;
      }

      // Cloudinary URL is attached to req.file.path by multer-storage-cloudinary
      const profileImage = (req.file as any).path;

      const employee = await employeeService.updateEmployee(
        id,
        { profileImage },
        req.user!.role as Role,
        req.user!.userId
      );

      sendResponse(res, 200, true, 'Profile image uploaded successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/employees/export — Super Admin, HR Manager
  async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Parser } = await import('json2csv');
      // Fetch all active employees without pagination
      const query: EmployeeQueryDto = {
        page: 1,
        limit: 10000,
      };
      
      const result = await employeeService.getAllEmployees(query);
      const employees = result.employees; // Changed from result.docs

      if (employees.length === 0) {
        sendResponse(res, 404, false, 'No employees to export');
        return;
      }

      // Map to flat structure for CSV
      const csvData = employees.map((emp: any) => ({
        'Employee ID': emp.employeeId,
        'First Name': emp.firstName,
        'Last Name': emp.lastName,
        'Email': emp.email,
        'Role': emp.role,
        'Designation': emp.designation,
        'Status': emp.status,
        'Department': emp.department ? (emp.department as any).name : 'N/A',
        'Manager ID': emp.managerId ? (emp.managerId as any).employeeId : 'N/A',
        'Joining Date': new Date(emp.joiningDate).toISOString().split('T')[0],
      }));

      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/employees/bulk-upload — Super Admin, HR Manager
  async bulkUploadCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        sendResponse(res, 400, false, 'No CSV file provided.');
        return;
      }

      const results: any[] = [];
      const stream = Readable.from(req.file.buffer.toString());

      stream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            // Process the parsed CSV data
            const createdEmployees = await employeeService.bulkCreateEmployees(
              results,
              req.user!.role as Role
            );
            sendResponse(res, 201, true, `Successfully imported ${createdEmployees.length} employees`, createdEmployees);
          } catch (error) {
            next(error);
          }
        })
        .on('error', (error) => {
          next(error);
        });
    } catch (error) {
      next(error);
    }
  }

}

export const employeeController = new EmployeeController();
