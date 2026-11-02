import type { Prisma } from '../../generated/prisma/client.ts';
import type { UserStatus } from '../../generated/prisma/enums.ts';

// The API speaks the frontend's shapes (see frontend/src/types), not the database's columns.

export const DHET_NAME = 'Department of Higher Education and Training';

export const sessionUserInclude = {
  job_role: { select: { name: true } },
  institution: { select: { name: true } },
} satisfies Prisma.UserInclude;

export type SessionUser = Prisma.UserGetPayload<{ include: typeof sessionUserInclude }>;

/** The signed-in user, as `AuthUser` in the frontend. */
export function toAuthUser(user: SessionUser) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    title: user.job_role.name,
    institution: user.institution?.name ?? (user.role === 'DHET' ? DHET_NAME : undefined),
  };
}

export type ApiUserStatus = Lowercase<UserStatus>;

export const toApiStatus = (status: UserStatus) => status.toLowerCase() as ApiUserStatus;
export const fromApiStatus = (status: ApiUserStatus) => status.toUpperCase() as UserStatus;

/** A registered user as the System Admin sees them, as `ManagedUser` in the frontend. */
export function toManagedUser(user: SessionUser) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    organizationType: user.role,
    organization: user.institution?.name ?? 'DHET',
    role: user.job_role.name,
    persalNumber: user.persal_number ?? '',
    status: toApiStatus(user.status),
    createdAt: user.created_at,
    reviewedAt: user.reviewed_at,
  };
}
