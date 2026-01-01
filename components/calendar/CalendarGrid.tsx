'use client';

import { Camera, Booking } from '@/lib/types/database';
import CalendarCell from './CalendarCell';
import TimelineIndicator from './TimelineIndicator';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { isToday } from '@/lib/utils/date';
import clsx from 'clsx';
import { useMemo } from 'react';

interface CalendarGridProps {
  startDate: Date;
  endDate: Date;
  cameras: Camera[];
  bookings: Array<
    Booking & {
      customer: { name: string; phone: string; platforms: string[] | null };
      booking_items?: Array<{ camera_id: string; camera: { id: string; name: string }; quantity: number }>;
      booking_accessories?: Array<{ accessory_type: string; name: string | null }>;
      tasks?: Array<{ type: 'pickup' | 'return'; completed_at: string | null }>;
    }
  >;
  onBookingClick?: (booking: Booking) => void;
}

export default function CalendarGrid({
  startDate,
  endDate,
  cameras,
  bookings,
  onBookingClick,
}: CalendarGridProps) {
  // Generate week days
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1, locale: vi });
  const weekEnd = endOfWeek(endDate, { weekStartsOn: 1, locale: vi });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calculate availability for each camera on each day
  const getAvailability = (camera: Camera, date: Date) => {
    const dayBookings = bookings.filter((booking) => {
      if (booking.payment_status === 'cancelled') return false;

      const pickupDate = new Date(booking.pickup_time);
      const returnDate = new Date(booking.return_time);
      const cellDate = new Date(date);

      const overlaps =
        pickupDate.toDateString() === cellDate.toDateString() ||
        returnDate.toDateString() === cellDate.toDateString() ||
        (pickupDate <= cellDate && returnDate >= cellDate);

      if (!overlaps) return false;

      return booking.booking_items?.some(
        (item) => item.camera_id === camera.id || item.camera?.id === camera.id
      );
    });

    const bookedCount = dayBookings.reduce((sum, booking) => {
      const item = booking.booking_items?.find(
        (item) => item.camera_id === camera.id || item.camera?.id === camera.id
      );
      return sum + (item?.quantity || 0);
    }, 0);

    return {
      available: Math.max(0, camera.quantity - bookedCount),
      total: camera.quantity,
    };
  };

  return (
    <div className="flex-1 overflow-auto relative custom-scrollbar">
      <div className="min-w-[1200px]">
        {/* Grid Header (Days) */}
        <div className="sticky top-0 z-20 flex border-b border-border-dark bg-[#111318]">
          {/* Top-Left Corner (Sticky) */}
          <div className="sticky left-0 z-30 w-56 p-3 bg-[#111318] border-r border-border-dark flex items-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-bold text-[#9da6b9] uppercase">
              Model / Assets
            </span>
          </div>

          {/* Days Header */}
          <div className="flex flex-1 relative">
            {days.map((day, dayIndex) => {
              const isCurrentDay = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={clsx(
                    'flex-1 min-w-[150px] p-3 text-center border-r border-border-dark relative',
                    isCurrentDay ? 'bg-[#1e232e]' : 'bg-[#111318]'
                  )}
                >
                  {isCurrentDay && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                      <TimelineIndicator />
                    </>
                  )}
                  <span
                    className={clsx(
                      'block text-xs font-medium mb-1',
                      isCurrentDay ? 'font-bold text-primary' : 'text-[#9da6b9]'
                    )}
                  >
                    {format(day, 'EEE', { locale: vi })}
                  </span>
                  <span className="block text-lg font-bold text-white">
                    {format(day, 'd')}
                  </span>
                  {isCurrentDay && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold mt-1">
                      TODAY
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid Rows (Cameras) */}
        {cameras.map((camera) => {
          const usagePercent = 60; // TODO: Calculate actual usage percentage

          return (
            <div
              key={camera.id}
              className="flex border-b border-border-dark min-h-[140px]"
            >
              {/* Model Name Sticky */}
              {(() => {
                // Calculate actual usage percentage for this camera
                const weekBookingsForCamera = bookings.filter((b) =>
                  b.booking_items?.some((item) => item.camera_id === camera.id || item.camera?.id === camera.id)
                );
                const totalSlots = camera.quantity * days.length;
                const bookedSlots = weekBookingsForCamera.reduce((sum, booking) => {
                  const item = booking.booking_items?.find(
                    (i) => i.camera_id === camera.id || i.camera?.id === camera.id
                  );
                  return sum + (item?.quantity || 0);
                }, 0);
                const usagePercent = totalSlots > 0 ? Math.min(100, (bookedSlots / totalSlots) * 100) : 0;

                const getProgressColor = () => {
                  if (usagePercent >= 80) return 'bg-red-500';
                  if (usagePercent >= 50) return 'bg-yellow-500';
                  return 'bg-emerald-500';
                };

                return (
                  <div className="sticky left-0 z-10 w-56 p-4 bg-[#111318] border-r border-border-dark flex flex-col justify-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                    <h4 className="text-sm font-bold text-white mb-1">{camera.name}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#9da6b9]">
                        {camera.quantity} máy
                      </span>
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        usagePercent >= 80 ? 'bg-red-500/20 text-red-400' :
                          usagePercent >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-emerald-500/20 text-emerald-400'
                      )}>
                        {Math.round(usagePercent)}% đã đặt
                      </span>
                    </div>
                    <div className="w-full bg-[#282e39] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full transition-all', getProgressColor())}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Days Cells */}
              <div className="flex flex-1 relative">
                {days.map((day) => {
                  const isCurrentDay = isToday(day);
                  const availability = getAvailability(camera, day);
                  const dayBookings = bookings.filter((booking) => {
                    if (booking.payment_status === 'cancelled') return false;
                    const pickupDate = new Date(booking.pickup_time);
                    const returnDate = new Date(booking.return_time);
                    const cellDate = new Date(day);
                    return (
                      (pickupDate.toDateString() === cellDate.toDateString() ||
                        returnDate.toDateString() === cellDate.toDateString() ||
                        (pickupDate <= cellDate && returnDate >= cellDate)) &&
                      booking.booking_items?.some(
                        (item) => item.camera_id === camera.id || item.camera?.id === camera.id
                      )
                    );
                  });

                  return (
                    <div key={`${camera.id}-${day.toISOString()}`} className="flex-1 relative">
                      {isCurrentDay && <TimelineIndicator />}
                      <CalendarCell
                        date={day}
                        camera={camera}
                        bookings={dayBookings}
                        availableCount={availability.available}
                        totalCount={availability.total}
                        onBookingClick={onBookingClick}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

