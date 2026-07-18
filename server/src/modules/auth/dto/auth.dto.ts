import { IEmployee } from '../../../models/Employee';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  employee: Partial<IEmployee>;
}
