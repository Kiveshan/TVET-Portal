import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Max width of the card in px. */
  width?: number;
}

export function Card({ width, className, style, children, ...rest }: CardProps) {
  return (
    <div className={cn(styles.card, className)} style={{ maxWidth: width, ...style }} {...rest}>
      {children}
    </div>
  );
}
