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
    onCreateBooking: () => void;
}

export default function CalendarSidebar({
    currentDate,
    selectedDate,
    onDateSelect,
    cameras,
    selectedCameraIds,
    onCameraToggle,
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
        <aside className="w-64 flex flex-col flex-shrink-0 border-r border-border-dark bg-background-dark overflow-y-auto pt-4 pb-10 hidden lg:flex">
            {/* Create Button */}
            <div className="px-4 mb-6">
                <button
                    onClick={onCreateBooking}
                    className="flex items-center gap-3 bg-surface-dark shadow-none border border-border-dark hover:border-primary/50 rounded-full px-4 py-3 min-w-[140px] transition-all group"
                >
                    <span className="material-symbols-outlined text-4xl text-primary">add</span>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">Tạo mới</span>
                </button>
            </div>

            {/* Mini Calendar */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-2 pl-2 pr-1">
                    <span className="font-medium text-sm">{format(currentDate, 'MMMM yyyy', { locale: vi })}</span>
                    <div className="flex gap-1">
                        <button className="size-7 flex items-center justify-center rounded-full hover:bg-surface-dark">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="size-7 flex items-center justify-center rounded-full hover:bg-surface-dark">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Week day headers */}
                <div className="grid grid-cols-7 text-center text-xs mb-1">
                    {weekDays.map((d, i) => (
                        <span key={i} className="text-slate-500 font-medium py-1">{d}</span>
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
                                    !isCurrentMonth && 'text-slate-600',
                                    isCurrentMonth && !isSelected && 'hover:bg-surface-dark',
                                    isSelected && 'bg-primary text-white',
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
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[20px]">
                        person_search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm khách hàng / Booking ID"
                        className="pl-10 pr-3 py-2 w-full bg-surface-dark rounded border border-transparent focus:border-primary focus:ring-0 text-xs transition-colors"
                    />
                </div>
            </div>

            {/* Cameras Section */}
            <div className="flex flex-col gap-1">
                <details className="group px-2" open>
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-2 rounded hover:bg-surface-dark transition-colors">
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
                                        'text-sm truncate flex-1 transition-colors',
                                        selectedCameraIds.includes(camera.id)
                                            ? 'text-white group-hover/item:text-white'
                                            : 'text-slate-500 group-hover/item:text-white'
                                    )}
                                >
                                    {camera.name}
                                    <span className="text-xs text-slate-500 ml-1">(SL: {camera.quantity})</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </details>

                {/* Accessories Section */}
                <details className="group px-2">
                    <summary className="flex cursor-pointer items-center justify-between px-3 py-2 rounded hover:bg-surface-dark transition-colors">
                        <span className="text-sm font-medium">Phụ kiện</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-180">
                            expand_more
                        </span>
                    </summary>
                    <div className="pt-1 pb-3 pl-3 pr-2 flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer group/item">
                            <input
                                type="checkbox"
                                className="rounded border-gray-500 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 size-4"
                            />
                            <span className="text-sm truncate flex-1 text-slate-500 group-hover/item:text-white transition-colors">
                                Tripods
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group/item">
                            <input
                                type="checkbox"
                                className="rounded border-gray-500 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 size-4"
                            />
                            <span className="text-sm truncate flex-1 text-slate-500 group-hover/item:text-white transition-colors">
                                Lighting
                            </span>
                        </label>
                    </div>
                </details>
            </div>

            {/* Legend */}
            <div className="mt-auto px-4 pt-4">
                <div className="bg-surface-dark/50 rounded-lg p-3 text-xs text-slate-500 border border-border-dark">
                    <p className="font-medium text-white mb-1">Chú thích</p>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="size-2 rounded-full bg-red-400"></div>
                        <span>Chưa cọc</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="size-2 rounded-full bg-yellow-400"></div>
                        <span>Đã cọc</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-teal-400"></div>
                        <span>Đã thanh toán</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
