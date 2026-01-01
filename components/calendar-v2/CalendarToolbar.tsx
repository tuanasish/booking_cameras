'use client';

import { Camera } from '@/lib/types/database';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

type ViewMode = 'resource' | 'week' | 'google';

interface CalendarToolbarProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    currentDate: Date;
    weekDays: Date[];
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    cameras: Camera[];
    selectedCameraId: string | null;
    onCameraSelect: (id: string | null) => void;
    showLanes: boolean;
    onShowLanesChange: (show: boolean) => void;
    showPickup: boolean;
    onShowPickupChange: (show: boolean) => void;
    showReturn: boolean;
    onShowReturnChange: (show: boolean) => void;
    statusFilters: { pending: boolean; deposited: boolean; paid: boolean };
    onToggleStatus: (status: 'pending' | 'deposited' | 'paid') => void;
}

export default function CalendarToolbar({
    viewMode,
    onViewModeChange,
    currentDate,
    weekDays,
    onPrev,
    onNext,
    onToday,
    cameras,
    selectedCameraId,
    onCameraSelect,
    showLanes,
    onShowLanesChange,
    showPickup,
    onShowPickupChange,
    showReturn,
    onShowReturnChange,
    statusFilters,
    onToggleStatus,
}: CalendarToolbarProps) {
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
        <div className="flex flex-col border-b border-border-dark bg-[#111318] shrink-0 z-10 shadow-md">
            {/* Date & View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-4">
                    {/* Navigation */}
                    <div className="flex items-center bg-surface-dark border border-border-dark rounded-lg p-0.5">
                        <button
                            onClick={onPrev}
                            className="size-7 flex items-center justify-center rounded hover:bg-white/5 text-white/70"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button
                            onClick={onToday}
                            className={clsx(
                                'px-2 text-sm font-medium hover:text-white transition-colors',
                                isToday ? 'text-primary' : 'text-white/90'
                            )}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={onNext}
                            className="size-7 flex items-center justify-center rounded hover:bg-white/5 text-white/70"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    {/* Date Display */}
                    <div>
                        {viewMode === 'resource' ? (
                            <>
                                <h1 className="text-white text-2xl font-bold leading-tight">
                                    {format(currentDate, 'd MMM, yyyy', { locale: vi })}
                                </h1>
                                <p className="text-slate-400 text-xs font-normal">
                                    {format(currentDate, 'EEEE', { locale: vi })} • Day View
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-white text-lg font-bold leading-tight">
                                    {format(weekDays[0], 'd MMM', { locale: vi })} - {format(weekDays[6], 'd MMM, yyyy', { locale: vi })}
                                </h1>
                                <span className="text-slate-400 text-xs">Tuần {format(currentDate, 'w')}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm font-medium">Mode:</span>
                    <div className="flex p-1 bg-surface-dark border border-border-dark rounded-lg">
                        <button
                            onClick={() => onViewModeChange('google')}
                            className={clsx(
                                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                                viewMode === 'google'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                            Google
                        </button>
                        <button
                            onClick={() => onViewModeChange('week')}
                            className={clsx(
                                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                                viewMode === 'week'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                            Week
                        </button>
                        <button
                            onClick={() => onViewModeChange('resource')}
                            className={clsx(
                                'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
                                viewMode === 'resource'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            <span className="material-symbols-outlined text-[16px]">view_column</span>
                            Resource
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 px-6 pb-3 overflow-x-auto">
                {/* Task Type Filters */}
                <div className="flex items-center gap-2 pr-4 border-r border-border-dark">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-dark bg-surface-dark cursor-pointer hover:border-slate-500 transition-colors select-none group">
                        <input
                            type="checkbox"
                            checked={showPickup}
                            onChange={(e) => onShowPickupChange(e.target.checked)}
                            className="rounded border-slate-600 bg-transparent text-primary focus:ring-offset-[#111318] focus:ring-primary size-3.5"
                        />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white">Nhận (N)</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-dark bg-surface-dark cursor-pointer hover:border-slate-500 transition-colors select-none group">
                        <input
                            type="checkbox"
                            checked={showReturn}
                            onChange={(e) => onShowReturnChange(e.target.checked)}
                            className="rounded border-slate-600 bg-transparent text-primary focus:ring-offset-[#111318] focus:ring-primary size-3.5"
                        />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white">Trả (T)</span>
                    </label>
                </div>

                {/* Status Filters */}
                <div className="flex items-center gap-2 pl-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
                    <button
                        onClick={() => onToggleStatus('pending')}
                        className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs font-medium',
                            statusFilters.pending
                                ? 'border-red-900/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 ring-1 ring-inset ring-red-500/20'
                                : 'border-border-dark bg-surface-dark text-slate-500 hover:bg-border-dark'
                        )}
                    >
                        <span className="size-2 rounded-full bg-red-500"></span>
                        Chưa cọc
                    </button>
                    <button
                        onClick={() => onToggleStatus('deposited')}
                        className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs font-medium',
                            statusFilters.deposited
                                ? 'border-amber-900/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ring-1 ring-inset ring-amber-500/20'
                                : 'border-border-dark bg-surface-dark text-slate-500 hover:bg-border-dark'
                        )}
                    >
                        <span className="size-2 rounded-full bg-amber-500"></span>
                        Đã cọc
                    </button>
                    <button
                        onClick={() => onToggleStatus('paid')}
                        className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs font-medium',
                            statusFilters.paid
                                ? 'border-emerald-900/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 ring-1 ring-inset ring-emerald-500/20'
                                : 'border-border-dark bg-surface-dark text-slate-500 hover:bg-border-dark'
                        )}
                    >
                        <span className="size-2 rounded-full bg-emerald-500"></span>
                        Đã TT
                    </button>
                </div>

                {/* Show Lanes Toggle */}
                <div className="ml-auto">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLanes}
                                onChange={(e) => onShowLanesChange(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#282e39] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                            Show lanes
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}
