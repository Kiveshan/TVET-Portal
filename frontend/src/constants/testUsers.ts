import type { AuthUser } from '@/types/auth';

/**
 * Development-only logins, one per role, until the backend handles authentication.
 * Remove once real auth is wired up.
 */
export const TEST_PASSWORD = '123456';

export const TEST_USERS: AuthUser[] = [
  {
    id: 'test-tvet',
    name: 'Sipho Ndlovu',
    email: 'tvet@tvetportal.test',
    role: 'TVET',
    title: 'Data Capturer',
    institution: 'Majuba TVET College',
  },
  {
    id: 'test-dhet',
    name: 'Lerato Mokoena',
    email: 'dhet@tvetportal.test',
    role: 'DHET',
    title: 'Planning Officer',
    institution: 'Department of Higher Education and Training',
  },
  {
    id: 'test-admin',
    name: 'Nomsa Dlamini',
    email: 'admin@tvetportal.test',
    role: 'SYSTEM_ADMIN',
    title: 'Admin Clerk',
  },
];
