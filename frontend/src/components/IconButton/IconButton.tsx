import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { Icon, type IconName } from '../Icon';
import styles from './IconButton.module.css';

export type IconButtonTone = 'danger' | 'success' | 'neutral';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Accessible name, also shown as a tooltip. */
  label: string;
  tone?: IconButtonTone;
  size?: number;
}

/** Borderless button showing only an icon, e.g. delete / enable actions in a table row. */
export function IconButton({
  icon,
  label,
  tone = 'neutral',
  size = 18,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.iconButton, styles[tone], className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
