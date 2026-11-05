import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.ts';
import { ReviewBody } from './submissions.schemas.ts';
import * as submissionsService from './submissions.service.ts';

/**
 * Data submissions from the S3 ingestion bucket, mounted at /api/submissions.
 * A submission is one college's rows for one ingest date. DHET sees every college;
 * a TVET user only sees their own institution's submissions.
 */
export const submissionsRouter = Router();

submissionsRouter.use(requireAuth, requireRole('TVET', 'DHET'));

/** GET /api/submissions: newest first, with each one's review status. */
submissionsRouter.get('/', async (req, res) => {
  res.json({ submissions: await submissionsService.listSubmissions(req.user!) });
});

/** GET /api/submissions/:id */
submissionsRouter.get('/:id', async (req, res) => {
  res.json({ submission: await submissionsService.getSubmission(req.user!, req.params.id) });
});

/** GET /api/submissions/:id/files: the tables in the submission, with row counts. */
submissionsRouter.get('/:id/files', async (req, res) => {
  res.json({ files: await submissionsService.listFiles(req.user!, req.params.id) });
});

/** GET /api/submissions/:id/files/:fileId/rows: one table's rows for this college. */
submissionsRouter.get('/:id/files/:fileId/rows', async (req, res) => {
  res.json(await submissionsService.getFileRows(req.user!, req.params.id, req.params.fileId));
});

/** GET /api/submissions/:id/reviews: DHET decisions so far, with rejected rows and reasons. */
submissionsRouter.get('/:id/reviews', async (req, res) => {
  res.json({ reviews: await submissionsService.listReviews(req.user!, req.params.id) });
});

/**
 * POST /api/submissions/:id/files/:fileId/review  { approvedRowIds, rejections: [{ rowId, reason }] }
 * DHET only. Approved rows are written to the approved bucket.
 */
submissionsRouter.post('/:id/files/:fileId/review', requireRole('DHET'), async (req, res) => {
  const body = ReviewBody.parse(req.body);
  // The extra middleware loses Express's path-param typing, so name the params here.
  const { id, fileId } = req.params as { id: string; fileId: string };
  await submissionsService.reviewFile(req.user!, id, fileId, body);
  res.status(204).end();
});
