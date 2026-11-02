import type { AuthUser, LoginRequest, RegistrationOptions, RegistrationRequest } from '@/types/auth';
import { api, ApiError } from './apiClient';

export async function login(request: LoginRequest): Promise<AuthUser> {
  const { user } = await api<{ user: AuthUser }>('/auth/login', { method: 'POST', body: request });
  return user;
}

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}

/** The user signed in with the session cookie, or null if there is no valid session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { user } = await api<{ user: AuthUser }>('/auth/me');
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function register(request: RegistrationRequest): Promise<void> {
  await api('/auth/register', { method: 'POST', body: request });
}

export function getRegistrationOptions(): Promise<RegistrationOptions> {
  return api<RegistrationOptions>('/lookups/registration-options');
}
