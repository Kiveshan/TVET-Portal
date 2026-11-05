import { app } from './app.ts';
import { env } from './config/env.ts';
import { prisma } from './lib/prisma.ts';
import { warmCache } from './modules/submissions/submissions.service.ts';

const server = app.listen(env.PORT, () => {
  console.log(`TVET Portal API listening on http://localhost:${env.PORT}`);
  // Reading every run's Parquet files takes a while the first time, so start before anyone asks.
  warmCache();
});

// Close database connections cleanly when the process is stopped (Ctrl+C, tsx watch restarts).
async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
