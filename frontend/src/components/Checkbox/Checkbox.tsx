import { useEffect, useId, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { Icon } from '../Icon';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Visible label. Omit it (e.g. in a table cell) and pass `aria-label` instead. */
  label?: string;
  /** Shows a dash for "some but not all" selected. */
  indeterminate?: boolean;
}

/** Square tick box, e.g. "Approve all rows" or a row's Approve cell. */
export function Checkbox({ id, label, indeterminate = false, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  // `indeterminate` only exists as a DOM property, not an HTML attribute.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label htmlFor={inputId} className={cn(styles.checkbox, className)}>
      <input ref={inputRef} id={inputId} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden="true">
        <Icon name="tick" size={12} strokeWidth={3} className={styles.tick} />
        <span className={styles.dash} />
      </span>
      {label && <span className={styles.text}>{label}</span>}
    </label>
  );
}
