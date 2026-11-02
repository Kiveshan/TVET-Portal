import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Compared against when the email is unknown, so a wrong email takes as long as a wrong
// password and response times don't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

export async function verifyPasswordOrDummy(password: string, hash?: string): Promise<boolean> {
  const matches = await verifyPassword(password, hash ?? DUMMY_HASH);
  return hash !== undefined && matches;
}
