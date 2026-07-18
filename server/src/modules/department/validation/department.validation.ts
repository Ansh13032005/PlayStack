import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string({ error: 'Department name is required' }).min(2, 'Department name must be at least 2 characters').trim(),
  description: z.string().trim().optional(),
  headOfDepartment: z.string().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).trim().optional(),
  description: z.string().trim().optional(),
  headOfDepartment: z.string().optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
