'use client';

import { Camera, Booking } from '@/lib/types/database';
import { format, isToday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMemo } from 'react';
import clsx from 'clsx';

interface WeekMatrixGridProps {
    weekDays: Date[];
    cameras: Camera[];
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
        }
    >;
    onBookingClick?: (booking: Booking) => void;
    onCreateBooking?: (cameraId: string, date: Date) => void;
}

export default function WeekMatrixGrid({
    weekDays,
    cameras,
    bookings,
    onBookingClick,
    onCreateBooking,
}: WeekMatrixGridProps) {
    // Get bookings for a specific camera on a specific day
    const getBookingsForCameraDay = (cameraId: string, date: Date) => {
        const dateStr = date.toDateString();
        return bookings.filter((b) => {
            // Check if booking contains this camera
            const hasCamera = b.booking_items?.some(
                (item) => item.camera_id === cameraId || item.camera?.id === cameraId
            );
            if (!hasCamera) return false;

            // Check if booking spans this day
            const pickup = new Date(b.pickup_time);
            const returnTime = new Date(b.return_time);
            const bookingStart = new Date(pickup.toDateString());
            const bookingEnd = new Date(returnTime.toDateString());
            const currentDate = new Date(dateStr);
            return bookingStart <= currentDate && bookingEnd >= currentDate;
        });
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-500';
            case 'deposited':
                return 'bg-amber-500';
            case 'pending':
            default:
                return 'bg-red-500';
        }
    };

    // Calculate bar position within a cell (0-100%)
    const getBarPosition = (booking: Booking, date: Date) => {
        const pickup = new Date(booking.pickup_time);
        const returnTime = new Date(booking.return_time);
        const dateStr = date.toDateString();
        const pickupStr = pickup.toDateString();
        const returnStr = returnTime.toDateString();

        // Start position (percentage of day)
        let startPercent: number;
        if (pickupStr === dateStr) {
            startPercent = ((pickup.getHours() * 60 + pickup.getMinutes()) / (24 * 60)) * 100;
        } else {
            startPercent = 0;
        }

        // End position (percentage of day)
        let endPercent: number;
        if (returnStr === dateStr) {
            endPercent = ((returnTime.getHours() * 60 + returnTime.getMinutes()) / (24 * 60)) * 100;
        } else {
            endPercent = 100;
        }

        return {
            left: `${startPercent}%`,
            width: `${Math.max(endPercent - startPercent, 5)}%`,
        };
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
            {/* Header Row - Days */}
            <div className="flex border-b border-border bg-surface shrink-0">
                {/* Camera column header */}
                <div className="w-48 shrink-0 p-4 border-r border-border font-bold text-sm text-text-secondary uppercase tracking-wider">
                    Thiết bị
                </div>

                {/* Day headers */}
                <div className="flex-1 grid grid-cols-7 divide-x divide-border">
                    {weekDays.map((day) => {
                        const isTodayDate = isToday(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={clsx(
                                    'flex flex-col items-center justify-center py-2 transition-colors',
                                    isTodayDate && 'bg-primary/5'
                                )}
                            >
                                <span
                                    className={clsx(
                                        'text-[10px] font-bold uppercase tracking-widest',
                                        isTodayDate ? 'text-primary' : 'text-text-secondary'
                                    )}
                                >
                                    {format(day, 'EEE', { locale: vi })}
                                </span>
                                <span
                                    className={clsx(
                                        'text-xl font-bold mt-0.5',
                                        isTodayDate ? 'text-primary' : 'text-text-main'
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable Body - Camera Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {cameras.map((camera) => (
                    <div key={camera.id} className="flex border-b border-border hover:bg-surface/50 transition-colors group">
                        {/* Camera Name Column */}
                        <div className="w-48 shrink-0 p-4 border-r border-border bg-surface/30">
                            <div className="font-semibold text-sm text-text-main truncate group-hover:text-primary transition-colors">{camera.name}</div>
                            <div className="text-xs text-text-secondary mt-1">SL: {camera.quantity}</div>
                        </div>

                        {/* Day Cells */}
                        <div className="flex-1 grid grid-cols-7 divide-x divide-border">
                            {weekDays.map((day) => {
                                const dayBookings = getBookingsForCameraDay(camera.id, day);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={clsx(
                                            'relative min-h-[70px] p-1.5 cursor-pointer hover:bg-primary/[0.02] transition-colors',
                                            isTodayDate && 'bg-primary/[0.03]'
                                        )}
                                        onClick={() => {
                                            if (dayBookings.length === 0) {
                                                onCreateBooking?.(camera.id, day);
                                            }
                                        }}
                                    >
                                        {/* Booking bars */}
                                        <div className="relative h-full">
                                            {dayBookings.map((booking, idx) => {
                                                const pos = getBarPosition(booking, day);
                                                const customer = (booking as any).customer;

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        className={clsx(
                                                            'absolute h-6 rounded cursor-pointer hover:brightness-110 transition-all flex items-center px-1.5 overflow-hidden',
                                                            getStatusColor(booking.payment_status)
                                                        )}
                                                        style={{
                                                            left: pos.left,
                                                            width: pos.width,
                                                            top: `${idx * 28 + 2}px`,
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onBookingClick?.(booking);
                                                        }}
                                                        title={`${customer?.name || 'Khách'} - ${format(new Date(booking.pickup_time), 'HH:mm')} → ${format(new Date(booking.return_time), 'HH:mm')}`}
                                                    >
                                                        <span className="text-[10px] font-semibold text-black truncate">
                                                            {customer?.name || 'Khách'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Empty state indicator */}
                                        {dayBookings.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-lg">add</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Empty state if no cameras */}
                {cameras.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-slate-500">
                        Không có thiết bị nào
                    </div>
                )}
            </div>

            {/* Legend Footer */}
            <div className="flex items-center gap-6 px-6 py-3 border-t border-border bg-surface text-xs font-medium text-text-secondary shadow-sm">
                <span className="text-text-main font-bold uppercase tracking-wider text-[10px]">Chú thích:</span>
                <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/30"></span> Đã thanh toán
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30"></span> Đã cọc
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></span> Chưa cọc
                </span>
            </div>
        </div>
    );
}
