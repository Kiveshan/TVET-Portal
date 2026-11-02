import type { Request } from 'express';
import { ipKeyGenerator, rateLimit, type Options, type RateLimitInfo } from 'express-rate-limit';

// Counts are kept in memory, so they reset when the server restarts and aren't shared
// between multiple server instances. Fine for one instance; use a shared store (e.g. Redis) to scale out.

const MINUTE = 60 * 1000;

/** Same `{ message, code }` shape as every other API error, with the time left until the limit resets. */
function limitHandler(message: string): Options['handler'] {
  return (req, res, _next, options) => {
    // Set on the request by express-rate-limit before the handler runs.
    const resetTime = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit?.resetTime;
    const msLeft = resetTime ? resetTime.getTime() - Date.now() : options.windowMs;
    const minutes = Math.max(Math.ceil(msLeft / MINUTE), 1);
    res.status(options.statusCode).json({
      message: `${message} Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      code: 'RATE_LIMITED',
    });
  };
}

// ipKeyGenerator groups IPv6 addresses by subnet, so one user can't dodge the limit by rotating addresses.
const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? 'unknown');

/**
 * Failed sign-ins per account per IP. Successful sign-ins don't count, so a user who
 * mistypes once and then gets in isn't penalised. Slows password guessing on one account.
 */
export const loginAttemptLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${clientIp(req)}|${email}`;
  },
  handler: limitHandler('Too many failed sign-in attempts.'),
});

/** All sign-in requests from one IP, so one machine can't try many different accounts. */
export const loginIpLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: clientIp,
  handler: limitHandler('Too many sign-in attempts from this network.'),
});

/**
 * Accounts created from one IP. Stops scripted sign-ups flooding the System Admin's review queue.
 * Rejected submissions (validation errors, email already registered) don't count, so someone
 * fixing their form isn't locked out.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * MINUTE,
  limit: 5,
  skipFailedRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: clientIp,
  handler: limitHandler('Too many registrations from this network.'),
});
