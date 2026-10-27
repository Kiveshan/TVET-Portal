import { Icon } from '../Icon';
import { Logo } from '../Logo';
import styles from './TopBar.module.css';

export interface TopBarUser {
  name: string;
  role: string;
}

export interface TopBarProps {
  title?: string;
  institution: string;
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
export function TopBar({ title = 'TVET Portal', institution, user, onLogout }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <Logo className={styles.logo} />
        <div className={styles.titles}>
          <span className={styles.title}>{title}</span>
          <span className={styles.institution}>{institution}</span>
        </div>
      </div>

      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(user.name)}
        </span>
        <div className={styles.userText}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{user.role}</span>
        </div>
        <button type="button" className={styles.logout} onClick={onLogout} aria-label="Log out">
          <Icon name="logout" size={20} />
        </button>
      </div>
    </header>
  );
}
