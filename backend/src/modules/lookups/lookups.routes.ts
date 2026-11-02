import { Router } from 'express';
import { prisma } from '../../lib/prisma.ts';

export const lookupsRouter = Router();

/**
 * GET /api/lookups/registration-options
 * Dropdown options for the registration form: TVET colleges, and job roles per organisation type.
 */
lookupsRouter.get('/registration-options', async (_req, res) => {
  const [institutions, jobRoles] = await Promise.all([
    prisma.institution.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.jobRole.findMany({
      where: { role: { in: ['DHET', 'TVET'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const rolesFor = (role: 'DHET' | 'TVET') =>
    jobRoles.filter((jobRole) => jobRole.role === role).map(({ id, name }) => ({ id, name }));

  res.json({
    institutions,
    jobRoles: { DHET: rolesFor('DHET'), TVET: rolesFor('TVET') },
  });
});
