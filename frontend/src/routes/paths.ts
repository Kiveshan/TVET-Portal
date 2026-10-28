import type { UserRole } from '@/types/auth';

export const PATHS = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  dataReview: '/data-review',
  dataReviewSubmission: (id: string) => `/data-review/${id}`,
  dataReviewRejection: (id: string) => `/data-review/${id}/reject`,
  adminUsers: '/admin/users',
  adminUser: (id: string) => `/admin/users/${id}`,
} as const;

/** Where each role lands after signing in. */
export function homePathFor(role: UserRole): string {
  return role === 'SYSTEM_ADMIN' ? PATHS.adminUsers : PATHS.dashboard;
}
