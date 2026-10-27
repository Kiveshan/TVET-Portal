const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Minimum 8 characters, containing at least one letter and one number. */
export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /\d/.test(value) && /[a-zA-Z]/.test(value);
}

export function isValidPersalNumber(value: string): boolean {
  return /^\d{6,10}$/.test(value.trim());
}
