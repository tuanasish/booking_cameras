'use client';

import { Camera, Booking } from '@/lib/types/database';
import { useMemo } from 'react';
import clsx from 'clsx';
import BookingBlock from '../shared/BookingBlock';
import CurrentTimeIndicator from '../shared/CurrentTimeIndicator';

interface DayColumnProps {
    date: Date;
    isToday: boolean;
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    cameras: Camera[];
    selectedCameraId: string | null;
    showLanes: boolean;
    startHour: number;
    hourHeight: number;
    totalHeight: number;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
}

export default function DayColumn({
    date,
    isToday,
    bookings,
    cameras,
    selectedCameraId,
    showLanes,
    startHour,
    hourHeight,
    totalHeight,
    onBookingClick,
    onCreateBooking,
}: DayColumnProps) {
    const dateStr = date.toDateString();

    // Calculate position for a booking
    const getBookingPosition = (booking: Booking) => {
        const pickup = new Date(booking.pickup_time);
        const returnTime = new Date(booking.return_time);
        const bookingStartDate = pickup.toDateString();
        const bookingEndDate = returnTime.toDateString();

        let startMinutes: number;
        if (bookingStartDate === dateStr) {
            startMinutes = (pickup.getHours() - startHour) * 60 + pickup.getMinutes();
        } else {
            startMinutes = 0;
        }

        let endMinutes: number;
        if (bookingEndDate === dateStr) {
            endMinutes = (returnTime.getHours() - startHour) * 60 + returnTime.getMinutes();
        } else {
            endMinutes = (22 - startHour) * 60;
        }

        const top = (startMinutes / 60) * hourHeight;
        const height = ((endMinutes - startMinutes) / 60) * hourHeight;

        return { top: Math.max(0, top), height: Math.max(height, 28) };
    };

    // Detect overlapping bookings and assign columns
    const positionedBookings = useMemo(() => {
        // Sort by start time
        const sorted = [...bookings].sort((a, b) =>
            new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime()
        );

        const columns: Array<Array<{ end: number }>> = [];

        return sorted.map((booking) => {
            const pickup = new Date(booking.pickup_time);
            const returnTime = new Date(booking.return_time);
            const start = pickup.getTime();
            const end = returnTime.getTime();

            // Find first column without overlap
            let column = 0;
            for (let i = 0; i < columns.length; i++) {
                const hasConflict = columns[i].some((slot) => start < slot.end);
                if (!hasConflict) {
                    column = i;
                    break;
                }
                column = i + 1;
            }

            if (!columns[column]) columns[column] = [];
            columns[column].push({ end });

            const totalColumns = Math.max(columns.length, 1);
            const width = 100 / totalColumns;
            const left = column * width;

            return {
                booking,
                column,
                totalColumns,
                width,
                left,
            };
        });
    }, [bookings]);

    // Handle empty click
    const handleEmptyClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.booking-block')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / hourHeight) + startHour;

        // Use first camera or selected camera
        const cameraId = selectedCameraId || cameras[0]?.id;
        if (cameraId) {
            onCreateBooking?.(cameraId, date, hour);
        }
    };

    return (
        <div
            className={clsx(
                'relative h-full group/day cursor-crosshair',
                isToday && 'bg-[#1c1f27]/30'
            )}
            style={{ minHeight: `${totalHeight}px` }}
            onClick={handleEmptyClick}
        >
            {/* Hover Ghost */}
            <div className="absolute inset-0 opacity-0 group-hover/day:opacity-100 pointer-events-none bg-white/[0.02] transition-opacity" />

            {/* Current Time Indicator */}
            {isToday && (
                <CurrentTimeIndicator startHour={startHour} hourHeight={hourHeight} />
            )}

            {/* Booking Blocks */}
            {positionedBookings.map(({ booking, width, left }) => {
                const { top, height } = getBookingPosition(booking);

                return (
                    <div key={booking.id} className="booking-block">
                        <BookingBlock
                            booking={booking as any}
                            top={top}
                            height={height}
                            width={`calc(${width}% - 4px)`}
                            left={`calc(${left}% + 2px)`}
                            onClick={() => onBookingClick?.(booking)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
