import 'dotenv/config';
import { z } from 'zod';

// Validated once at startup, so a missing variable fails loudly instead of mid-request.
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // The AWS SDK reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment itself.
  AWS_REGION: z.string().default('af-south-1'),
  INGESTION_BUCKET: z.string().default('dhet-ingestion-landing-515966540182'),
  /** Where rows DHET approves are written. */
  APPROVED_BUCKET: z.string().default('dhet-approved'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
  console.error(`Invalid environment variables (check backend/.env):\n${problems.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
