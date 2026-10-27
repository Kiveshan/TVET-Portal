import type { LoginRequest, RegistrationRequest } from '@/types/auth';

// Frontend-only stubs. Replace with real API calls once the backend exists.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(request: LoginRequest): Promise<void> {
  await delay(600);
  console.info('[authService] login', request.email);
}

export async function register(request: RegistrationRequest): Promise<void> {
  await delay(600);
  console.info('[authService] register', request.email, request.organizationType);
}
