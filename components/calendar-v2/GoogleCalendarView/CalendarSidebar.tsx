'use client';

import { Camera, Booking } from '@/lib/types/database';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface CalendarSidebarProps {
    currentDate: Date;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    cameras: Camera[];
    selectedCameraIds: string[];
    onCameraToggle: (cameraId: string) => void;
    onCameraClick?: (cameraId: string) => void;
    onClose?: () => void;
    onCreateBooking: () => void;
}

export default function CalendarSidebar({
    currentDate,
    selectedDate,
    onDateSelect,
    cameras,
    selectedCameraIds,
    onCameraToggle,
    onCameraClick,
    onClose,
    onCreateBooking,
}: CalendarSidebarProps) {
    // Generate mini calendar days
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <aside className="w-64 flex flex-col flex-shrink-0 bg-surface overflow-y-auto h-full relative">
            {/* Header for mobile - Close button */}
            <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border mb-4 bg-surface-hover sticky top-0 z-10">
                <span className="font-bold text-text-main uppercase text-xs tracking-widest">Bộ lọc</span>
                <button
                    onClick={onClose}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-surface text-text-secondary active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
            {/* Create Button */}
            <div className="px-4 mb-6">
                <button
                    onClick={onCreateBooking}
                    className="flex items-center gap-3 bg-background shadow-sm border border-border hover:border-primary/50 rounded-full px-4 py-3 min-w-[140px] transition-all group"
                >
                    <span className="material-symbols-outlined text-4xl text-primary">add</span>
                    <span className="font-medium text-sm text-text-main group-hover:text-primary transition-colors">Tạo mới</span>
                </button>
            </div>

            {/* Mini Calendar */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-2 pl-2 pr-1">
                    <span className="font-medium text-sm text-text-main">{format(currentDate, 'MMMM yyyy', { locale: vi })}</span>
                    <div className="flex gap-1">
                        <button className="size-7 flex items-center justify-center rounded-full hover:bg-background text-text-secondary hover:text-text-main transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-7 flex items-center justify-center rounded-full hover:bg-background text-text-secondary hover:text-text-main transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Week day headers */}
                <div className="grid grid-cols-7 text-center text-xs mb-1">
                    {weekDays.map((d, i) => (
                        <span key={i} className="text-text-secondary font-medium py-1">{d}</span>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                    {calendarDays.map((d, i) => {
                        const isCurrentMonth = isSameMonth(d, currentDate);
                        const isSelected = isSameDay(d, selectedDate);
                        const isTodayDate = isToday(d);

                        return (
                            <button
                                key={i}
                                onClick={() => onDateSelect(d)}
                                className={clsx(
                                    'size-7 rounded-full flex items-center justify-center transition-colors',
                                    !isCurrentMonth && 'text-text-secondary/40',
                                    isCurrentMonth && !isSelected && 'hover:bg-background text-text-secondary hover:text-text-main',
                                    isSelected && 'bg-primary text-white font-bold',
                                    isTodayDate && !isSelected && 'ring-1 ring-primary text-primary'
                                )}
                            >
                                {format(d, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <div className="relative flex items-center">
                    <div className="absolute left-3 inset-y-0 flex items-center text-text-secondary pointer-events-none">
                        <span className="material-symbols-outlined text-[20px] translate-y-[0.5px]">
                            person_search
                        </span>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm khách hàng / Booking ID"
                        className="pl-10 pr-3 py-2 w-full bg-background rounded border border-border focus:border-primary focus:ring-0 text-xs transition-colors placeholder-text-secondary text-text-main outline-none flex items-center"
                    />
                </div>
            </div>

            {/* Cameras Section */}
            <div className="flex flex-col gap-1">
                <details className="group px-2" open>
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-2 rounded hover:bg-background transition-colors text-text-main">
                        <span className="text-sm font-medium">Cameras</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-180">
                            expand_more
                        </span>
                    </summary>
                    <div className="pt-1 pb-3 pl-3 pr-2 flex flex-col gap-2">
                        {cameras.map((camera) => (
                            <label key={camera.id} className="flex items-center gap-3 cursor-pointer group/item">
                                <input
                                    type="checkbox"
                                    checked={selectedCameraIds.includes(camera.id)}
                                    onChange={() => onCameraToggle(camera.id)}
                                    className="rounded border-gray-500 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                />
                                <span
                                    className={clsx(
                                        'text-sm truncate flex-1 transition-colors cursor-pointer',
                                        selectedCameraIds.includes(camera.id)
                                            ? 'text-text-main group-hover/item:text-primary'
                                            : 'text-text-secondary group-hover/item:text-text-main'
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onCameraClick?.(camera.id);
                                    }}
                                >
                                    {camera.name}
                                    <span className="text-xs text-text-secondary ml-1">(SL: {camera.quantity})</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </details>

                {/* Accessories Section */}
                <details className="group px-2">
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-2 rounded hover:bg-background transition-colors text-text-main">
                        <span className="text-sm font-medium">Phụ kiện</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-180">
                            expand_more
                        </span>
                    </summary>
                    <div className="pt-1 pb-3 pl-3 pr-2 flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer group/item">
                            <input
                                type="checkbox"
                                className="rounded border-border bg-transparent text-primary focus:ring-0 focus:ring-offset-0 size-4"
                            />
                            <span className="text-sm truncate flex-1 text-text-secondary group-hover/item:text-text-main transition-colors">
                                Tripods
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group/item">
                            <input
                                type="checkbox"
                                className="rounded border-border bg-transparent text-primary focus:ring-0 focus:ring-offset-0 size-4"
                            />
                            <span className="text-sm truncate flex-1 text-text-secondary group-hover/item:text-text-main transition-colors">
                                Lighting
                            </span>
                        </label>
                    </div>
                </details>
            </div>
        </aside>
    );
}
