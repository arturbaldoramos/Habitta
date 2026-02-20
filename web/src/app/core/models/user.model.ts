// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  SINDICO = 'sindico',
  MORADOR = 'morador',
}

// User interface (multi-tenant - user can belong to multiple tenants)
export interface User {
  id: number;
  email: string;
  name: string;
  active: boolean;
  phone?: string;
  cpf?: string;
  unit_id?: number;
  created_at: string;
  updated_at: string;
  user_tenants?: UserTenant[];
  tenants?: Tenant[];
  unit?: Unit;
}

// Import types (to avoid circular dependencies, we use any for now)
type Tenant = any;
type Unit = any;
type UserTenant = any;

// Create User DTO
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cpf?: string;
}

// Update User DTO
export interface UpdateUserDto {
  email?: string;
  name?: string;
  phone?: string;
  cpf?: string;
  unit_id?: number;
  active?: boolean;
}

// Update Password DTO
export interface UpdatePasswordDto {
  old_password: string;
  new_password: string;
}
