import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { FormField } from '../FormField';
import { Icon, type IconName } from '../Icon';
import styles from './TextBox.module.css';

export interface TextBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  labelSize?: 'sm' | 'md';
  icon?: IconName;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Text input with optional label, leading icon and hint/error.
 * `type="password"` adds a show/hide toggle.
 */
export function TextBox({
  id,
  label,
  labelSize,
  icon,
  hint,
  error,
  required,
  type = 'text',
  className,
  containerClassName,
  ...rest
}: TextBoxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const hasMessage = Boolean(error ?? hint);

  return (
    <FormField
      id={inputId}
      label={label}
      labelSize={labelSize}
      required={required}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className={cn(styles.wrapper, error && styles.invalid)}>
        {icon && <Icon name={icon} className={styles.icon} />}
        <input
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? `${inputId}-message` : undefined}
          className={cn(styles.input, className)}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
    </FormField>
  );
}
