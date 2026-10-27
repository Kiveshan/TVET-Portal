import { cn } from '@/utils/classNames';
import styles from './ColorStripe.module.css';

const segments = [
  { color: 'var(--stripe-red)', flex: 3 },
  { color: 'var(--stripe-blue)', flex: 4 },
  { color: 'var(--stripe-green)', flex: 3 },
  { color: 'var(--stripe-yellow)', flex: 3 },
  { color: 'var(--stripe-red)', flex: 4 },
  { color: 'var(--stripe-blue)', flex: 3 },
];

export interface ColorStripeProps {
  className?: string;
}

/** Decorative multi-colour bar at the bottom of the auth cards. */
export function ColorStripe({ className }: ColorStripeProps) {
  return (
    <div className={cn(styles.stripe, className)} aria-hidden="true">
      {segments.map((segment, index) => (
        <span key={index} style={{ background: segment.color, flex: segment.flex }} />
      ))}
    </div>
  );
}
