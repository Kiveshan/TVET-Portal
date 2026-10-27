import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import styles from './RadioButton.module.css';

export type RadioButtonVariant = 'default' | 'segment';

export interface RadioButtonProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  /** `segment` renders as one pill of a segmented toggle (e.g. DHET / TVET). */
  variant?: RadioButtonVariant;
}

export function RadioButton({
  id,
  label,
  variant = 'default',
  className,
  ...rest
}: RadioButtonProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className={cn(styles.radio, styles[variant], className)}>
      <input id={inputId} type="radio" className={styles.input} {...rest} />
      {variant === 'default' && <span className={styles.dot} aria-hidden="true" />}
      <span className={styles.text}>{label}</span>
    </label>
  );
}
