import { Prisma } from '../../generated/prisma/client.ts';
import type { UserStatus } from '../../generated/prisma/enums.ts';
import { hashPassword, verifyPasswordOrDummy } from '../../lib/password.ts';
import { prisma } from '../../lib/prisma.ts';
import { HttpError } from '../../utils/HttpError.ts';
import { sessionUserInclude, type SessionUser } from '../users/user.mapper.ts';
import type { LoginInput, RegisterInput } from './auth.schemas.ts';

const BLOCKED_STATUS: Partial<Record<UserStatus, { code: string; message: string }>> = {
  PENDING: {
    code: 'ACCOUNT_PENDING',
    message: 'Your registration is still awaiting approval from the System Admin',
  },
  REJECTED: {
    code: 'ACCOUNT_REJECTED',
    message: 'Your registration was not approved. Contact the System Admin for help',
  },
  DISABLED: {
    code: 'ACCOUNT_DISABLED',
    message: 'Your account has been disabled. Contact the System Admin for help',
  },
};

export async function login({ email, password }: LoginInput): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { email }, include: sessionUserInclude });

  if (!(await verifyPasswordOrDummy(password, user?.password_hash)) || !user) {
    throw new HttpError(401, 'Incorrect email address or password', { code: 'INVALID_CREDENTIALS' });
  }

  // Only reveal the account's status once the password has proven who is asking.
  const blocked = BLOCKED_STATUS[user.status];
  if (blocked) throw new HttpError(403, blocked.message, { code: blocked.code });

  return user;
}

export async function register(input: RegisterInput): Promise<void> {
  const isTvet = input.organizationType === 'TVET';

  const [jobRole, institution] = await Promise.all([
    prisma.jobRole.findUnique({ where: { id: input.jobRoleId } }),
    isTvet && input.institutionId
      ? prisma.institution.findUnique({ where: { id: input.institutionId } })
      : null,
  ]);

  // The role has to be one offered for the chosen organisation, e.g. no DHET "Director" for a TVET user.
  if (!jobRole || jobRole.role !== input.organizationType) {
    throw new HttpError(400, 'Please fix the highlighted fields', {
      fieldErrors: { jobRoleId: 'Select your role' },
    });
  }
  if (isTvet && !institution) {
    throw new HttpError(400, 'Please fix the highlighted fields', {
      fieldErrors: { institutionId: 'Select your institution' },
    });
  }

  try {
    await prisma.user.create({
      data: {
        full_name: input.fullName,
        email: input.email,
        persal_number: input.persalNumber,
        password_hash: await hashPassword(input.password),
        role: input.organizationType,
        job_role_id: jobRole.id,
        institution_id: institution?.id ?? null,
      },
    });
  } catch (error) {
    // P2002: a unique column (email or PERSAL number) already has this value.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const fields = JSON.stringify(error.meta ?? {});
      const fieldErrors: Record<string, string> = fields.includes('persal_number')
        ? { persalNumber: 'This PERSAL number is already registered' }
        : { email: 'This email address is already registered' };
      throw new HttpError(409, 'An account with these details already exists', { fieldErrors });
    }
    throw error;
  }
}
