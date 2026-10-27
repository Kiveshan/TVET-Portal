import { cn } from '@/utils/classNames';
import saEducationLogo from '@/assets/images/sa-education.png';
import styles from './Logo.module.css';

export interface LogoProps {
  className?: string;
}

/** Department of Higher Education and Training logo. */
export function Logo({ className }: LogoProps) {
  return (
    <div className={cn(styles.logo, className)}>
      <img src={saEducationLogo} alt="Department of Higher Education and Training, Republic of South Africa" />
    </div>
  );
}
