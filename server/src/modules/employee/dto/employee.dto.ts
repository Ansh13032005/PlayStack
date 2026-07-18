import { Role, Status } from '../../../models/Employee';

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  joiningDate?: string;
  status?: Status;
  role?: Role;
  reportingManager?: string;
  forcePasswordChange?: boolean;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  joiningDate?: string;
  status?: Status;
  role?: Role;
  reportingManager?: string;
  profileImage?: string;
}

export interface EmployeeQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  role?: Role;
  status?: Status;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}
