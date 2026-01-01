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
    const [viewMode, setViewMode] = useState<ViewMode>('week');
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
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Sidebar Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex items-center justify-center size-9 rounded-lg bg-background border border-border text-text-secondary hover:text-text-main transition-colors"
                        title={sidebarOpen ? 'Ẩn sidebar' : 'Hiện sidebar'}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {sidebarOpen ? 'menu_open' : 'menu'}
                        </span>
                    </button>

                    {/* Navigation */}
                    <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                        <button
                            onClick={viewMode === 'day' ? handlePrevDay : handlePrevWeek}
                            className="size-7 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-3 text-sm font-medium text-text-secondary hover:text-text-main transition-colors"
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={viewMode === 'day' ? handleNextDay : handleNextWeek}
                            className="size-7 flex items-center justify-center rounded hover:bg-surface text-text-secondary hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    {/* Date Display */}
                    <h2 className="text-xl font-medium text-text-main tracking-tight">
                        {viewMode === 'week'
                            ? `${format(weekDays[0], 'd MMM', { locale: vi })} - ${format(weekDays[6], 'd MMM, yyyy', { locale: vi })}`
                            : format(currentDate, 'd MMMM, yyyy', { locale: vi })
                        }
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="hidden md:flex items-center relative">
                        <span className="material-symbols-outlined absolute left-2 text-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm"
                            className="pl-9 pr-4 py-2 bg-background rounded-lg text-sm border border-border focus:ring-1 focus:ring-primary outline-none placeholder-text-secondary text-text-main w-48 transition-all"
                        />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex p-1 bg-background border border-border rounded-lg">
                        <button
                            onClick={() => setViewMode('week')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                                viewMode === 'week'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-text-secondary hover:text-text-main'
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                            Tuần
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                                viewMode === 'day'
                                    ? 'text-white bg-primary rounded shadow-sm font-bold'
                                    : 'text-text-secondary hover:text-text-main'
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">view_column</span>
                            Ngày
                        </button>
                    </div>

                    {/* Settings */}
                    <button className="flex size-9 items-center justify-center rounded-lg bg-background border border-border text-text-secondary hover:text-text-main transition-colors">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                    </button>
                </div>
            </header>

            {/* Main Content with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Collapsible Sidebar */}
                <div
                    className={clsx(
                        'flex flex-col border-r border-border bg-background transition-all duration-300',
                        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
                    )}
                >
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
            </div>
        </div>
    );
}
