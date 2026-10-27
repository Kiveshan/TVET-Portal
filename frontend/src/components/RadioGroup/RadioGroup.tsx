import { useId } from 'react';
import { cn } from '@/utils/classNames';
import { RadioButton, type RadioButtonVariant } from '../RadioButton';
import styles from './RadioGroup.module.css';

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
}

export interface RadioGroupProps<T extends string = string> {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  variant?: RadioButtonVariant;
  className?: string;
}

export function RadioGroup<T extends string = string>({
  name,
  options,
  value,
  onChange,
  label,
  variant = 'default',
  className,
}: RadioGroupProps<T>) {
  const labelId = useId();

  return (
    <div className={cn(styles.group, className)}>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        className={cn(styles.options, variant === 'segment' && styles.segmented)}
      >
        {options.map((option) => (
          <RadioButton
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            variant={variant}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
