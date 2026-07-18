import { describe, it, expect } from 'vitest';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validation';

describe('employee validation schemas', () => {
  const validCreatePayload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@company.com',
    password: 'Password123!',
  };

  it('accepts valid create payload', () => {
    const result = createEmployeeSchema.safeParse(validCreatePayload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = createEmployeeSchema.safeParse({
      ...validCreatePayload,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = createEmployeeSchema.safeParse({
      ...validCreatePayload,
      phone: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid 10-digit phone number', () => {
    const result = createEmployeeSchema.safeParse({
      ...validCreatePayload,
      phone: '9876543210',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative salary on update', () => {
    const result = updateEmployeeSchema.safeParse({ salary: -100 });
    expect(result.success).toBe(false);
  });
});
