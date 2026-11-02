import type { UserStatus } from '@/components/StatusBadge';
import type { OrganizationType } from '@/types/auth';
import type { ManagedUser, UserCount, UserPage } from '@/types/user';
import { api } from './apiClient';

// System Admin user management. All endpoints require a SYSTEM_ADMIN session.

export interface ListUsersParams {
  status?: UserStatus;
  organizationType?: OrganizationType;
  page: number;
  pageSize: number;
}

export function listUsers(params: ListUsersParams): Promise<UserPage> {
  return api<UserPage>('/admin/users', { query: { ...params } });
}

/** How many users there are per status and organisation type (for the filter cards). */
export async function getUserCounts(): Promise<UserCount[]> {
  const { counts } = await api<{ counts: UserCount[] }>('/admin/users/counts');
  return counts;
}

export async function getUser(id: string): Promise<ManagedUser> {
  const { user } = await api<{ user: ManagedUser }>(`/admin/users/${encodeURIComponent(id)}`);
  return user;
}

/** Approve/reject a pending registration, or disable/re-enable (`approved`) an account. */
export async function updateUserStatus(id: string, status: UserStatus): Promise<ManagedUser> {
  const { user } = await api<{ user: ManagedUser }>(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return user;
}
