export type OrganizationType = 'DHET' | 'TVET';

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
