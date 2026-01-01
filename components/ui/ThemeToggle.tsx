'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import clsx from 'clsx';

interface ThemeToggleProps {
    showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full',
                'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                'dark:text-slate-400 dark:hover:bg-surface-dark dark:hover:text-slate-100'
            )}
            title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
        >
            <span className="material-symbols-outlined text-[20px]">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            {showLabel && (
                <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
            )}
        </button>
    );
}
