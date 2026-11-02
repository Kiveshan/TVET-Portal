import type { OrganizationType } from '@/types/auth';

// Institutions and job roles come from the API (see authService.getRegistrationOptions).

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'DHET', label: 'DHET' },
  { value: 'TVET', label: 'TVET' },
];
