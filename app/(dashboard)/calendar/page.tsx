'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KantraCalendar from '@/components/calendar-v2/KantraCalendar';
import BookingDetailDrawer from '@/components/booking/BookingDetailDrawer';
import { Camera, Booking } from '@/lib/types/database';
import { format } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

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
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData();
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
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
        <header className="flex h-16 items-center justify-between border-b border-border-dark bg-[#111318] px-6">
          <h1 className="text-xl font-bold text-white">Lịch Booking</h1>
        </header>
        <div className="flex-1 flex items-center justify-center bg-[#111318]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-[#111318] px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-8 flex items-center justify-center bg-primary rounded text-white">
            <span className="material-symbols-outlined text-xl">photo_camera</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Kantra Admin</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/bookings/new')}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Tạo Booking</span>
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg bg-surface-dark border border-border-dark text-white hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg bg-surface-dark border border-border-dark text-white hover:bg-border-dark transition-colors relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
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
