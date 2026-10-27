import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import { Icon, type IconName } from '../Icon';
import styles from './DetailTile.module.css';

export interface DetailTileProps {
  label: string;
  icon?: IconName;
  className?: string;
  children: ReactNode;
}

/** Read-only field: small uppercase label with an icon above a value. */
export function DetailTile({ label, icon, className, children }: DetailTileProps) {
  return (
    <div className={cn(styles.tile, className)}>
      <dt className={styles.label}>
        {icon && <Icon name={icon} size={15} />}
        {label}
      </dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}
