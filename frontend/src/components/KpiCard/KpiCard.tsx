import { cn } from '@/utils/classNames';
import { Icon, type IconName } from '../Icon';
import styles from './KpiCard.module.css';

export type KpiTone = 'neutral' | 'pending' | 'approved' | 'rejected';

export interface KpiCardProps {
  value: number | string;
  label: string;
  tone?: KpiTone;
  /** Icon in a tinted square at the top right. Switches to the label-first layout. */
  icon?: IconName;
  /** Makes the card a toggle button, e.g. to filter a table. */
  onClick?: () => void;
  /** Highlighted state for a toggle card. */
  selected?: boolean;
  className?: string;
}

/** Single headline metric. With `onClick` it acts as a filter toggle. */
export function KpiCard({
  value,
  label,
  tone = 'neutral',
  icon,
  onClick,
  selected = false,
  className,
}: KpiCardProps) {
  const classes = cn(
    styles.card,
    icon && styles.withIcon,
    onClick && styles.interactive,
    selected && styles.selected,
    className,
  );

  const content = icon ? (
    <>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={cn(styles.value, styles[tone])}>{value}</span>
      </span>
      <span className={styles.iconBox} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
    </>
  ) : (
    <>
      <span className={cn(styles.value, styles[tone])}>{value}</span>
      <span className={styles.label}>{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={selected}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
