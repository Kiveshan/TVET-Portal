import type { UserStatus } from '@/components/StatusBadge';
import type { OrganizationType } from '@/types/auth';
import type { ManagedUser } from '@/types/user';

// In-memory mock store until the backend exists. Changes last until the page is reloaded.

const FIRST_NAMES = ['Amara', 'Thabo', 'Elena', 'Liam', 'Zahra', 'Chen', 'Lindiwe', 'Pieter',
  'Ayanda', 'Fatima', 'Kagiso', 'Naledi', 'Johan', 'Precious', 'Musa', 'Anele'];
const LAST_NAMES = ['Okonkwo', 'Jones', 'Smith', 'John', 'Louis', 'Lee', 'Khumalo', 'van Wyk',
  'Zulu', 'Patel', 'Molefe', 'Sithole', 'Botha', 'Mahlangu', 'Nkosi', 'Dube'];
const COLLEGES = ['Coastal KZN TVET College', 'Majuba TVET College', 'College of Cape Town',
  'Ekurhuleni East TVET College', 'Tshwane South TVET College'];
const DHET_ROLES = ['Director: Skills Development', 'Senior M&E Manager', 'Planning Officer',
  'Deputy Director: Planning'];
const TVET_ROLES = ['Executive Dean', 'Senior Lecturer', 'Lecturer', 'Senior M&E Manager',
  'Campus Manager'];
const STATUSES: UserStatus[] = ['pending', 'approved', 'pending', 'approved', 'disabled',
  'rejected', 'pending', 'approved'];

function buildSeedUsers(count: number): ManagedUser[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const organizationType: OrganizationType = i % 3 === 0 ? 'DHET' : 'TVET';
    const isDhet = organizationType === 'DHET';
    const roles = isDhet ? DHET_ROLES : TVET_ROLES;
    const domain = isDhet ? 'dhet.gov.za' : 'tvet.edu.za';

    return {
      id: `user-${i + 1}`,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '') + `@${domain}`,
      organizationType,
      organization: isDhet ? 'DHET' : COLLEGES[i % COLLEGES.length],
      role: roles[i % roles.length],
      persalNumber: String(40005000 + i * 37),
      status: STATUSES[i % STATUSES.length],
    };
  });
}

let users: ManagedUser[] = buildSeedUsers(48);
const listeners = new Set<() => void>();

function setUsers(next: ManagedUser[]) {
  users = next;
  listeners.forEach((listener) => listener());
}

export const userStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ManagedUser[] {
    return users;
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function updateUserStatus(id: string, status: UserStatus): Promise<void> {
  await delay(300);
  setUsers(users.map((user) => (user.id === id ? { ...user, status } : user)));
}
