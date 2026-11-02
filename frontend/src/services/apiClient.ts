/** An error response from the API: `{ message, code?, fieldErrors? }`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, code?: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

let onUnauthorized: (() => void) | null = null;

/** Called when the session has expired or the account was disabled mid-session. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query string values; undefined ones are left out. */
  query?: Record<string, string | number | undefined>;
}

/** Calls the backend at `/api{path}`. The session cookie is sent automatically. */
export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const url = `/api${path}${params.size > 0 ? `?${params}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);

  if (!response.ok) {
    if (response.status === 401 && data?.code === 'UNAUTHENTICATED') onUnauthorized?.();
    throw new ApiError(
      response.status,
      data?.message ?? 'Something went wrong. Please try again.',
      data?.code,
      data?.fieldErrors,
    );
  }

  return data as T;
}
