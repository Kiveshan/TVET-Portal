import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react';
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
  /** Type to filter the options. Use `onValueChange` to receive the choice. */
  searchable?: boolean;
  /** Called with the chosen value (works for both plain and searchable dropdowns). */
  onValueChange?: (value: string) => void;
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
  searchable = false,
  onValueChange,
  onChange,
  disabled,
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
      <div className={cn(styles.wrapper, error && styles.invalid, disabled && styles.disabled)}>
        {icon && <Icon name={icon} className={styles.icon} />}
        {searchable ? (
          <SearchableSelect
            id={selectId}
            options={options}
            value={value === undefined ? '' : String(value)}
            placeholder={placeholder}
            disabled={disabled}
            invalid={Boolean(error)}
            describedBy={hasMessage ? `${selectId}-message` : undefined}
            className={className}
            onValueChange={onValueChange}
          />
        ) : (
          <select
            id={selectId}
            value={value}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasMessage ? `${selectId}-message` : undefined}
            className={cn(styles.select, isEmpty && styles.placeholder, className)}
            onChange={(event) => {
              onChange?.(event);
              onValueChange?.(event.target.value);
            }}
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
        )}
        <Icon name="chevronDown" size={18} className={styles.chevron} />
      </div>
    </FormField>
  );
}

interface SearchableSelectProps {
  id: string;
  options: DropdownOption[];
  value: string;
  placeholder: string;
  disabled?: boolean;
  invalid: boolean;
  describedBy?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

/** Combobox: a text box that filters a listbox of options (ARIA 1.2 pattern). */
function SearchableSelect({
  id,
  options,
  value,
  placeholder,
  disabled,
  invalid,
  describedBy,
  className,
  onValueChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = `${id}-listbox`;

  const selected = options.find((option) => option.value === value);
  const search = query.trim().toLowerCase();
  const matches = search
    ? options.filter((option) => option.label.toLowerCase().includes(search))
    : options;
  const optionId = (index: number) => `${id}-option-${index}`;

  // Keep the highlighted option visible while moving with the arrow keys.
  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`);
    active?.scrollIntoView({ block: 'nearest' });
  });

  const openList = () => {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    setQuery('');
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (option: DropdownOption) => {
    onValueChange?.(option.value);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (open && matches[activeIndex]) {
          event.preventDefault();
          choose(matches[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? optionId(activeIndex) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        disabled={disabled}
        // Closed: show the current choice. Open: an empty search box hinting the current choice.
        value={open ? query : (selected?.label ?? '')}
        placeholder={open ? (selected?.label ?? 'Search…') : placeholder}
        className={cn(styles.select, styles.search, className)}
        onFocus={openList}
        onClick={() => !open && openList()}
        onBlur={close}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={styles.listbox}
          // Keep focus in the text box so choosing an option doesn't blur it first.
          onMouseDown={(event) => event.preventDefault()}
        >
          {matches.length === 0 ? (
            <li className={styles.noMatches}>No matches</li>
          ) : (
            matches.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  styles.option,
                  index === activeIndex && styles.optionActive,
                  option.value === value && styles.optionSelected,
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </>
  );
}
