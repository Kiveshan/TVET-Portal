/** An error with an HTTP status that the error handler sends back as `{ message, fieldErrors? }`. */
export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    options: { code?: string; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
  }
}
