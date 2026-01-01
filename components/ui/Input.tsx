import clsx from 'clsx';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-2">
        {label && (
          <span className="text-sm font-medium dark:text-slate-200 text-slate-700">
            {label}
          </span>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full h-12 rounded-lg bg-slate-50 dark:bg-input-dark border-slate-200 dark:border-transparent focus:border-primary focus:ring-1 focus:ring-primary dark:text-white text-slate-900 placeholder:text-slate-400 dark:placeholder:text-[#9da6b9] px-4 transition-colors',
              icon && 'pl-11',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-rose-500 text-xs">
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span>{error}</span>
          </div>
        )}
      </label>
    );
  }
);

Input.displayName = 'Input';

export default Input;


