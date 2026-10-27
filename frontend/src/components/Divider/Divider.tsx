import { cn } from '@/utils/classNames';
import styles from './Divider.module.css';

export interface DividerProps {
  className?: string;
}

/** Pale gold rule shown under page headings. */
export function Divider({ className }: DividerProps) {
  return <hr className={cn(styles.divider, className)} />;
}
