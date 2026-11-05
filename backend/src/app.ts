import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { lookupsRouter } from './modules/lookups/lookups.routes.ts';
import { submissionsRouter } from './modules/submissions/submissions.routes.ts';
import { usersRouter } from './modules/users/users.routes.ts';

export const app = express();

app.disable('x-powered-by');
// Without this, behind a load balancer every request looks like it comes from the balancer,
// and all users would share one rate limit.
app.set('trust proxy', env.TRUST_PROXY);
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

// One origin for the site and the API, so the session cookie works without CORS.
if (env.STATIC_DIR) {
  const staticDir = path.resolve(env.STATIC_DIR);
  app.use(express.static(staticDir, { index: false }));
  // Client-side routes (/dashboard, /login, ...) all load the React app.
  app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
