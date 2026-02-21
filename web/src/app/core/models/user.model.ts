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

// Flat response from GET /api/users and GET /api/users/:id
export interface UserListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  unit_id: number | null;
}

// Update membership DTO (only fields a síndico can edit)
export interface UpdateMembershipDto {
  is_active?: boolean;
  unit_id?: number | null;
}

// Update Password DTO
export interface UpdatePasswordDto {
  old_password: string;
  new_password: string;
}
