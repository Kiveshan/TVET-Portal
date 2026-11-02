import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../generated/prisma/enums.ts';
import { prisma } from '../lib/prisma.ts';
import { endSession, readSession, SESSION_COOKIE } from '../lib/session.ts';
import { sessionUserInclude } from '../modules/users/user.mapper.ts';
import { HttpError } from '../utils/HttpError.ts';

/**
 * Loads the signed-in user onto `req.user`. The user is re-read on every request,
 * so disabling an account takes effect immediately rather than when the token expires.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = readSession(req.cookies?.[SESSION_COOKIE]);
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, include: sessionUserInclude })
    : null;

  if (!user || user.status !== 'APPROVED') {
    endSession(res);
    throw new HttpError(401, 'Please sign in to continue', { code: 'UNAUTHENTICATED' });
  }

  req.user = user;
  next();
}

/** Use after `requireAuth`: only lets the given portal roles through. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'You do not have access to this resource', { code: 'FORBIDDEN' });
    }
    next();
  };
}
