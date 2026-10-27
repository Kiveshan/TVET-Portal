import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/classNames';
import { Icon, type IconName } from '../Icon';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  label: string;
  to: string;
  icon: IconName;
}

export interface SidebarProps {
  items: SidebarItem[];
}

/** Green side navigation; the item matching the current route is highlighted. */
export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Main navigation">
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => cn(styles.link, isActive && styles.active)}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
