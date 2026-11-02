// Reference data plus development logins. Safe to re-run: everything is upserted.
// Run with: npx prisma db seed
import type { UserRole, UserStatus } from '../src/generated/prisma/enums.ts';
import { hashPassword } from '../src/lib/password.ts';
import { prisma } from '../src/lib/prisma.ts';

const INSTITUTIONS = [
  'Coastal KZN TVET College',
  'College of Cape Town',
  'Ekurhuleni East TVET College',
  'Majuba TVET College',
  'Tshwane South TVET College',
  'Umgungundlovu TVET College',
];

const JOB_ROLES: Record<UserRole, string[]> = {
  DHET: ['Administrator', 'Deputy Director: Planning', 'Director', 'Director: Skills Development',
    'Planning Officer', 'Senior M&E Manager'],
  TVET: ['Campus Manager', 'Data Capturer', 'Executive Dean', 'Lecturer', 'Principal',
    'Senior Lecturer', 'Senior M&E Manager'],
  SYSTEM_ADMIN: ['Admin Clerk'],
};

interface SeedUser {
  fullName: string;
  email: string;
  role: UserRole;
  jobRole: string;
  institution?: string;
  persalNumber?: string;
  status: UserStatus;
}

/** The development logins, one per portal role. Password: 123456 */
const TEST_PASSWORD = '123456';
const TEST_USERS: SeedUser[] = [
  { fullName: 'Sipho Ndlovu', email: 'tvet@tvetportal.test', role: 'TVET', jobRole: 'Data Capturer',
    institution: 'Majuba TVET College', persalNumber: '40001001', status: 'APPROVED' },
  { fullName: 'Lerato Mokoena', email: 'dhet@tvetportal.test', role: 'DHET', jobRole: 'Planning Officer',
    persalNumber: '40001002', status: 'APPROVED' },
  { fullName: 'Nomsa Dlamini', email: 'admin@tvetportal.test', role: 'SYSTEM_ADMIN',
    jobRole: 'Admin Clerk', status: 'APPROVED' },
];

/** Sample registrations so the System Admin pages have something to review. Password: Password123 */
const SAMPLE_PASSWORD = 'Password123';
const FIRST_NAMES = ['Amara', 'Thabo', 'Elena', 'Liam', 'Zahra', 'Chen', 'Lindiwe', 'Pieter',
  'Ayanda', 'Fatima', 'Kagiso', 'Naledi', 'Johan', 'Precious', 'Musa', 'Anele'];
const LAST_NAMES = ['Okonkwo', 'Jones', 'Smith', 'John', 'Louis', 'Lee', 'Khumalo', 'van Wyk',
  'Zulu', 'Patel', 'Molefe', 'Sithole', 'Botha', 'Mahlangu', 'Nkosi', 'Dube'];
const STATUSES: UserStatus[] = ['PENDING', 'APPROVED', 'PENDING', 'APPROVED', 'DISABLED',
  'REJECTED', 'PENDING', 'APPROVED'];

function buildSampleUsers(count: number): SeedUser[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const role: UserRole = i % 3 === 0 ? 'DHET' : 'TVET';
    const jobRoles = JOB_ROLES[role];
    const domain = role === 'DHET' ? 'dhet.gov.za' : 'tvet.edu.za';

    return {
      fullName: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}${i}`.toLowerCase().replace(/\s+/g, '') + `@${domain}`,
      role,
      jobRole: jobRoles[i % jobRoles.length],
      institution: role === 'TVET' ? INSTITUTIONS[i % INSTITUTIONS.length] : undefined,
      persalNumber: String(40005000 + i * 37),
      status: STATUSES[i % STATUSES.length],
    };
  });
}

async function main() {
  for (const name of INSTITUTIONS) {
    await prisma.institution.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [role, names] of Object.entries(JOB_ROLES) as [UserRole, string[]][]) {
    for (const name of names) {
      await prisma.jobRole.upsert({
        where: { name_role: { name, role } },
        update: {},
        create: { name, role },
      });
    }
  }

  const [institutions, jobRoles] = await Promise.all([
    prisma.institution.findMany(),
    prisma.jobRole.findMany(),
  ]);
  const institutionId = (name?: string) => institutions.find((i) => i.name === name)?.id ?? null;
  const jobRoleId = (role: UserRole, name: string) => {
    const match = jobRoles.find((j) => j.role === role && j.name === name);
    if (!match) throw new Error(`Unknown job role ${role}/${name}`);
    return match.id;
  };

  const [testHash, sampleHash] = await Promise.all([
    hashPassword(TEST_PASSWORD),
    hashPassword(SAMPLE_PASSWORD),
  ]);

  const seedUsers = [
    ...TEST_USERS.map((user) => ({ user, hash: testHash })),
    ...buildSampleUsers(40).map((user) => ({ user, hash: sampleHash })),
  ];

  for (const { user, hash } of seedUsers) {
    const data = {
      full_name: user.fullName,
      role: user.role,
      job_role_id: jobRoleId(user.role, user.jobRole),
      institution_id: institutionId(user.institution),
      persal_number: user.persalNumber ?? null,
      password_hash: hash,
    };
    // Existing users keep their status, so approvals made while testing survive a re-seed.
    await prisma.user.upsert({
      where: { email: user.email },
      update: data,
      create: { ...data, email: user.email, status: user.status },
    });
  }

  console.log(
    `Seeded ${INSTITUTIONS.length} institutions, ${jobRoles.length} job roles and ${seedUsers.length} users.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
