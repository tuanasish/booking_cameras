import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-surface-dark shadow-xl',
        {
          'p-4': padding === 'sm',
          'p-6 md:p-8': padding === 'md',
          'p-8 md:p-10': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
}


