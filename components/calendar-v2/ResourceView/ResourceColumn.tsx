'use client';

import { Camera, Booking } from '@/lib/types/database';
import { useMemo } from 'react';
import clsx from 'clsx';
import BookingBlock from '../shared/BookingBlock';

interface ResourceColumnProps {
    camera: Camera;
    date: Date;
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    showLanes: boolean;
    startHour: number;
    hourHeight: number;
    totalHeight: number;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
}

export default function ResourceColumn({
    camera,
    date,
    bookings,
    showLanes,
    startHour,
    hourHeight,
    totalHeight,
    onBookingClick,
    onCreateBooking,
}: ResourceColumnProps) {
    const isMultiUnit = camera.quantity > 1;
    const laneCount = showLanes && isMultiUnit ? Math.min(camera.quantity, 3) : 1;
    const columnWidth = isMultiUnit && showLanes ? 320 : 256;
    const dateStr = date.toDateString();

    // Calculate position for a booking
    const getBookingPosition = (booking: Booking) => {
        const pickup = new Date(booking.pickup_time);
        const returnTime = new Date(booking.return_time);
        const bookingStartDate = pickup.toDateString();
        const bookingEndDate = returnTime.toDateString();

        // Determine start time on this day
        let startMinutes: number;
        if (bookingStartDate === dateStr) {
            startMinutes = (pickup.getHours() - startHour) * 60 + pickup.getMinutes();
        } else {
            startMinutes = 0; // Started before today
        }

        // Determine end time on this day
        let endMinutes: number;
        if (bookingEndDate === dateStr) {
            endMinutes = (returnTime.getHours() - startHour) * 60 + returnTime.getMinutes();
        } else {
            endMinutes = (24 - startHour) * 60; // Ends after today - show until midnight
        }

        const top = (startMinutes / 60) * hourHeight;
        const height = ((endMinutes - startMinutes) / 60) * hourHeight;

        return { top: Math.max(0, top), height: Math.max(height, 28) };
    };

    // Assign bookings to lanes (simple algorithm: first-fit)
    const laneAssignments = useMemo(() => {
        if (laneCount === 1) {
            return bookings.map((b) => ({ booking: b, lane: 0 }));
        }

        const lanes: Array<Array<{ start: number; end: number }>> = Array.from(
            { length: laneCount },
            () => []
        );

        return bookings.map((booking) => {
            const pickup = new Date(booking.pickup_time);
            const returnTime = new Date(booking.return_time);
            const start = pickup.getTime();
            const end = returnTime.getTime();

            // Find first lane that doesn't overlap
            for (let lane = 0; lane < laneCount; lane++) {
                const hasConflict = lanes[lane].some(
                    (slot) => !(end <= slot.start || start >= slot.end)
                );
                if (!hasConflict) {
                    lanes[lane].push({ start, end });
                    return { booking, lane };
                }
            }

            // Default to first lane if all full
            lanes[0].push({ start, end });
            return { booking, lane: 0 };
        });
    }, [bookings, laneCount]);

    // Handle empty area click
    const handleEmptyClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.booking-block')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / hourHeight) + startHour;

        onCreateBooking?.(camera.id, date, hour);
    };

    return (
        <div
            className={clsx(
                'border-r border-border-dark/50 relative h-full group/column cursor-crosshair'
            )}
            style={{ width: `${columnWidth}px` }}
            onClick={handleEmptyClick}
        >
            {/* Lane Dividers */}
            {laneCount > 1 && (
                <div className="absolute inset-0 flex divide-x divide-dashed divide-border-dark/30 pointer-events-none">
                    {Array.from({ length: laneCount }, (_, i) => (
                        <div key={i} className="flex-1" />
                    ))}
                </div>
            )}

            {/* Hover hint on empty */}
            <div className="absolute inset-0 opacity-0 group-hover/column:opacity-100 pointer-events-none bg-white/[0.02] transition-opacity" />

            {/* Booking Blocks */}
            {laneAssignments.map(({ booking, lane }) => {
                const { top, height } = getBookingPosition(booking);
                const laneWidth = 100 / laneCount;
                const left = `calc(${lane * laneWidth}% + 2px)`;
                const width = `calc(${laneWidth}% - 4px)`;

                return (
                    <div key={booking.id} className="booking-block">
                        <BookingBlock
                            booking={booking as any}
                            top={top}
                            height={height}
                            width={width}
                            left={left}
                            onClick={() => onBookingClick?.(booking)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
