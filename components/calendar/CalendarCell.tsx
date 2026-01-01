'use client';

import { useState } from 'react';
import { Booking, Camera } from '@/lib/types/database';
import BookingCard from './BookingCard';
import HourlyView from './HourlyView';
import { isToday } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import clsx from 'clsx';

interface CalendarCellProps {
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
  totalCount: number;
  onBookingClick?: (booking: Booking) => void;
}

export default function CalendarCell({
  date,
  camera,
  bookings,
  availableCount,
  totalCount,
  onBookingClick,
}: CalendarCellProps) {
  const router = useRouter();
  const isCurrentDay = isToday(date);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate availability percentage
  const availabilityPercent = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;

  // Get cell background and border based on availability
  const getCellStyle = () => {
    if (availabilityPercent === 0) {
      return 'bg-red-500/10 border-l-2 border-l-red-500';
    }
    if (availabilityPercent <= 50) {
      return 'bg-yellow-500/10 border-l-2 border-l-yellow-500';
    }
    if (availabilityPercent < 100) {
      return 'bg-emerald-500/10 border-l-2 border-l-emerald-500';
    }
    // 100% available - special highlight
    return 'bg-emerald-500/20 border-l-4 border-l-emerald-400';
  };

  // Filter bookings for this date and camera
  const dayBookings = bookings.filter((booking) => {
    const pickupDate = new Date(booking.pickup_time);
    const returnDate = new Date(booking.return_time);
    const cellDate = new Date(date);

    return (
      (pickupDate.toDateString() === cellDate.toDateString() ||
        returnDate.toDateString() === cellDate.toDateString() ||
        (pickupDate <= cellDate && returnDate >= cellDate)) &&
      booking.booking_items?.some((item) => item.camera_id === camera.id || item.camera?.id === camera.id)
    );
  });

  // Separate pickup and return bookings
  const pickupBookings = dayBookings.filter((b) => {
    const pickupDate = new Date(b.pickup_time);
    return pickupDate.toDateString() === date.toDateString();
  });

  const returnBookings = dayBookings.filter((b) => {
    const returnDate = new Date(b.return_time);
    return returnDate.toDateString() === date.toDateString();
  });

  // Handle click on empty area to create booking
  const handleCellClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on the cell itself, not on a booking card or expand button
    if ((e.target as HTMLElement).closest('.booking-card')) return;
    if ((e.target as HTMLElement).closest('.expand-btn')) return;
    if (availableCount === 0) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/bookings/new?cameraId=${camera.id}&date=${dateStr}`);
  };

  // Handle hourly slot click
  const handleSlotClick = (hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hourStr = hour.toString().padStart(2, '0');
    router.push(`/bookings/new?cameraId=${camera.id}&date=${dateStr}&hour=${hourStr}`);
  };

  // If expanded, show HourlyView
  if (isExpanded) {
    return (
      <div className="flex-1 min-w-[150px] p-2 border-r border-border-dark">
        <HourlyView
          date={date}
          camera={camera}
          bookings={dayBookings}
          availableCount={availableCount}
          onSlotClick={handleSlotClick}
          onCollapse={() => setIsExpanded(false)}
          onBookingClick={onBookingClick}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleCellClick}
      className={clsx(
        'flex-1 min-w-[150px] p-2 border-r border-border-dark flex flex-col gap-2 transition-all relative group',
        getCellStyle(),
        isCurrentDay && 'ring-1 ring-primary/30',
        availableCount > 0 && 'cursor-pointer hover:brightness-110'
      )}
    >
      {/* Availability Badge - Top Right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Expand Button */}
        {dayBookings.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="expand-btn p-1 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Xem theo giờ"
          >
            <span className="material-symbols-outlined text-[14px]">expand_content</span>
          </button>
        )}

        {availableCount === 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/50 shadow-lg">
            <span className="material-symbols-outlined text-red-400 text-[14px]">block</span>
            <span className="text-[10px] font-bold text-red-400 uppercase">Hết</span>
          </div>
        ) : (
          <div className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg',
            availabilityPercent === 100
              ? 'bg-emerald-500/30 border border-emerald-400'
              : 'bg-emerald-500/20 border border-emerald-500/50'
          )}>
            <span className="text-lg font-black text-emerald-400">{availableCount}</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Trống</span>
          </div>
        )}
      </div>

      {/* Full availability indicator */}
      {availabilityPercent === 100 && (
        <div className="absolute top-2 left-2">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">event_available</span>
        </div>
      )}

      {/* Booking Cards */}
      <div className="flex flex-col gap-2 mt-8 relative z-10">
        {pickupBookings.map((booking) => (
          <BookingCard
            key={`pickup-${booking.id}`}
            booking={booking as any}
            type="pickup"
            onClick={() => onBookingClick?.(booking)}
          />
        ))}
        {returnBookings.map((booking) => (
          <BookingCard
            key={`return-${booking.id}`}
            booking={booking as any}
            type="return"
            onClick={() => onBookingClick?.(booking)}
          />
        ))}
      </div>

      {/* Empty state - show "Click to book" hint */}
      {dayBookings.length === 0 && availableCount > 0 && (
        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-[11px] text-emerald-400/70">
            <span className="material-symbols-outlined text-[14px]">add_circle</span>
            <span>Click để đặt</span>
          </div>
        </div>
      )}

      {/* Booking count summary at bottom */}
      {dayBookings.length > 0 && (
        <div className="mt-auto pt-2 text-center text-[10px] text-[#5f687a] border-t border-border-dark/50">
          {dayBookings.length} booking
        </div>
      )}
    </div>
  );
}

