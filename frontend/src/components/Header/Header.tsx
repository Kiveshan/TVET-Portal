import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import styles from './Header.module.css';

export interface HeaderProps {
  title?: string;
}

export function Header({ title = 'TVET Portal' }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <Logo />
        <span className={styles.title}>{title}</span>
      </Link>
    </header>
  );
}
