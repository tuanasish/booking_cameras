'use client';

import { Booking, Customer } from '@/lib/types/database';
import { formatTime, shortenPhone } from '@/lib/utils/format';
import { getPaymentStatusBgColor } from '@/lib/utils/booking';
import { isPast } from '@/lib/utils/date';
import clsx from 'clsx';

interface BookingCardProps {
  booking: Booking & {
    customer: Customer;
    booking_items?: Array<{
      camera: { name: string };
      quantity: number;
    }>;
    booking_accessories?: Array<{
      accessory_type: string;
      name: string | null;
    }>;
    tasks?: Array<{
      type: 'pickup' | 'return';
      completed_at: string | null;
    }>;
  };
  type: 'pickup' | 'return';
  onClick?: () => void;
}

const platformIcons: Record<string, string> = {
  IG: 'photo_camera',
  ZL: 'chat',
  TT: 'video_library',
  FB: 'social_leaderboard',
  VL: 'storefront',
};

export default function BookingCard({ booking, type, onClick }: BookingCardProps) {
  const isPickup = type === 'pickup';
  const time = isPickup ? booking.pickup_time : booking.return_time;
  const isCompleted = booking.tasks?.some(
    (t) => t.type === type && t.completed_at !== null
  );
  const isLate = !isCompleted && isPast(time) && type === 'return';

  const bgColor = getPaymentStatusBgColor(booking.payment_status);
  const borderColor =
    booking.payment_status === 'pending'
      ? 'border-red-500'
      : booking.payment_status === 'deposited'
        ? 'border-yellow-500'
        : 'border-emerald-500';

  const textColor =
    booking.payment_status === 'pending'
      ? 'text-red-100'
      : booking.payment_status === 'deposited'
        ? 'text-yellow-100'
        : 'text-emerald-100';

  const accentColor =
    booking.payment_status === 'pending'
      ? 'text-red-500'
      : booking.payment_status === 'deposited'
        ? 'text-yellow-500'
        : 'text-emerald-500';

  const platform = booking.customer.platforms?.[0] || 'Website';
  const platformIcon = platformIcons[platform] || 'public';

  const accessories = booking.booking_accessories || [];
  const hasTripod = accessories.some((a) => a.accessory_type === 'tripod');
  const hasReflector = accessories.some((a) => a.accessory_type === 'reflector');
  const hasCCCD = booking.deposit_type === 'cccd';

  return (
    <div
      className={clsx(
        'booking-card relative group cursor-pointer rounded p-2 hover:shadow-lg transition-all border-l-[3px]',
        bgColor,
        borderColor,
        isCompleted && 'opacity-70',
        isLate && 'ring-1 ring-red-500/50'
      )}
      onClick={onClick}
    >
      {/* Badges */}
      {isCompleted && (
        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[10px]">check</span>
          DONE
        </div>
      )}
      {isLate && (
        <div className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-0.5 animate-pulse">
          <span className="material-symbols-outlined text-[10px]">warning</span>
          LATE
        </div>
      )}

      {/* Time Range */}
      <div className="flex justify-between items-start mb-1">
        <div className={clsx('flex items-center gap-1 font-bold text-[11px]', textColor)}>
          <span className={accentColor}>{isPickup ? '↓' : '↑'}</span>
          {formatTime(time)}
        </div>
        <div className="text-[9px] text-[#9da6b9]/70 font-mono">
          {formatTime(booking.pickup_time)} - {formatTime(booking.return_time)}
        </div>
      </div>

      {/* Customer Name & Phone */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white font-medium truncate">{booking.customer.name}</span>
        <span className={clsx('text-[10px] font-mono', `${accentColor}/80`)}>
          {shortenPhone(booking.customer.phone)}
        </span>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-1 text-[10px] text-[#9da6b9]">
        <span className="material-symbols-outlined text-[12px]">{platformIcon}</span>
        <span>{platform}</span>
      </div>

      {/* Accessories */}
      {(hasTripod || hasReflector || hasCCCD) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {hasTripod && (
            <span className="px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[9px] border border-yellow-500/20">
              Tripod
            </span>
          )}
          {hasReflector && (
            <span className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] border border-blue-500/20">
              Hắt sáng
            </span>
          )}
          {hasCCCD && (
            <span className={clsx(
              'px-1 py-0.5 rounded text-[9px] border',
              booking.payment_status === 'pending'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            )}>
              CCCD
            </span>
          )}
        </div>
      )}
    </div>
  );
}


