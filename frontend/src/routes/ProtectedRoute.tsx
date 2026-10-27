import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';
import { homePathFor, PATHS } from './paths';

export interface ProtectedRouteProps {
  roles: UserRole[];
  children: ReactNode;
}

/** Sends signed-out users to login and users without the right role to their own home page. */
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <>{children}</>;
}
