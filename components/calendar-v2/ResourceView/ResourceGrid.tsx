'use client';

import { Camera, Booking } from '@/lib/types/database';
import { useMemo } from 'react';
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
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
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

    // Get bookings for a specific camera on this date
    const getBookingsForCamera = (cameraId: string) => {
        return bookings.filter((b) => {
            const pickup = new Date(b.pickup_time);
            const returnTime = new Date(b.return_time);
            const bookingStart = new Date(pickup.toDateString());
            const bookingEnd = new Date(returnTime.toDateString());
            const currentDate = new Date(dateStr);
            const overlapsDate = bookingStart <= currentDate && bookingEnd >= currentDate;
            const includesCamera = b.booking_items?.some(
                (item) => item.camera_id === cameraId || item.camera?.id === cameraId
            );
            return overlapsDate && includesCamera;
        });
    };

    // Calculate usage for camera on this day
    const getUsagePercent = (camera: Camera) => {
        const cameraBookings = getBookingsForCamera(camera.id);
        const bookedQty = cameraBookings.reduce((sum, b) => {
            const item = b.booking_items?.find(
                (i) => i.camera_id === camera.id || i.camera?.id === camera.id
            );
            return sum + (item?.quantity || 0);
        }, 0);
        return camera.quantity > 0 ? Math.min(100, (bookedQty / camera.quantity) * 100) : 0;
    };

    // Current time indicator position
    const now = new Date();
    const currentTimeTop = isToday
        ? ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)
        : -1;

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
            {/* FIXED HEADER ROW - Camera names */}
            <div className="flex shrink-0 border-b border-border bg-surface shadow-sm z-30">
                {/* Time column spacer */}
                <div className="w-16 shrink-0 border-r border-border" />

                {/* Camera Headers - NO overflow here */}
                <div className="flex">
                    {cameras.map((camera) => (
                        <ResourceHeader
                            key={camera.id}
                            camera={camera}
                            usagePercent={getUsagePercent(camera)}
                            showLanes={showLanes}
                        />
                    ))}
                    <div className="w-12 flex items-center justify-center border-r border-border shrink-0 hover:bg-background transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-text-secondary group-hover:text-primary">add</span>
                    </div>
                </div>
            </div>

            {/* SINGLE SCROLLABLE BODY - Time + Columns scroll together */}
            <div className="flex-1 overflow-auto">
                <div className="flex" style={{ minHeight: `${totalHeight}px` }}>
                    {/* Time Labels Column */}
                    <div className="w-16 shrink-0 sticky left-0 z-20 bg-surface border-r border-border shadow-sm">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="text-right pr-3 text-[10px] font-bold text-text-secondary py-1"
                                style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                                {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                        ))}
                    </div>

                    {/* Grid Content - Time lines + Booking columns */}
                    <div className="flex-1 relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none">
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
                                className="absolute left-0 right-0 z-30 pointer-events-none"
                                style={{ top: `${currentTimeTop}px` }}
                            >
                                <div className="flex items-center">
                                    <div className="size-3 bg-red-500 rounded-full -ml-1.5" />
                                    <div className="flex-1 border-t-2 border-red-500" />
                                </div>
                            </div>
                        )}

                        {/* Resource Columns */}
                        <div className="flex relative z-10" style={{ height: `${totalHeight}px` }}>
                            {cameras.map((camera) => (
                                <ResourceColumn
                                    key={camera.id}
                                    camera={camera}
                                    date={date}
                                    bookings={getBookingsForCamera(camera.id)}
                                    showLanes={showLanes}
                                    startHour={START_HOUR}
                                    hourHeight={HOUR_HEIGHT}
                                    totalHeight={totalHeight}
                                    onBookingClick={onBookingClick}
                                    onCreateBooking={onCreateBooking}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
