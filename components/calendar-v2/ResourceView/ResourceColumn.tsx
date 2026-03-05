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
    onMouseDown?: (e: React.MouseEvent) => void;
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
    onMouseDown,
}: ResourceColumnProps) {
    const isMultiUnit = camera.quantity > 1;
    const laneCount = showLanes && isMultiUnit ? camera.quantity : 1;
    const columnWidth = isMultiUnit && showLanes ? Math.max(laneCount * 100, 120) : 200;
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
    const { assignments, effectiveLaneCount } = useMemo(() => {
        const slots: Array<Array<{ start: number; end: number }>> = [];
        const assignments: Array<{ booking: any; lane: number }> = [];

        // Sort bookings by start time
        const sortedBookings = [...bookings].sort((a, b) =>
            new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime()
        );

        sortedBookings.forEach((booking) => {
            const start = new Date(booking.pickup_time).getTime();
            const end = new Date(booking.return_time).getTime();

            // Find first lane that doesn't overlap
            let assignedLane = -1;
            for (let lane = 0; lane < slots.length; lane++) {
                const hasConflict = slots[lane].some(
                    (slot) => !(end <= slot.start || start >= slot.end)
                );
                if (!hasConflict) {
                    slots[lane].push({ start, end });
                    assignedLane = lane;
                    break;
                }
            }

            // If no lane available
            if (assignedLane === -1) {
                if (showLanes && isMultiUnit && slots.length >= camera.quantity) {
                    // If operating in strict lane mode and full, cram onto lane 0
                    slots[0].push({ start, end });
                    assignedLane = 0;
                } else {
                    // Otherwise open a new lane for this overlap
                    slots.push([{ start, end }]);
                    assignedLane = slots.length - 1;
                }
            }

            assignments.push({ booking, lane: assignedLane });
        });

        // Determine effective lane count visually
        let effectiveCount = 1;
        if (showLanes && isMultiUnit) {
            effectiveCount = camera.quantity;
        } else {
            effectiveCount = Math.max(1, slots.length);
        }

        return { assignments, effectiveLaneCount: effectiveCount };
    }, [bookings, showLanes, isMultiUnit, camera.quantity]);

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
                'border-r border-border/50 relative h-full group/column cursor-crosshair shrink-0 transition-all'
            )}
            style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
            onMouseDown={onMouseDown}
            onClick={handleEmptyClick}
        >
            {/* Lane Dividers */}
            {effectiveLaneCount > 1 && (
                <div className="absolute inset-0 flex divide-x divide-dashed divide-border/30 pointer-events-none">
                    {Array.from({ length: effectiveLaneCount }, (_, i) => (
                        <div key={i} className="flex-1" />
                    ))}
                </div>
            )}

            {/* Hover hint on empty */}
            <div className="absolute inset-0 opacity-0 group-hover/column:opacity-100 pointer-events-none bg-primary/[0.02] transition-opacity" />

            {/* Booking Blocks */}
            {assignments.map(({ booking, lane }) => {
                const { top, height } = getBookingPosition(booking);
                const laneWidth = 100 / effectiveLaneCount;
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
