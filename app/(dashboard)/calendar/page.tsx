'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KantraCalendar from '@/components/calendar-v2/KantraCalendar';
import BookingDetailDrawer from '@/components/booking/BookingDetailDrawer';
import { Camera, Booking } from '@/lib/types/database';
import { format } from 'date-fns';
import Image from 'next/image';
import { useTheme } from '@/lib/context/ThemeContext';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh when coming back from creating booking
  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      fetchData();
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch cameras
      const camerasRes = await fetch('/api/cameras');
      const camerasData = await camerasRes.json();
      setCameras(camerasData.data || []);

      // Fetch bookings for a wider range (current month ± 2 weeks)
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 14);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);

      const bookingsRes = await fetch(
        `/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDrawer = () => {
    setSelectedBooking(null);
  };

  const handleEdit = (booking: Booking) => {
    router.push(`/bookings/${booking.id}/edit`);
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy booking này?')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'cancelled' }),
      });
      if (response.ok) {
        alert('Đã hủy booking');
        fetchData();
        setSelectedBooking(null);
      } else {
        const err = await response.json();
        alert(`Lỗi: ${err.error}`);
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Đã có lỗi xảy ra');
    }
  };

  const handlePickup = (bookingId: string) => {
    router.push(`/tasks/pickup?bookingId=${bookingId}`);
  };

  const handleReturn = (bookingId: string) => {
    router.push(`/tasks/return?bookingId=${bookingId}`);
  };

  const handleCreateBooking = (cameraId: string, date: Date, hour?: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let url = `/bookings/new?cameraId=${cameraId}&date=${dateStr}`;
    if (hour !== undefined) {
      url += `&hour=${hour.toString().padStart(2, '0')}`;
    }
    router.push(url);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
          <h1 className="text-xl font-bold text-text-main">Lịch Booking</h1>
        </header>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background font-sans">
      {/* Header */}
      <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 shrink-0 shadow-sm z-30">
        <h1 className="text-xl font-bold text-text-main">Lịch Booking</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/bookings/new')}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
            <span className="hidden xs:inline">Tạo Booking</span>
          </button>
          <button className="hidden sm:flex size-9 items-center justify-center rounded-lg bg-background border border-border text-text-secondary hover:bg-surface hover:text-text-main transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-background border border-border text-text-secondary hover:bg-surface hover:text-text-main transition-colors relative">
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 size-1.5 sm:size-2 bg-red-500 rounded-full border-2 border-surface"></span>
          </button>
        </div>
      </header>

      {/* Kantra Calendar */}
      <KantraCalendar
        cameras={cameras}
        bookings={bookings}
        onBookingClick={handleBookingClick}
        onCreateBooking={handleCreateBooking}
      />

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={handleCloseDrawer}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onPickup={handlePickup}
          onReturn={handleReturn}
        />
      )}
    </div>
  );
}
