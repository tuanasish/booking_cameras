'use client';

import { useState, useMemo } from 'react';
import { Camera, Booking } from '@/lib/types/database';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';
import CalendarSidebar from './GoogleCalendarView/CalendarSidebar';
import WeekMatrixGrid from './WeekMatrixView/WeekMatrixGrid';
import ResourceGrid from './ResourceView/ResourceGrid';

type ViewMode = 'week' | 'day';

interface KantraCalendarProps {
    cameras: Camera[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            booking_accessories?: Array<{ accessory_type: string; name: string | null }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
}

export default function KantraCalendar({
    cameras,
    bookings,
    onBookingClick,
    onCreateBooking,
}: KantraCalendarProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>(
        cameras.map((c) => c.id)
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLanes, setShowLanes] = useState(true);

    // Filters
    const [statusFilters, setStatusFilters] = useState({
        pending: true,
        deposited: true,
        paid: true,
    });

    // Calculate week range - Sunday start
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Navigation
    const handlePrevDay = () => setCurrentDate((d) => addDays(d, -1));
    const handleNextDay = () => setCurrentDate((d) => addDays(d, 1));
    const handlePrevWeek = () => setCurrentDate((d) => subWeeks(d, 1));
    const handleNextWeek = () => setCurrentDate((d) => addWeeks(d, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Filter bookings
    const filteredBookings = useMemo(() => {
        let result = bookings.filter((b) => {
            if (b.payment_status === 'cancelled') return false;
            if (!statusFilters[b.payment_status as keyof typeof statusFilters]) return false;
            return true;
        });

        return result;
    }, [bookings, statusFilters]);

    // Filter cameras by selection
    const filteredCameras = useMemo(() => {
        if (selectedCameraIds.length === 0) return cameras;
        return cameras.filter((c) => selectedCameraIds.includes(c.id));
    }, [cameras, selectedCameraIds]);

    // Toggle status filter
    const toggleStatus = (status: keyof typeof statusFilters) => {
        setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
    };

    // Camera toggle
    const handleCameraToggle = (cameraId: string) => {
        setSelectedCameraIds((prev) =>
            prev.includes(cameraId)
                ? prev.filter((id) => id !== cameraId)
                : [...prev, cameraId]
        );
    };

    // Handle sidebar create
    const handleSidebarCreate = () => {
        const cameraId = selectedCameraIds[0] || cameras[0]?.id;
        if (cameraId) {
            onCreateBooking?.(cameraId, selectedDate);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 py-3 gap-3 border-b border-border bg-surface shrink-0 z-50 shadow-sm">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Sidebar Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={clsx(
                                "flex items-center justify-center size-9 rounded-lg border transition-all active:scale-95 shadow-sm z-[60]",
                                sidebarOpen ? "bg-primary border-primary text-white" : "bg-background border-border text-text-secondary hover:text-text-main"
                            )}
                            title={sidebarOpen ? 'Ẩn sidebar' : 'Hiện sidebar'}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {sidebarOpen ? 'menu_open' : 'menu'}
                            </span>
                        </button>

                        {/* Navigation */}
                        <div className="flex items-center bg-background border border-border rounded-lg p-0.5 shadow-sm">
                            <button
                                onClick={viewMode === 'day' ? handlePrevDay : handlePrevWeek}
                                className="size-8 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-3 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                            >
                                Nay
                            </button>
                            <button
                                onClick={viewMode === 'day' ? handleNextDay : handleNextWeek}
                                className="size-8 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-text-main transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Display - Responsive font size */}
                    <h2 className="text-base sm:text-xl font-bold text-text-main tracking-tight truncate ml-auto sm:ml-0">
                        {viewMode === 'week'
                            ? `${format(weekDays[0], 'd/M')} - ${format(weekDays[6], 'd/M')}`
                            : format(currentDate, 'd MMMM', { locale: vi })
                        }
                    </h2>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex flex-1 sm:flex-none p-1 bg-background border border-border rounded-lg">
                        <button
                            onClick={() => setViewMode('week')}
                            className={clsx(
                                'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-[11px] sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                                viewMode === 'week'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-text-secondary hover:text-text-main'
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                            <span className="hidden xs:inline">Tuần</span>
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={clsx(
                                'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-[11px] sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                                viewMode === 'day'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-text-secondary hover:text-text-main'
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">view_column</span>
                            <span className="hidden xs:inline">Ngày</span>
                        </button>
                    </div>

                    {/* Search - Hidden on very small screens, shown in search bar if needed */}
                    <div className="hidden lg:flex items-center relative">
                        <div className="absolute left-3 inset-y-0 flex items-center text-text-secondary pointer-events-none">
                            <span className="material-symbols-outlined text-[20px] translate-y-[0.5px]">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm"
                            className="pl-10 pr-4 py-2 bg-background rounded-lg text-sm border border-border focus:ring-1 focus:ring-primary outline-none placeholder-text-secondary text-text-main w-48 transition-all"
                        />
                    </div>

                    {/* Settings/Refresh */}
                    <button className="flex size-9 items-center justify-center rounded-lg bg-background border border-border text-text-secondary hover:text-text-main transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                </div>
            </header>

            {/* Main Content with Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Collapsible Sidebar */}
                <div
                    className={clsx(
                        'flex flex-col border-r border-border bg-surface transition-all duration-300 z-40 overflow-hidden shrink-0',
                        sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none',
                        'absolute md:relative top-0 bottom-0 left-0 shadow-2xl md:shadow-none h-full'
                    )}
                    style={{ minWidth: 0 }}
                >
                    <div className="w-64 flex flex-col h-full bg-surface">
                        <CalendarSidebar
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onDateSelect={(date) => {
                                setSelectedDate(date);
                                setCurrentDate(date);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            onMonthChange={(date) => setCurrentDate(date)}
                            cameras={cameras}
                            selectedCameraIds={selectedCameraIds}
                            onCameraToggle={handleCameraToggle}
                            onCameraClick={(cameraId) => {
                                setViewMode('day');
                                setSelectedCameraIds([cameraId]);
                            }}
                            onClose={() => setSidebarOpen(false)}
                            onCreateBooking={handleSidebarCreate}
                        />
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {viewMode === 'week' ? (
                        <WeekMatrixGrid
                            weekDays={weekDays}
                            cameras={filteredCameras}
                            bookings={filteredBookings}
                            onBookingClick={onBookingClick}
                            onCreateBooking={onCreateBooking}
                        />
                    ) : (
                        <ResourceGrid
                            date={currentDate}
                            cameras={filteredCameras}
                            bookings={filteredBookings}
                            showLanes={showLanes}
                            onBookingClick={onBookingClick}
                            onCreateBooking={onCreateBooking}
                        />
                    )}
                </div>

                {/* Mobile Floating Action Button */}
                <button
                    onClick={handleSidebarCreate}
                    className="md:hidden fixed bottom-6 right-6 size-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all outline-none"
                    title="Tạo mới"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
        </div>
    );
}
