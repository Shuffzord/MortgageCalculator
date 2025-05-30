import { Request } from 'express';
import { CreateUserData, UpdateUserData } from './user';
import { UserRecord } from 'firebase-admin/auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthRequest extends Request {
  user?: UserRecord;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends CreateUserData {}

export interface UpdateUserRequest extends UpdateUserData {}

export interface TokenResponse {
  token: string;
  user: Partial<UserRecord>;
}

export interface UserResponse {
  user: Partial<UserRecord>;
}

export interface ErrorResponse {
  error: string;
}