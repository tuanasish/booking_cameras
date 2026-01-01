'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface DayHeaderProps {
    date: Date;
    isToday: boolean;
    busyPercent: number;
}

export default function DayHeader({ date, isToday, busyPercent }: DayHeaderProps) {
    const getProgressColor = () => {
        if (busyPercent >= 80) return 'bg-red-500';
        if (busyPercent >= 50) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div
            className={clsx(
                'flex flex-col items-center justify-center py-3 relative group hover:bg-[#1c1f27] transition-colors',
                isToday && 'bg-[#1c1f27]/50'
            )}
        >
            {/* Day name */}
            <span
                className={clsx(
                    'text-xs font-medium uppercase mb-1',
                    isToday ? 'text-primary font-bold' : 'text-slate-400'
                )}
            >
                {format(date, 'EEE', { locale: vi })}
            </span>

            {/* Day number */}
            <div
                className={clsx(
                    'flex items-center justify-center size-8 rounded-full font-bold text-lg',
                    isToday
                        ? 'bg-primary text-white shadow-[0_0_10px_rgba(19,91,236,0.4)]'
                        : 'text-white group-hover:bg-[#282e39]'
                )}
            >
                {format(date, 'd')}
            </div>

            {/* Busy Indicator */}
            <div className="w-full px-4 mt-2">
                <div className="h-1 w-full bg-[#282e39] rounded-full overflow-hidden">
                    <div
                        className={clsx('h-full transition-all', getProgressColor())}
                        style={{ width: `${busyPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
