import type { UserRole } from '@/types/auth';

export const PATHS = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  adminUsers: '/admin/users',
  adminUser: (id: string) => `/admin/users/${id}`,
} as const;

/** Where each role lands after signing in. */
export function homePathFor(role: UserRole): string {
  return role === 'SYSTEM_ADMIN' ? PATHS.adminUsers : PATHS.dashboard;
}
