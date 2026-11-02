import type { Prisma } from '../../generated/prisma/client.ts';
import type { UserStatus } from '../../generated/prisma/enums.ts';
import { prisma } from '../../lib/prisma.ts';
import { HttpError } from '../../utils/HttpError.ts';
import { fromApiStatus, sessionUserInclude, toApiStatus, toManagedUser } from './user.mapper.ts';
import type { ListUsersInput, StatusChange } from './users.schemas.ts';

// The System Admin manages the people who registered, never other admins.
const REGISTERED_USERS = { role: { in: ['DHET', 'TVET'] } } satisfies Prisma.UserWhereInput;

/** Which status each status may move to. Approve/reject is only for pending registrations. */
const ALLOWED_CHANGES: Record<UserStatus, UserStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['DISABLED'],
  DISABLED: ['APPROVED'],
  REJECTED: [],
};

export async function listUsers({ status, organizationType, page, pageSize }: ListUsersInput) {
  const where: Prisma.UserWhereInput = {
    ...REGISTERED_USERS,
    ...(status && { status: fromApiStatus(status) }),
    ...(organizationType && { role: organizationType }),
  };

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  // Clamp, so a page that no longer exists (e.g. after disabling the last user on it) shows the last one.
  const currentPage = Math.min(page, totalPages);

  const users = await prisma.user.findMany({
    where,
    include: sessionUserInclude,
    orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return { items: users.map(toManagedUser), page: currentPage, pageSize, total, totalPages };
}

/** User counts per status and organisation type, for the KPI filter cards. */
export async function countUsers() {
  const groups = await prisma.user.groupBy({
    by: ['status', 'role'],
    where: REGISTERED_USERS,
    _count: { _all: true },
  });

  return groups.map((group) => ({
    status: toApiStatus(group.status),
    organizationType: group.role,
    count: group._count._all,
  }));
}

export async function getUser(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, ...REGISTERED_USERS },
    include: sessionUserInclude,
  });
  if (!user) throw new HttpError(404, 'User not found');
  return toManagedUser(user);
}

export async function changeStatus(id: string, change: StatusChange, adminId: string) {
  const user = await prisma.user.findFirst({ where: { id, ...REGISTERED_USERS } });
  if (!user) throw new HttpError(404, 'User not found');

  const next = fromApiStatus(change);
  if (!ALLOWED_CHANGES[user.status].includes(next)) {
    throw new HttpError(409, `This account is ${toApiStatus(user.status)} and can't be ${change}`, {
      code: 'INVALID_STATUS_CHANGE',
    });
  }

  const isReview = user.status === 'PENDING';

  // Only update if the status is still what we checked, so two admins acting at once can't both win.
  const { count } = await prisma.user.updateMany({
    where: { id, status: user.status },
    data: {
      status: next,
      ...(isReview && { reviewed_by_id: adminId, reviewed_at: new Date() }),
    },
  });
  if (count === 0) {
    throw new HttpError(409, 'This user was just updated by someone else. Refresh and try again', {
      code: 'STALE_STATUS',
    });
  }

  return getUser(id);
}
