import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.ts';
import { PrismaClient } from '../generated/prisma/client.ts';

// One shared client for the whole app: each PrismaClient opens its own connection pool.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
