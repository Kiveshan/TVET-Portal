import { Icon } from '../Icon';
import { Logo } from '../Logo';
import styles from './TopBar.module.css';

export interface TopBarUser {
  name: string;
  role: string;
}

export interface TopBarProps {
  title?: string;
  institution?: string;
  /** Highlighted label shown before the user, e.g. "System Admin". */
  roleLabel?: string;
  user: TopBarUser;
  onLogout?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Top application bar: logo, portal title, institution and signed-in user. */
export function TopBar({
  title = 'TVET Portal',
  institution,
  roleLabel,
  user,
  onLogout,
}: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <Logo className={styles.logo} />
        <div className={styles.titles}>
          <span className={styles.title}>{title}</span>
          {institution && <span className={styles.institution}>{institution}</span>}
        </div>
      </div>

      <div className={styles.user}>
        {roleLabel && <span className={styles.roleLabel}>{roleLabel}</span>}
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(user.name)}
        </span>
        <div className={styles.userText}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.role}</span>
        </div>
        <button type="button" className={styles.logout} onClick={onLogout} aria-label="Log out">
          <Icon name="logout" size={22} />
        </button>
      </div>
    </header>
  );
}
