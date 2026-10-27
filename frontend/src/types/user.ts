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
  role: string;
  persalNumber: string;
  status: UserStatus;
}
