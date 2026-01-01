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
        <div className="flex flex-col flex-1 overflow-hidden bg-background-dark">
            {/* Header Row - Days */}
            <div className="flex border-b border-border-dark bg-[#111318] shrink-0">
                {/* Camera column header */}
                <div className="w-48 shrink-0 p-3 border-r border-border-dark font-semibold text-sm text-slate-400">
                    Thiết bị
                </div>

                {/* Day headers */}
                <div className="flex-1 grid grid-cols-7 divide-x divide-border-dark">
                    {weekDays.map((day) => {
                        const isTodayDate = isToday(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={clsx(
                                    'flex flex-col items-center justify-center py-2',
                                    isTodayDate && 'bg-primary/10'
                                )}
                            >
                                <span
                                    className={clsx(
                                        'text-xs font-medium uppercase',
                                        isTodayDate ? 'text-primary' : 'text-slate-500'
                                    )}
                                >
                                    {format(day, 'EEE', { locale: vi })}
                                </span>
                                <span
                                    className={clsx(
                                        'text-lg font-semibold mt-0.5',
                                        isTodayDate ? 'text-primary' : 'text-white'
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
            <div className="flex-1 overflow-y-auto">
                {cameras.map((camera) => (
                    <div key={camera.id} className="flex border-b border-border-dark hover:bg-surface-dark/30 transition-colors">
                        {/* Camera Name Column */}
                        <div className="w-48 shrink-0 p-3 border-r border-border-dark">
                            <div className="font-medium text-sm text-white truncate">{camera.name}</div>
                            <div className="text-xs text-slate-500">SL: {camera.quantity}</div>
                        </div>

                        {/* Day Cells */}
                        <div className="flex-1 grid grid-cols-7 divide-x divide-border-dark">
                            {weekDays.map((day) => {
                                const dayBookings = getBookingsForCameraDay(camera.id, day);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={clsx(
                                            'relative min-h-[60px] p-1 cursor-pointer hover:bg-surface-dark/50 transition-colors',
                                            isTodayDate && 'bg-primary/5'
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
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-slate-600 text-lg">add</span>
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
            <div className="flex items-center gap-4 px-4 py-2 border-t border-border-dark bg-[#111318] text-xs text-slate-500">
                <span className="font-medium">Chú thích:</span>
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded bg-emerald-500"></span> Đã thanh toán
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded bg-amber-500"></span> Đã cọc
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded bg-red-500"></span> Chưa cọc
                </span>
            </div>
        </div>
    );
}
