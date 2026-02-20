import { User, UserRole } from './user.model';
import { TenantSelectionInfo } from './user-tenant.model';

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Login Response (can return token OR tenant list for multi-tenant users)
export interface LoginResponse {
  token?: string;
  user: User;
  tenants?: TenantSelectionInfo[]; // If user has multiple tenants
}

// Register Request (orphan user - no tenant_id)
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cpf?: string;
}

// JWT Token Payload (decoded)
export interface JwtPayload {
  user_id: number;
  email: string;
  active_tenant_id?: number; // Nullable - user may have no active tenant
  active_role?: string; // Role in the active tenant
  exp: number;
  iat: number;
  nbf: number;
}

// Auth State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  activeTenantId: number | null;
  activeRole: UserRole | null;
}
