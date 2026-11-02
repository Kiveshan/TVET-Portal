import { z } from 'zod';

export const ListUsersQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'disabled']).optional(),
  organizationType: z.enum(['DHET', 'TVET']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const UpdateStatusBody = z.object({
  status: z.enum(['approved', 'rejected', 'disabled'], 'Status must be approved, rejected or disabled'),
});

export type ListUsersInput = z.infer<typeof ListUsersQuery>;
export type StatusChange = z.infer<typeof UpdateStatusBody>['status'];
