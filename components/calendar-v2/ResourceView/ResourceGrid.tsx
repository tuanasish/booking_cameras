'use client';

import { Camera, Booking } from '@/lib/types/database';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ResourceColumn from './ResourceColumn';
import ResourceHeader from './ResourceHeader';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 60;

interface ResourceGridProps {
    date: Date;
    cameras: Camera[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            booking_accessories?: Array<{ accessory_type: string; name: string | null }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    showLanes: boolean;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number, pickupTime?: Date, returnTime?: Date) => void;
}

export default function ResourceGrid({
    date,
    cameras,
    bookings,
    showLanes,
    onBookingClick,
    onCreateBooking,
}: ResourceGridProps) {
    const dateStr = date.toDateString();
    const isToday = dateStr === new Date().toDateString();
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    // Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartMinutes, setDragStartMinutes] = useState<number | null>(null);
    const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
    const [currentScrollTop, setCurrentScrollTop] = useState(0);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<number | null>(null);

    // Round time to nearest 30 minutes
    const roundToNearestHalfHour = (minutes: number) => {
        return Math.round(minutes / 30) * 30;
    };

    // Calculate time from Y position
    const getTimeFromY = (y: number, containerTop: number, scrollTop: number, headerHeight: number = 0) => {
        const relativeY = y - containerTop + scrollTop - headerHeight;
        const minutes = (relativeY / HOUR_HEIGHT) * 60;
        return roundToNearestHalfHour(Math.max(0, Math.min(24 * 60, minutes)));
    };

    // Pre-calculate bookings map ... (unchanged)
    const bookingsByCameraMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        cameras.forEach(camera => {
            map[camera.id] = bookings.filter((b) => {
                const pickup = new Date(b.pickup_time);
                const returnTime = new Date(b.return_time);
                const bookingStart = new Date(pickup.toDateString());
                const bookingEnd = new Date(returnTime.toDateString());
                const currentDate = new Date(dateStr);
                const overlapsDate = bookingStart <= currentDate && bookingEnd >= currentDate;
                const includesCamera = b.booking_items?.some(
                    (item) => item.camera_id === camera.id || item.camera?.id === camera.id
                );
                return overlapsDate && includesCamera;
            });
        });
        return map;
    }, [bookings, cameras, dateStr]);

    // Get bookings for a specific camera on this date
    const getBookingsForCamera = useCallback((cameraId: string) => {
        return bookingsByCameraMap[cameraId] || [];
    }, [bookingsByCameraMap]);

    // Calculate usage for camera on this day
    const getUsagePercent = useCallback((camera: Camera) => {
        const cameraBookings = getBookingsForCamera(camera.id);
        const bookedQty = cameraBookings.reduce((sum, b) => {
            const item = b.booking_items?.find(
                (item: any) => item.camera_id === camera.id || item.camera?.id === camera.id
            );
            return sum + (item?.quantity || 0);
        }, 0);
        return camera.quantity > 0 ? Math.min(100, (bookedQty / camera.quantity) * 100) : 0;
    }, [getBookingsForCamera]);

    // Current time indicator position
    const now = new Date();
    const currentTimeTop = isToday
        ? ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)
        : -1;

    // Mouse event handlers for drag selection
    const handleMouseDown = useCallback((e: React.MouseEvent, cameraId: string) => {
        if (!gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const header = gridRef.current.querySelector('.sticky.top-0');
        const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
        const y = e.clientY;
        const startMins = getTimeFromY(y, rect.top, gridRef.current.scrollTop, headerHeight);

        setIsDragging(true);
        setDragStartMinutes(startMins);
        setDragCurrentY(y);
        setSelectedCameraId(cameraId);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !gridRef.current) return;
        setDragCurrentY(e.clientY);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging || dragStartMinutes === null || !dragCurrentY || !selectedCameraId || !gridRef.current) {
            setIsDragging(false);
            setDragStartMinutes(null);
            setDragCurrentY(null);
            setSelectedCameraId(null);
            return;
        }

        const rect = gridRef.current.getBoundingClientRect();
        const header = gridRef.current.querySelector('.sticky.top-0');
        const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
        const endMinutes = getTimeFromY(dragCurrentY, rect.top, gridRef.current.scrollTop, headerHeight);

        // Ensure minimum 30 minutes selection
        const minStart = Math.min(dragStartMinutes, endMinutes);
        const maxEnd = Math.max(dragStartMinutes, endMinutes);

        if (maxEnd - minStart >= 30) {
            // Create booking with selected time range
            const pickupDate = new Date(date);
            pickupDate.setHours(Math.floor(minStart / 60), minStart % 60, 0, 0);

            const returnDate = new Date(date);
            returnDate.setHours(Math.floor(maxEnd / 60), maxEnd % 60, 0, 0);

            // Call onCreateBooking with camera and full time range
            if (onCreateBooking) {
                onCreateBooking(selectedCameraId, pickupDate, Math.floor(minStart / 60), pickupDate, returnDate);
            }
        }

        // Reset drag state
        setIsDragging(false);
        setDragStartMinutes(null);
        setDragCurrentY(null);
        setSelectedCameraId(null);
    }, [isDragging, dragStartMinutes, dragCurrentY, selectedCameraId, date, onCreateBooking]);

    // Autoscroll logic
    useEffect(() => {
        if (isDragging && gridRef.current) {
            const container = gridRef.current;
            const threshold = 80;
            const maxScrollSpeed = 12;

            const updateScroll = () => {
                if (dragCurrentY === null) return;
                const rect = container.getBoundingClientRect();
                const distTop = dragCurrentY - rect.top;
                const distBottom = rect.bottom - dragCurrentY;

                let scrollDelta = 0;
                if (distTop < threshold && distTop > -100) {
                    scrollDelta = -maxScrollSpeed * (1 - Math.max(0, distTop) / threshold);
                } else if (distBottom < threshold && distBottom > -100) {
                    scrollDelta = maxScrollSpeed * (1 - Math.max(0, distBottom) / threshold);
                }

                if (scrollDelta !== 0) {
                    container.scrollTop += scrollDelta;
                    setCurrentScrollTop(container.scrollTop);
                }
                scrollInterval.current = requestAnimationFrame(updateScroll);
            };

            scrollInterval.current = requestAnimationFrame(updateScroll);
        } else {
            if (scrollInterval.current) cancelAnimationFrame(scrollInterval.current);
        }

        return () => {
            if (scrollInterval.current) cancelAnimationFrame(scrollInterval.current);
        };
    }, [isDragging, dragCurrentY]);

    // Sync scroll top on manual scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setCurrentScrollTop(e.currentTarget.scrollTop);
    };

    // Calculate selection overlay position
    const selectionOverlay = useMemo(() => {
        if (!isDragging || dragStartMinutes === null || !dragCurrentY || !gridRef.current) return null;

        const rect = gridRef.current.getBoundingClientRect();
        const header = gridRef.current.querySelector('.sticky.top-0');
        const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
        const endMinutes = getTimeFromY(dragCurrentY, rect.top, currentScrollTop, headerHeight);

        const minStart = Math.min(dragStartMinutes, endMinutes);
        const maxEnd = Math.max(dragStartMinutes, endMinutes);

        const top = (minStart / 60) * HOUR_HEIGHT;
        const height = ((maxEnd - minStart) / 60) * HOUR_HEIGHT;

        return { top, height };
    }, [isDragging, dragStartMinutes, dragCurrentY, currentScrollTop]);

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-background relative z-0">
            {/* UNIFIED SCROLL CONTAINER */}
            <div
                ref={gridRef}
                className="flex-1 overflow-auto custom-scrollbar no-scrollbar"
                id="resource-grid-scroll"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onScroll={handleScroll}
            >
                <div className="flex flex-col min-w-max">
                    {/* STICKY HEADER ROW */}
                    <div className="sticky top-0 z-30 flex border-b border-border bg-surface shadow-sm">
                        {/* Corner spacer - STICKY TOP & LEFT */}
                        <div className="w-10 sm:w-16 shrink-0 border-r border-border bg-surface sticky left-0 z-20" />

                        {/* Camera Headers */}
                        <div className="flex">
                            {cameras.map((camera) => (
                                <ResourceHeader
                                    key={camera.id}
                                    camera={camera}
                                    usagePercent={getUsagePercent(camera)}
                                    showLanes={showLanes}
                                />
                            ))}
                            <div className="w-10 sm:w-12 flex items-center justify-center border-r border-border shrink-0 hover:bg-background transition-colors cursor-pointer group">
                                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">add</span>
                            </div>
                        </div>
                    </div>

                    {/* GRID BODY */}
                    <div className="flex relative" style={{ minHeight: `${totalHeight}px` }}>
                        {/* Time Labels Column - STICKY LEFT */}
                        <div className="w-10 sm:w-16 shrink-0 sticky left-0 z-5 bg-surface/90 backdrop-blur-sm border-r border-border shadow-sm">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="text-right pr-1.5 sm:pr-3 text-[8px] sm:text-[10px] font-bold text-text-secondary py-1"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                >
                                    {`${hour.toString().padStart(2, '0')}:00`}
                                </div>
                            ))}
                        </div>

                        {/* Grid Content */}
                        <div className="flex-1 relative">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none z-0">
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        className="border-b border-border/40"
                                        style={{ height: `${HOUR_HEIGHT}px` }}
                                    />
                                ))}
                            </div>

                            {/* Current Time Indicator */}
                            {isToday && currentTimeTop >= 0 && (
                                <div
                                    className="absolute left-0 right-0 z-15 pointer-events-none"
                                    style={{ top: `${currentTimeTop}px` }}
                                >
                                    <div className="flex items-center">
                                        <div className="size-2 sm:size-3 bg-red-500 rounded-full -ml-1 sm:-ml-1.5" />
                                        <div className="flex-1 border-t-2 border-red-500" />
                                    </div>
                                </div>
                            )}

                            {/* Resource Columns */}
                            <div className="flex relative z-1" style={{ height: `${totalHeight}px` }}>
                                {cameras.map((camera, index) => (
                                    <div key={camera.id} className="relative">
                                        <ResourceColumn
                                            camera={camera}
                                            date={date}
                                            bookings={getBookingsForCamera(camera.id)}
                                            showLanes={showLanes}
                                            startHour={START_HOUR}
                                            hourHeight={HOUR_HEIGHT}
                                            totalHeight={totalHeight}
                                            onBookingClick={onBookingClick}
                                            onCreateBooking={onCreateBooking}
                                            onMouseDown={(e) => handleMouseDown(e, camera.id)}
                                        />

                                        {/* Selection Overlay */}
                                        {isDragging && selectedCameraId === camera.id && selectionOverlay && (
                                            <div
                                                className="absolute left-0 right-0 bg-primary/20 border-2 border-primary rounded-lg pointer-events-none z-30"
                                                style={{
                                                    top: `${selectionOverlay.top}px`,
                                                    height: `${selectionOverlay.height}px`,
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
