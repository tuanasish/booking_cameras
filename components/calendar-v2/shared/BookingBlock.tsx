'use client';

import { Booking } from '@/lib/types/database';
import { format } from 'date-fns';
import clsx from 'clsx';

interface BookingBlockProps {
    booking: Booking & {
        customer: { name: string; phone: string; platforms: string[] | null };
        booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
        tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
    };
    top: number;
    height: number;
    width?: string;
    left?: string;
    onClick?: () => void;
}

export default function BookingBlock({
    booking,
    top,
    height,
    width = 'calc(100% - 4px)',
    left = '2px',
    onClick,
}: BookingBlockProps) {
    const pickupTask = booking.tasks?.find((t) => t.type === 'pickup');
    const returnTask = booking.tasks?.find((t) => t.type === 'return');
    const isPickupDone = pickupTask?.completed_at !== null;
    const isReturnDone = returnTask?.completed_at !== null;
    const isCompleted = isPickupDone && isReturnDone;

    // Check if overdue
    const returnTime = new Date(booking.return_time);
    const isOverdue = !isReturnDone && returnTime < new Date();

    // Get styling based on status
    const getStatusStyles = () => {
        if (isOverdue) {
            return {
                bg: 'bg-red-900/10 border border-red-500/50',
                border: 'border-l-4 border-l-red-500',
                badgeClass: 'bg-red-500 text-white',
                badgeText: 'QUÁ HẠN',
                textColor: 'text-red-400',
                icon: 'warning',
            };
        }

        switch (booking.payment_status) {
            case 'paid':
                return {
                    bg: 'bg-emerald-900/40',
                    border: 'border-l-4 border-l-emerald-500',
                    badgeClass: 'text-emerald-400',
                    badgeText: 'Đã TT',
                    textColor: 'text-emerald-400',
                    icon: isCompleted ? 'done_all' : 'check_circle',
                };
            case 'deposited':
                return {
                    bg: 'bg-amber-900/40',
                    border: 'border-l-4 border-l-amber-500',
                    badgeClass: 'text-amber-400',
                    badgeText: 'Đã cọc',
                    textColor: 'text-amber-400',
                    icon: 'pending',
                };
            case 'pending':
            default:
                return {
                    bg: 'bg-red-900/40',
                    border: 'border-l-4 border-l-red-500',
                    badgeClass: 'text-red-400',
                    badgeText: 'Chưa cọc',
                    textColor: 'text-red-400',
                    icon: 'warning',
                };
        }
    };

    const styles = getStatusStyles();
    const pickupTime = format(new Date(booking.pickup_time), 'HH:mm');
    const returnTimeStr = format(new Date(booking.return_time), 'HH:mm');
    const isCompact = height < 60;

    return (
        <div
            className={clsx(
                'absolute rounded p-2 cursor-pointer hover:brightness-110 transition-all shadow-sm z-20',
                styles.bg,
                styles.border
            )}
            style={{
                top: `${top}px`,
                height: `${Math.max(height, 28)}px`,
                width,
                left,
            }}
            onClick={onClick}
        >
            {isCompact ? (
                // Compact view for short bookings
                <div className="flex items-center justify-between h-full gap-2">
                    <span className={clsx('text-[10px] font-semibold', styles.textColor)}>
                        {pickupTime} - {returnTimeStr}
                    </span>
                    <span className="text-xs font-bold text-white truncate flex-1">
                        {(booking as any).customer?.name || 'Khách hàng'}
                    </span>
                    <span className={clsx('material-symbols-outlined text-[14px]', styles.textColor)}>
                        {styles.icon}
                    </span>
                </div>
            ) : (
                // Full view
                <>
                    <div className="flex justify-between items-start mb-1">
                        {isOverdue ? (
                            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded', styles.badgeClass)}>
                                {styles.badgeText}
                            </span>
                        ) : (
                            <span className={clsx('text-[10px] font-bold uppercase tracking-wide', styles.badgeClass)}>
                                {styles.badgeText}
                            </span>
                        )}
                        <span className={clsx('material-symbols-outlined text-[14px]', styles.textColor)}>
                            {styles.icon}
                        </span>
                    </div>
                    <p className="text-white text-xs font-bold truncate">
                        {(booking as any).customer?.name || 'Khách hàng'}
                    </p>
                    <p className="text-slate-400 text-xs truncate">
                        {pickupTime} - {returnTimeStr}
                    </p>

                    {/* Task badges */}
                    {height >= 100 && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            {isPickupDone && (
                                <span className="bg-[#111318] text-white text-[9px] px-1 rounded border border-emerald-500/30">
                                    N ✓
                                </span>
                            )}
                            {isReturnDone && (
                                <span className="bg-[#111318] text-white text-[9px] px-1 rounded border border-emerald-500/30">
                                    T ✓
                                </span>
                            )}
                            {!isPickupDone && (
                                <span className="bg-[#111318] text-white text-[9px] px-1 rounded border border-slate-500/30">
                                    N
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
