import { TEST_PASSWORD, TEST_USERS } from '@/constants/testUsers';
import type { AuthUser, LoginRequest, RegistrationRequest } from '@/types/auth';

// Frontend-only stubs. Replace with real API calls once the backend exists.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Incorrect email address or password');
    this.name = 'InvalidCredentialsError';
  }
}

export async function login(request: LoginRequest): Promise<AuthUser> {
  await delay(400);
  const email = request.email.trim().toLowerCase();
  const user = TEST_USERS.find((candidate) => candidate.email === email);
  if (!user || request.password !== TEST_PASSWORD) throw new InvalidCredentialsError();
  return user;
}

export async function register(request: RegistrationRequest): Promise<void> {
  await delay(600);
  console.info('[authService] register', request.email, request.organizationType);
}
