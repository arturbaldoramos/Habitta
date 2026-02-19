import { User, UserRole } from './user.model';

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Login Response
export interface LoginResponse {
  token: string;
  user: User;
}

// Register Request
export interface RegisterRequest {
  tenant_id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
}

// JWT Token Payload (decoded)
export interface JwtPayload {
  user_id: number;
  tenant_id: number;
  email: string;
  role: string;
  exp: number;
  iat: number;
  nbf: number;
}

// Auth State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  tenantId: number | null;
}
