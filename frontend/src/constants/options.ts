import type { DropdownOption } from '@/components';
import type { OrganizationType } from '@/types/auth';

// Placeholder data until the backend provides these lists.

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'DHET', label: 'DHET' },
  { value: 'TVET', label: 'TVET' },
];

export const ROLE_OPTIONS: Record<OrganizationType, DropdownOption[]> = {
  DHET: [
    { value: 'planning-officer', label: 'Planning Officer' },
    { value: 'director', label: 'Director' },
    { value: 'administrator', label: 'Administrator' },
  ],
  TVET: [
    { value: 'principal', label: 'Principal' },
    { value: 'campus-manager', label: 'Campus Manager' },
    { value: 'data-capturer', label: 'Data Capturer' },
  ],
};

export const INSTITUTION_OPTIONS: DropdownOption[] = [
  { value: 'cape-town-college', label: 'College of Cape Town' },
  { value: 'ekurhuleni-east', label: 'Ekurhuleni East TVET College' },
  { value: 'tshwane-south', label: 'Tshwane South TVET College' },
  { value: 'umgungundlovu', label: 'Umgungundlovu TVET College' },
];
