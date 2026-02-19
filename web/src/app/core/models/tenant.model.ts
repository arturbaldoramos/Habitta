// Tenant interface
export interface Tenant {
  id: number;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  users?: User[];
  units?: Unit[];
}

// Import types (to avoid circular dependencies)
type User = any;
type Unit = any;

// Create Tenant DTO
export interface CreateTenantDto {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
}

// Update Tenant DTO
export interface UpdateTenantDto {
  name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}
