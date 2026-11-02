import type { UserStatus } from '@/components/StatusBadge';
import type { OrganizationType } from './auth';

/** A registered portal user, as managed by the System Admin. */
export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  organizationType: OrganizationType;
  /** DHET, or the user's TVET college. */
  organization: string;
  /** Job title, e.g. "Campus Manager". */
  role: string;
  persalNumber: string;
  status: UserStatus;
}

/** One page of users from the API. */
export interface UserPage {
  items: ManagedUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserCount {
  status: UserStatus;
  organizationType: OrganizationType;
  count: number;
}
