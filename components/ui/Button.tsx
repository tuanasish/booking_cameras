import clsx from 'clsx';
import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-bold transition-all rounded-lg flex items-center justify-center',
        {
          'bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/25':
            variant === 'primary',
          'bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-surface-border text-slate-900 dark:text-white':
            variant === 'secondary',
          'border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-transparent text-slate-700 dark:text-slate-200':
            variant === 'outline',
          'bg-red-500 hover:bg-red-600 text-white': variant === 'danger',
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Đang xử lý...
        </>
      ) : (
        children
      )}
    </button>
  );
}


