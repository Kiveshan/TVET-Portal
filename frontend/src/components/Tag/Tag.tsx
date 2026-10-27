import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import styles from './Tag.module.css';

export type TagTone = 'slate' | 'mint';

export interface TagProps {
  tone?: TagTone;
  className?: string;
  children: ReactNode;
}

/** Small rounded label, e.g. the DHET / TVET organisation in a table. */
export function Tag({ tone = 'mint', className, children }: TagProps) {
  return <span className={cn(styles.tag, styles[tone], className)}>{children}</span>;
}
