export type OrganizationType = 'DHET' | 'TVET';

/** Which part of the portal a user can use. Not the same as their job title (`AuthUser.title`). */
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
  /** Required for TVET users only. */
  institutionId?: string;
  /** A job title offered for `organizationType`. */
  jobRoleId: string;
  persalNumber: string;
  password: string;
}

export interface NamedOption {
  id: string;
  name: string;
}

/** Dropdown options for the registration form. */
export interface RegistrationOptions {
  institutions: NamedOption[];
  jobRoles: Record<OrganizationType, NamedOption[]>;
}
