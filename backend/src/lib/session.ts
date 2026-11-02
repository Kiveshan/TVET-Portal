import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.ts';

export const SESSION_COOKIE = 'tvet_session';
const SESSION_HOURS = 8;

interface SessionPayload {
  sub: string;
}

// httpOnly keeps the token away from page scripts; sameSite blocks cross-site form posts.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
};

export function startSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: `${SESSION_HOURS}h`,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_HOURS * 60 * 60 * 1000 });
}

export function endSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

/** The user id in a valid session token, or null if it's missing, tampered with or expired. */
export function readSession(token: unknown): string | null {
  if (typeof token !== 'string' || !token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Partial<SessionPayload>;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
