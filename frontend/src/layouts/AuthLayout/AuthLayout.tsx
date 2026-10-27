import type { ReactNode } from 'react';
import { Header } from '@/components';
import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  children: ReactNode;
}

/** Soft gradient background + header shared by the login and registration pages. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <span className={`${styles.blob} ${styles.green}`} />
        <span className={`${styles.blob} ${styles.gold}`} />
        <span className={`${styles.blob} ${styles.blue}`} />
        <span className={`${styles.blob} ${styles.red}`} />
      </div>
      <Header />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
