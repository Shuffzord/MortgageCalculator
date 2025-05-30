import { Request } from 'express';
import { User, CreateUserData, UpdateUserData } from './user';
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
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface ErrorResponse {
  error: string;
}