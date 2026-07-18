import { Router } from 'express';
import { departmentController } from '../controller/department.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All department routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/departments — All authenticated users can view departments
router.get('/', (req, res, next) => departmentController.getAllDepartments(req, res, next));
router.get('/:id', (req, res, next) => departmentController.getDepartmentById(req, res, next));

// POST/PUT/DELETE require HR Manager or Super Admin
router.use(checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER));

router.post('/', (req, res, next) => departmentController.createDepartment(req, res, next));
router.put('/:id', (req, res, next) => departmentController.updateDepartment(req, res, next));
router.delete('/:id', (req, res, next) => departmentController.deleteDepartment(req, res, next));

export default router;
