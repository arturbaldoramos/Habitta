import { UserRole } from './user.model';

// UserTenant interface - pivot table for many-to-many relationship
export interface UserTenant {
  id: number;
  user_id: number;
  tenant_id: number;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: User;
  tenant?: Tenant;
}

// Import types (to avoid circular dependencies)
type User = any;
type Tenant = any;

// Tenant Selection Info (for multi-tenant login)
export interface TenantSelectionInfo {
  tenant_id: number;
  tenant_name: string;
  role: UserRole;
}
