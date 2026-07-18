import { IEmployee } from '../../../models/Employee';

export interface LoginDto {
  email: string;
  password: string;
  portal?: 'employee' | 'hr' | 'admin';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  employee: Partial<IEmployee>;
}
