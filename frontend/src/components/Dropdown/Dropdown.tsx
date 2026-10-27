import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import { FormField } from '../FormField';
import { Icon, type IconName } from '../Icon';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: DropdownOption[];
  label?: string;
  labelSize?: 'sm' | 'md';
  placeholder?: string;
  icon?: IconName;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Dropdown({
  id,
  options,
  label,
  labelSize,
  placeholder = 'Select an option',
  icon,
  hint,
  error,
  required,
  value,
  className,
  containerClassName,
  ...rest
}: DropdownProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hasMessage = Boolean(error ?? hint);
  const isEmpty = value === '' || value === undefined;

  return (
    <FormField
      id={selectId}
      label={label}
      labelSize={labelSize}
      required={required}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className={cn(styles.wrapper, error && styles.invalid)}>
        {icon && <Icon name={icon} className={styles.icon} />}
        <select
          id={selectId}
          value={value}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? `${selectId}-message` : undefined}
          className={cn(styles.select, isEmpty && styles.placeholder, className)}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={18} className={styles.chevron} />
      </div>
    </FormField>
  );
}
