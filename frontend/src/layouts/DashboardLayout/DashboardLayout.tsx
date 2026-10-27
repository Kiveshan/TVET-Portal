import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, TopBar, type SidebarItem, type TopBarUser } from '@/components';
import styles from './DashboardLayout.module.css';

const NAV_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Data Review', to: '/data-review', icon: 'database' },
];

// Placeholder until the signed-in user comes from the auth service.
const CURRENT_USER: TopBarUser = { name: 'Nomsa Dlamini', role: 'Admin Clerk' };

export interface DashboardLayoutProps {
  children: ReactNode;
}

/** App shell for signed-in pages: top bar, side navigation, content area and footer. */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <TopBar
        institution="Majuba TVET College"
        user={CURRENT_USER}
        onLogout={() => navigate('/login')}
      />
      <div className={styles.body}>
        <Sidebar items={NAV_ITEMS} />
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
