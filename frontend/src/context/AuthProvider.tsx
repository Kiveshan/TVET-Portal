import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/services/apiClient';
import { getCurrentUser, logout } from '@/services/authService';
import type { AuthUser } from '@/types/auth';
import { AuthContext } from './AuthContext';

// The session lives in an httpOnly cookie set by the API. On load we ask the API who is
// signed in, so a reload keeps the session and an expired one shows the login page.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .catch(() => null)
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The API rejected the session (expired, or the account was disabled): sign out here too.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback((next: AuthUser) => setUser(next), []);

  const signOut = useCallback(() => {
    setUser(null);
    logout().catch(() => {
      // The cookie expires on its own; nothing else to do.
    });
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  // Render nothing until we know whether someone is signed in, so protected pages
  // don't bounce to the login page during the check.
  if (checking) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
