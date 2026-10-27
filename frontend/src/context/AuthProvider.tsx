import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/types/auth';
import { AuthContext } from './AuthContext';

const STORAGE_KEY = 'tvet-portal.user';

// Session storage keeps the user signed in across reloads in the same tab.
// Access can throw (private mode, blocked storage), so failures fall back to signed out.
function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: the session just won't survive a reload.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const signIn = useCallback((next: AuthUser) => {
    writeStoredUser(next);
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    writeStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
