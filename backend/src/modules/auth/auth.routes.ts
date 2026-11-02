import { Router } from 'express';
import { endSession, startSession } from '../../lib/session.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { toAuthUser } from '../users/user.mapper.ts';
import { LoginSchema, RegisterSchema } from './auth.schemas.ts';
import * as authService from './auth.service.ts';

export const authRouter = Router();

/** POST /api/auth/register: creates a PENDING account for the System Admin to review. */
authRouter.post('/register', async (req, res) => {
  await authService.register(RegisterSchema.parse(req.body));
  res.status(201).json({ message: 'Registration submitted' });
});

/** POST /api/auth/login: sets the session cookie and returns the signed-in user. */
authRouter.post('/login', async (req, res) => {
  const user = await authService.login(LoginSchema.parse(req.body));
  startSession(res, user.id);
  res.json({ user: toAuthUser(user) });
});

/** POST /api/auth/logout */
authRouter.post('/logout', (_req, res) => {
  endSession(res);
  res.status(204).end();
});

/** GET /api/auth/me: the signed-in user, used to restore the session on page load. */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: toAuthUser(req.user!) });
});
