'use client';

import { Booking, Camera } from '@/lib/types/database';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface HourlyViewProps {
    date: Date;
    camera: Camera;
    bookings: Array<
        Booking & {
            customer: { name: string; phone: string; platforms: string[] | null };
            booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
            booking_accessories?: Array<{ accessory_type: string; name: string | null }>;
            tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
        }
    >;
    availableCount: number;
    onSlotClick?: (hour: number) => void;
    onCollapse?: () => void;
    onBookingClick?: (booking: Booking) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HourlyView({
    date,
    camera,
    bookings,
    availableCount,
    onSlotClick,
    onCollapse,
    onBookingClick,
}: HourlyViewProps) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate position for each booking
    const getBookingPosition = (booking: Booking) => {
        const pickup = new Date(booking.pickup_time);
        const returnTime = new Date(booking.return_time);
        const dateStr = date.toDateString();

        // Determine start and end hours for this day
        let startHour: number;
        let endHour: number;

        if (pickup.toDateString() === dateStr) {
            startHour = pickup.getHours() + pickup.getMinutes() / 60;
        } else {
            startHour = 0; // Booking started before this day
        }

        if (returnTime.toDateString() === dateStr) {
            endHour = returnTime.getHours() + returnTime.getMinutes() / 60;
        } else {
            endHour = 24; // Booking ends after this day
        }

        const topPercent = (startHour / 24) * 100;
        const heightPercent = ((endHour - startHour) / 24) * 100;

        return { topPercent, heightPercent, startHour, endHour };
    };

    // Get color based on payment status
    const getBookingColor = (booking: Booking) => {
        switch (booking.payment_status) {
            case 'paid':
                return 'bg-emerald-500/30 border-emerald-500 text-emerald-100';
            case 'deposited':
                return 'bg-yellow-500/30 border-yellow-500 text-yellow-100';
            case 'pending':
                return 'bg-red-500/30 border-red-500 text-red-100';
            default:
                return 'bg-slate-500/30 border-slate-500 text-slate-100';
        }
    };

    // Filter bookings for this camera
    const cameraBookings = bookings.filter((b) =>
        b.booking_items?.some((item) => item.camera_id === camera.id || item.camera?.id === camera.id)
    );

    return (
        <div className="animate-in slide-in-from-top-2 duration-300 bg-[#0d1117] rounded-lg border border-border-dark overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#161b24] border-b border-border-dark">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                        {format(date, 'EEEE, dd/MM', { locale: vi })}
                    </span>
                    <span className="text-[10px] text-[#9da6b9]">
                        - {camera.name}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        availableCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    )}>
                        {availableCount} trống
                    </span>
                    {onCollapse && (
                        <button
                            onClick={onCollapse}
                            className="p-1 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">expand_less</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative h-[400px] overflow-y-auto custom-scrollbar">
                {/* Hour Grid */}
                <div className="absolute inset-0">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className={clsx(
                                'absolute w-full border-t border-border-dark/50 hover:bg-[#1e232e]/50 transition-colors cursor-pointer',
                                hour === currentHour && isToday && 'bg-primary/5'
                            )}
                            style={{ top: `${(hour / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
                            onClick={() => onSlotClick?.(hour)}
                        >
                            <span className="absolute left-2 -top-2 text-[10px] text-[#5f687a] font-mono">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}
                </div>

                {/* Current Time Indicator */}
                {isToday && (
                    <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: `${((currentHour + currentMinute / 60) / 24) * 100}%` }}
                    >
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                            <div className="flex-1 h-px bg-primary/70" />
                        </div>
                    </div>
                )}

                {/* Bookings */}
                {cameraBookings.map((booking) => {
                    const { topPercent, heightPercent } = getBookingPosition(booking);

                    return (
                        <div
                            key={booking.id}
                            className={clsx(
                                'absolute left-8 right-2 z-10 rounded border-l-2 px-2 py-1 cursor-pointer hover:brightness-110 transition-all',
                                getBookingColor(booking)
                            )}
                            style={{
                                top: `${topPercent}%`,
                                height: `${Math.max(heightPercent, 4)}%`,
                                minHeight: '24px',
                            }}
                            onClick={() => onBookingClick?.(booking)}
                        >
                            <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold truncate">
                                        {(booking as any).customer?.name || 'Khách hàng'}
                                    </div>
                                    {heightPercent > 8 && (
                                        <div className="text-[9px] opacity-70">
                                            {format(new Date(booking.pickup_time), 'HH:mm')} - {format(new Date(booking.return_time), 'HH:mm')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {booking.payment_status === 'pending' && (
                                        <span className="material-symbols-outlined text-[12px] text-red-400">warning</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
