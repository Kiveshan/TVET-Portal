import { cn } from '@/utils/classNames';
import styles from './KpiCard.module.css';

export type KpiTone = 'neutral' | 'pending' | 'approved' | 'rejected';

export interface KpiCardProps {
  value: number | string;
  label: string;
  tone?: KpiTone;
  className?: string;
}

/** Single headline metric: large coloured value with a label underneath. */
export function KpiCard({ value, label, tone = 'neutral', className }: KpiCardProps) {
  return (
    <div className={cn(styles.card, className)}>
      <span className={cn(styles.value, styles[tone])}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
