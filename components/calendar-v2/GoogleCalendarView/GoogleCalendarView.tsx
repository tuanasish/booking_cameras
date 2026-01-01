'use client';

import { useState, useMemo } from 'react';
import { Camera, Booking } from '@/lib/types/database';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import CalendarSidebar from './CalendarSidebar';
import GoogleWeekGrid from './GoogleWeekGrid';

interface GoogleCalendarViewProps {
    cameras: Camera[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
        }
    >;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
}

export default function GoogleCalendarView({
    cameras,
    bookings,
    onBookingClick,
    onCreateBooking,
}: GoogleCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>(
        cameras.map((c) => c.id)
    );

    // Calculate week range
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Navigation
    const handlePrevWeek = () => setCurrentDate((d) => subWeeks(d, 1));
    const handleNextWeek = () => setCurrentDate((d) => addWeeks(d, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Camera toggle
    const handleCameraToggle = (cameraId: string) => {
        setSelectedCameraIds((prev) =>
            prev.includes(cameraId)
                ? prev.filter((id) => id !== cameraId)
                : [...prev, cameraId]
        );
    };

    // Handle create booking
    const handleCreateBooking = (date: Date, hour: number) => {
        const cameraId = selectedCameraIds[0] || cameras[0]?.id;
        if (cameraId) {
            onCreateBooking?.(cameraId, date, hour);
        }
    };

    // Handle sidebar create
    const handleSidebarCreate = () => {
        const cameraId = selectedCameraIds[0] || cameras[0]?.id;
        if (cameraId) {
            onCreateBooking?.(cameraId, selectedDate);
        }
    };

    return (
        <div className="flex flex-1 overflow-hidden bg-background-dark">
            {/* Sidebar */}
            <CalendarSidebar
                currentDate={currentDate}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                    setSelectedDate(date);
                    setCurrentDate(date);
                }}
                cameras={cameras}
                selectedCameraIds={selectedCameraIds}
                onCameraToggle={handleCameraToggle}
                onCreateBooking={handleSidebarCreate}
            />

            {/* Main Calendar */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border-dark flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 rounded border border-border-dark text-sm font-medium hover:bg-surface-dark transition-colors"
                        >
                            Hôm nay
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevWeek}
                                className="p-2 rounded-full hover:bg-surface-dark transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_left</span>
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="p-2 rounded-full hover:bg-surface-dark transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_right</span>
                            </button>
                        </div>
                        <h2 className="text-xl font-medium ml-2">
                            {format(currentDate, 'MMMM yyyy', { locale: vi })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="hidden md:flex items-center relative">
                            <span className="material-symbols-outlined absolute left-2 text-slate-500">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                className="pl-9 pr-4 py-2 bg-surface-dark rounded-lg text-sm border-none focus:ring-1 focus:ring-primary placeholder-slate-500 w-64 transition-all"
                            />
                        </div>

                        {/* View dropdown */}
                        <div className="flex items-center gap-2 border border-border-dark rounded px-3 py-1.5 cursor-pointer hover:bg-surface-dark transition-colors">
                            <span className="text-sm font-medium">Week</span>
                            <span className="material-symbols-outlined text-xl">arrow_drop_down</span>
                        </div>
                    </div>
                </div>

                {/* Week Grid */}
                <GoogleWeekGrid
                    weekDays={weekDays}
                    bookings={bookings}
                    selectedCameraIds={selectedCameraIds}
                    onBookingClick={onBookingClick}
                    onCreateBooking={handleCreateBooking}
                />
            </div>
        </div>
    );
}
