import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import { Icon } from '../Icon';
import { Label } from '../Label';
import styles from './FormField.module.css';

export interface FormFieldProps {
  id: string;
  label?: string;
  required?: boolean;
  labelSize?: 'sm' | 'md';
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Wraps a control with its label and hint/error message. Used by TextBox and Dropdown. */
export function FormField({
  id,
  label,
  required,
  labelSize,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  const message = error ?? hint;

  return (
    <div className={cn(styles.field, className)}>
      {label && (
        <Label htmlFor={id} required={required} size={labelSize}>
          {label}
        </Label>
      )}
      {children}
      {message && (
        <p id={`${id}-message`} className={cn(styles.message, error && styles.error)}>
          <Icon name="alert" size={12} />
          {message}
        </p>
      )}
    </div>
  );
}
