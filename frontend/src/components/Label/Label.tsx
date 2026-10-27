import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import styles from './Label.module.css';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  size?: 'sm' | 'md';
}

export function Label({ required = false, size = 'md', className, children, ...rest }: LabelProps) {
  return (
    <label className={cn(styles.label, styles[size], className)} {...rest}>
      {children}
      {required && (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
