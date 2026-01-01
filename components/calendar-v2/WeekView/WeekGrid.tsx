'use client';

import { Camera, Booking } from '@/lib/types/database';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMemo } from 'react';
import TimeColumn from '../shared/TimeColumn';
import HourGridLines from '../shared/HourGridLines';
import CurrentTimeIndicator from '../shared/CurrentTimeIndicator';
import DayColumn from './DayColumn';
import DayHeader from './DayHeader';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 60;

interface WeekGridProps {
    weekDays: Date[];
    cameras: Camera[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            booking_accessories?: Array<{ accessory_type: string; name: string | null }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    selectedCameraId: string | null;
    showLanes: boolean;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date, hour?: number) => void;
}

export default function WeekGrid({
    weekDays,
    cameras,
    bookings,
    selectedCameraId,
    showLanes,
    onBookingClick,
    onCreateBooking,
}: WeekGridProps) {
    const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const todayIndex = weekDays.findIndex((d) => isToday(d));

    // Get bookings for a specific day
    const getBookingsForDay = (date: Date) => {
        const dateStr = date.toDateString();

        return bookings.filter((b) => {
            const pickup = new Date(b.pickup_time);
            const returnTime = new Date(b.return_time);

            const bookingStart = new Date(pickup.toDateString());
            const bookingEnd = new Date(returnTime.toDateString());
            const currentDate = new Date(dateStr);

            return bookingStart <= currentDate && bookingEnd >= currentDate;
        });
    };

    // Calculate busy percentage for each day
    const getDayBusyPercent = (date: Date) => {
        const dayBookings = getBookingsForDay(date);
        // Simple calculation: percentage of slots used
        const totalCameras = cameras.reduce((sum, c) => sum + c.quantity, 0);
        const bookedCount = dayBookings.length;
        return totalCameras > 0 ? Math.min(100, (bookedCount / totalCameras) * 100) : 0;
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative w-full">
            {/* Sticky Header Row */}
            <div className="flex w-full border-b border-border-dark bg-[#111318] pr-[8px]">
                {/* Time Axis Spacer */}
                <div className="w-16 shrink-0 border-r border-border-dark bg-[#111318] z-30 sticky left-0" />

                {/* Day Headers */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-border-dark">
                    {weekDays.map((day, index) => (
                        <DayHeader
                            key={day.toISOString()}
                            date={day}
                            isToday={index === todayIndex}
                            busyPercent={getDayBusyPercent(day)}
                        />
                    ))}
                </div>
            </div>

            {/* Scrollable Grid Body */}
            <div className="flex-1 overflow-y-auto relative bg-[#111318]">
                <div className="flex relative" style={{ minHeight: `${totalHeight}px` }}>
                    {/* Time Labels (Sticky Left) */}
                    <TimeColumn startHour={START_HOUR} endHour={END_HOUR} hourHeight={HOUR_HEIGHT} />

                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 ml-16 pointer-events-none">
                        <HourGridLines startHour={START_HOUR} endHour={END_HOUR} hourHeight={HOUR_HEIGHT} />
                    </div>

                    {/* Day Columns */}
                    <div className="grid grid-cols-7 flex-1 divide-x divide-border-dark relative z-10">
                        {weekDays.map((day, index) => (
                            <DayColumn
                                key={day.toISOString()}
                                date={day}
                                isToday={index === todayIndex}
                                bookings={getBookingsForDay(day)}
                                cameras={cameras}
                                selectedCameraId={selectedCameraId}
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
    );
}
