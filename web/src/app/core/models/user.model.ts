// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  SINDICO = 'sindico',
  MORADOR = 'morador',
}

// User interface
export interface User {
  id: number;
  tenant_id: number;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  cpf?: string;
  unit_id?: number;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  unit?: Unit;
}

// Import types (to avoid circular dependencies, we use any for now)
type Tenant = any;
type Unit = any;

// Create User DTO
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  unit_id?: number;
}

// Update User DTO
export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
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
