import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { lookupsRouter } from './modules/lookups/lookups.routes.ts';
import { submissionsRouter } from './modules/submissions/submissions.routes.ts';
import { usersRouter } from './modules/users/users.routes.ts';

export const app = express();

app.disable('x-powered-by');
// A review lists every row id of a table (thousands for student data), so it gets a larger limit.
app.use('/api/submissions', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/lookups', lookupsRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/submissions', submissionsRouter);

app.use(notFound);
app.use(errorHandler);
