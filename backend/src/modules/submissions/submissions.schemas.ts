import { z } from 'zod';

/** POST /api/submissions/:id/files/:fileId/review */
export const ReviewBody = z.object({
  approvedRowIds: z.array(z.string().min(1)).max(500_000),
  rejections: z
    .array(
      z.object({
        rowId: z.string().min(1),
        reason: z.string().trim().min(1, 'Enter a rejection reason').max(500),
      }),
    )
    .max(500_000),
});

export type ReviewBody = z.infer<typeof ReviewBody>;
