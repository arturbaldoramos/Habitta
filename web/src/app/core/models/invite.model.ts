import { UserRole } from './user.model';

// Invite Status enum
export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Invite interface
export interface Invite {
  id: number;
  tenant_id: number;
  email: string;
  role: UserRole;
  token: string;
  status: InviteStatus;
  invited_by_user_id: number;
  accepted_by_user_id?: number;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  invited_by?: User;
  accepted_by?: User;
}

// Import types (to avoid circular dependencies)
type Tenant = any;
type User = any;

// Create Invite DTO
export interface CreateInviteDto {
  email: string;
  role: UserRole;
}

// Accept Invite DTO
export interface AcceptInviteDto {
  name?: string;
  password?: string;
  phone?: string;
  cpf?: string;
}
