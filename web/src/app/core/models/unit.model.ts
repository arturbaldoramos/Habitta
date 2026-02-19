// Unit interface
export interface Unit {
  id: number;
  tenant_id: number;
  number: string;
  block?: string;
  floor?: number;
  area?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  occupied: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  users?: User[];
}

// Import types (to avoid circular dependencies)
type Tenant = any;
type User = any;

// Create Unit DTO
export interface CreateUnitDto {
  number: string;
  block?: string;
  floor?: number;
  area?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  occupied?: boolean;
}

// Update Unit DTO
export interface UpdateUnitDto {
  number?: string;
  block?: string;
  floor?: number;
  area?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  occupied?: boolean;
  active?: boolean;
}
