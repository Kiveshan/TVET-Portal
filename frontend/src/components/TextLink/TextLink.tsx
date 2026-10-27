import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/utils/classNames';
import styles from './TextLink.module.css';

export type TextLinkProps = LinkProps;

/** Gold in-app navigation link, e.g. "Request access" / "Login here". */
export function TextLink({ className, ...rest }: TextLinkProps) {
  return <Link className={cn(styles.link, className)} {...rest} />;
}
