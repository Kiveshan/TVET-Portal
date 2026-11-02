import type { SessionUser } from '../modules/users/user.mapper.ts';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`. */
      user?: SessionUser;
    }
  }
}

export {};
