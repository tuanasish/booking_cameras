'use client';

import { Camera, Booking } from '@/lib/types/database';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMemo, useRef, useEffect } from 'react';
import clsx from 'clsx';

const HOUR_HEIGHT = 60; // 60px per hour
const TOTAL_HOURS = 24;

interface GoogleWeekGridProps {
    weekDays: Date[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
        }
    >;
    selectedCameraIds: string[];
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (date: Date, hour: number) => void;
}

export default function GoogleWeekGrid({
    weekDays,
    bookings,
    selectedCameraIds,
    onBookingClick,
    onCreateBooking,
}: GoogleWeekGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const todayIndex = weekDays.findIndex((d) => isToday(d));

    // Auto scroll to 8 AM on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 7 * HOUR_HEIGHT; // 7 AM
        }
    }, []);

    // Generate hour labels
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

    // Filter bookings by selected cameras
    const filteredBookings = useMemo(() => {
        if (selectedCameraIds.length === 0) return bookings;
        return bookings.filter((b) =>
            b.booking_items?.some((item) => selectedCameraIds.includes(item.camera_id || item.camera?.id))
        );
    }, [bookings, selectedCameraIds]);

    // Get bookings for a specific day
    const getBookingsForDay = (date: Date) => {
        const dateStr = date.toDateString();
        return filteredBookings.filter((b) => {
            const pickup = new Date(b.pickup_time);
            const returnTime = new Date(b.return_time);
            const bookingStart = new Date(pickup.toDateString());
            const bookingEnd = new Date(returnTime.toDateString());
            const currentDate = new Date(dateStr);
            return bookingStart <= currentDate && bookingEnd >= currentDate;
        });
    };

    // Calculate position for a booking
    const getBookingPosition = (booking: Booking, date: Date) => {
        const dateStr = date.toDateString();
        const pickup = new Date(booking.pickup_time);
        const returnTime = new Date(booking.return_time);
        const bookingStartDate = pickup.toDateString();
        const bookingEndDate = returnTime.toDateString();

        let startMinutes: number;
        if (bookingStartDate === dateStr) {
            startMinutes = pickup.getHours() * 60 + pickup.getMinutes();
        } else {
            startMinutes = 0;
        }

        let endMinutes: number;
        if (bookingEndDate === dateStr) {
            endMinutes = returnTime.getHours() * 60 + returnTime.getMinutes();
        } else {
            endMinutes = 24 * 60;
        }

        const top = (startMinutes / 60) * HOUR_HEIGHT;
        const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

        return { top, height: Math.max(height, 30) };
    };

    // Get status styling
    const getStatusStyles = (booking: Booking) => {
        switch (booking.payment_status) {
            case 'paid':
                return { bg: 'bg-[#4db6ac]', border: 'border-[#00897b]', text: 'text-black' };
            case 'deposited':
                return { bg: 'bg-[#fdd835]', border: 'border-[#f9a825]', text: 'text-black' };
            case 'pending':
            default:
                return { bg: 'bg-[#e57373]', border: 'border-[#c62828]', text: 'text-black' };
        }
    };

    // Format hour label - use 24h format for consistency with other modes
    const formatHourLabel = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    // Get current time position
    const now = new Date();
    const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT;
    const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative w-full bg-background-dark">
            {/* Week Header */}
            <div className="flex border-b border-border-dark pr-[10px] flex-shrink-0">
                {/* Time column spacer */}
                <div className="w-[60px] flex-shrink-0 border-r border-border-dark">
                    <div className="h-12 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-slate-500">GMT+7</span>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day, index) => {
                        const isTodayDate = isToday(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={clsx(
                                    'flex flex-col items-center justify-center py-2',
                                    index < 6 && 'border-r border-border-dark'
                                )}
                            >
                                <span
                                    className={clsx(
                                        'text-xs font-medium uppercase mb-1',
                                        isTodayDate ? 'text-primary font-bold' : 'text-slate-500'
                                    )}
                                >
                                    {format(day, 'EEE', { locale: vi })}
                                </span>
                                <div
                                    className={clsx(
                                        'size-8 flex items-center justify-center rounded-full text-xl font-medium cursor-pointer transition-colors',
                                        isTodayDate
                                            ? 'bg-primary text-white shadow-md'
                                            : 'hover:bg-surface-dark'
                                    )}
                                >
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable Grid Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto relative bg-background-dark">
                <div className="flex relative" style={{ minHeight: `${totalHeight}px` }}>
                    {/* Time Labels */}
                    <div className="w-[60px] flex-shrink-0 bg-background-dark border-r border-border-dark z-10 select-none sticky left-0">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="text-right pr-2"
                                style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                                <span className="text-xs text-slate-500 -mt-2 inline-block">{formatHourLabel(hour)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 relative">
                        {/* Horizontal grid lines */}
                        <div className="absolute inset-0 pointer-events-none">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="border-b border-border-dark/50 w-full"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                />
                            ))}
                        </div>

                        {/* Day columns with events */}
                        <div className="absolute inset-0 grid grid-cols-7">
                            {weekDays.map((day, dayIndex) => {
                                const isTodayDate = isToday(day);
                                const dayBookings = getBookingsForDay(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={clsx(
                                            'relative h-full',
                                            dayIndex < 6 && 'border-r border-border-dark'
                                        )}
                                    >
                                        {/* Current time indicator */}
                                        {isTodayDate && (
                                            <div
                                                className="absolute w-full border-t-2 border-red-500 z-30"
                                                style={{ top: `${currentTimeTop}px` }}
                                            >
                                                <div className="size-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5 absolute" />
                                            </div>
                                        )}

                                        {/* Event blocks */}
                                        {dayBookings.map((booking) => {
                                            const { top, height } = getBookingPosition(booking, day);
                                            const styles = getStatusStyles(booking);
                                            const pickupTime = format(new Date(booking.pickup_time), 'HH:mm');
                                            const returnTime = format(new Date(booking.return_time), 'HH:mm');
                                            const customer = (booking as any).customer;
                                            const items = (booking as any).booking_items || [];

                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={clsx(
                                                        'absolute left-1 right-2 rounded border-l-4 shadow-sm cursor-pointer hover:brightness-110 transition-all z-10 p-1.5 overflow-hidden flex flex-col gap-0.5',
                                                        styles.bg,
                                                        styles.border
                                                    )}
                                                    style={{ top: `${top}px`, height: `${height}px` }}
                                                    onClick={() => onBookingClick?.(booking)}
                                                >
                                                    <div className={clsx('text-[10px] font-semibold leading-tight flex justify-between', styles.text)}>
                                                        <span>{pickupTime} - {returnTime}</span>
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {booking.payment_status === 'paid' ? 'check_circle' :
                                                                booking.payment_status === 'deposited' ? 'payments' : 'schedule'}
                                                        </span>
                                                    </div>
                                                    <div className={clsx('text-xs font-bold truncate leading-tight', styles.text)}>
                                                        {customer?.name || 'Khách hàng'}
                                                    </div>
                                                    {height >= 60 && items.length > 0 && (
                                                        <div className={clsx('text-[10px] font-medium leading-tight opacity-80', styles.text)}>
                                                            {items.map((item: any) => (
                                                                <div key={item.camera_id || item.camera?.id}>
                                                                    {item.camera?.name || 'Camera'} x{item.quantity}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
