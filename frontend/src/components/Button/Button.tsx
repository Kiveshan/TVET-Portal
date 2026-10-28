import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { Icon, type IconName } from '../Icon';
import styles from './Button.module.css';

/**
 * `primary` = green gradient (auth pages), `solid` = flat dark green (app pages),
 * `accent` = gold (e.g. Download File in Data Review), `navy` = dark blue (review confirmations).
 */
export type ButtonVariant = 'primary' | 'solid' | 'secondary' | 'danger' | 'accent' | 'navy';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon shown before the label. */
  icon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
}

const ICON_SIZES: Record<ButtonSize, number> = { sm: 13, md: 18, lg: 18 };

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={ICON_SIZES[size]} strokeWidth={2} />
      )}
      {children}
    </button>
  );
}
