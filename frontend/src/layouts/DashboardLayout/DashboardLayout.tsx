import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, TopBar, type SidebarItem } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import type { UserRole } from '@/types/auth';
import styles from './DashboardLayout.module.css';

const NAV_ITEMS: Record<UserRole, SidebarItem[]> = {
  TVET: [
    { label: 'Dashboard', to: PATHS.dashboard, icon: 'dashboard' },
    { label: 'Data Review', to: PATHS.dataReview, icon: 'database' },
  ],
  DHET: [
    { label: 'Dashboard', to: PATHS.dashboard, icon: 'dashboard' },
    { label: 'Data Review', to: PATHS.dataReview, icon: 'database' },
  ],
  // The System Admin views have no side navigation.
  SYSTEM_ADMIN: [],
};

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  SYSTEM_ADMIN: 'System Admin',
};

export interface DashboardLayoutProps {
  children: ReactNode;
}

/** App shell for signed-in pages: top bar, side navigation, content area and footer. */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Routes using this layout are wrapped in ProtectedRoute, so a user is always present.
  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];

  const handleLogout = () => {
    signOut();
    navigate(PATHS.login, { replace: true });
  };

  return (
    <div className={styles.shell}>
      <TopBar
        institution={user.institution}
        roleLabel={ROLE_LABELS[user.role]}
        user={{ name: user.name, role: user.title }}
        onLogout={handleLogout}
      />
      <div className={styles.body}>
        {navItems.length > 0 && <Sidebar items={navItems} />}
        <div className={styles.content}>
          <main className={styles.main}>
            <div className={styles.container}>{children}</div>
          </main>
          <footer className={styles.footer}>© {new Date().getFullYear()} TVETMIS</footer>
        </div>
      </div>
    </div>
  );
}
