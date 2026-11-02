import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/HttpError.ts';

/** First message per field, keyed by field name, e.g. `{ email: 'Enter a valid email' }`. */
function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'form';
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Not found'));
}

// Express 5 forwards errors thrown in async handlers here. The 4 parameters mark it as an error handler.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Please fix the highlighted fields', fieldErrors: toFieldErrors(error) });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      message: error.message,
      code: error.code,
      fieldErrors: error.fieldErrors,
    });
    return;
  }

  // Malformed JSON bodies from express.json()
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ message: 'Request body is not valid JSON' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
