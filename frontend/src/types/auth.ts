export type OrganizationType = 'DHET' | 'TVET';

export type UserRole = 'TVET' | 'DHET' | 'SYSTEM_ADMIN';

/** The signed-in user. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Job title shown under the name in the top bar. */
  title: string;
  /** Institution shown in the top bar, e.g. the user's TVET college. */
  institution?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistrationRequest {
  organizationType: OrganizationType;
  fullName: string;
  email: string;
  institution?: string;
  role: string;
  persalNumber: string;
  password: string;
}
