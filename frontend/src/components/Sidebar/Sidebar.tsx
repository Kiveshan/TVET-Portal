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
  /** Icon-only rail. Ignored on phone widths, where the nav is a horizontal bar. */
  collapsed?: boolean;
  /** Shows the collapse/expand button when provided. */
  onToggle?: () => void;
}

/** Green side navigation; the item matching the current route is highlighted. */
export function Sidebar({ items, collapsed = false, onToggle }: SidebarProps) {
  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      {onToggle && (
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name="panelLeft" size={18} />
        </button>
      )}
      <nav aria-label="Main navigation">
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => cn(styles.link, isActive && styles.active)}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={16} className={styles.icon} />
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
