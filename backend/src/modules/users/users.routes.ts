import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.ts';
import { ListUsersQuery, UpdateStatusBody } from './users.schemas.ts';
import * as usersService from './users.service.ts';

/** System Admin user management, mounted at /api/admin/users. */
export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('SYSTEM_ADMIN'));

/** GET /api/admin/users?status=pending&organizationType=TVET&page=1&pageSize=6 */
usersRouter.get('/', async (req, res) => {
  res.json(await usersService.listUsers(ListUsersQuery.parse(req.query)));
});

/** GET /api/admin/users/counts: per status and organisation type, for the filter cards. */
usersRouter.get('/counts', async (_req, res) => {
  res.json({ counts: await usersService.countUsers() });
});

/** GET /api/admin/users/:id */
usersRouter.get('/:id', async (req, res) => {
  res.json({ user: await usersService.getUser(req.params.id) });
});

/** PATCH /api/admin/users/:id/status  { status: 'approved' | 'rejected' | 'disabled' } */
usersRouter.patch('/:id/status', async (req, res) => {
  const { status } = UpdateStatusBody.parse(req.body);
  res.json({ user: await usersService.changeStatus(req.params.id, status, req.user!.id) });
});
