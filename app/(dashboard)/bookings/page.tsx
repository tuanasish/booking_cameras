'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';
import Link from 'next/link';

import BookingDetailDrawer from '@/components/booking/BookingDetailDrawer';
import { Camera } from '@/lib/types/database';

interface Booking {
  id: string;
  customer_id: string;
  pickup_time: string;
  return_time: string;
  payment_status: 'pending' | 'deposited' | 'paid' | 'cancelled';
  deposit_type: string;
  deposit_amount: number;
  total_rental_fee: number;
  final_fee: number;
  created_at: string;
  customer: {
    name: string;
    phone: string;
  };
  booking_items: Array<{
    id: string;
    camera: Camera;
    quantity: number;
  }>;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      if (data.data) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer?.phone.includes(searchQuery) ||
      booking.booking_items.some((item) =>
        item.camera.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Booking['payment_status']) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      deposited: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };

    const labels = {
      pending: 'Chờ thanh toán',
      deposited: 'Đã cọc',
      paid: 'Đã thanh toán',
      cancelled: 'Đã hủy',
    };

    return (
      <span
        className={clsx(
          'px-2.5 py-1 rounded-full text-[11px] font-bold border',
          styles[status]
        )}
      >
        {labels[status]}
      </span>
    );
  };

  const handleRowClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex h-full flex-col bg-[#0f172a]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-surface-dark px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Đơn thuê</h1>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {filteredBookings.length} Đơn
            </span>
          </div>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tạo Đơn Mới
        </Link>
      </header>

      {/* Filters Area */}
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row gap-4 bg-surface-dark p-4 rounded-xl border border-border-dark">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT hoặc máy ảnh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input-dark border border-border-dark rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trạng thái:</span>
            <div className="flex p-1 rounded-lg bg-input-dark border border-border-dark">
              {['all', 'pending', 'deposited', 'paid', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-[11px] font-bold transition-all capitalize',
                    statusFilter === status
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-white'
                  )}
                >
                  {status === 'all' ? 'Tất cả' : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full border border-border-dark rounded-xl bg-surface-dark overflow-hidden flex flex-col shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1e293b] border-b border-border-dark">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Thông tin đơn
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Thiết bị
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-text-secondary">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-[48px] text-text-secondary/20">
                          inbox_customize
                        </span>
                        <div className="space-y-1">
                          <p className="text-white font-bold">Không tìm thấy đơn thuê nào</p>
                          <p className="text-xs text-text-secondary">
                            Thử thay đổi bộ lọc hoặc tạo đơn mới.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => handleRowClick(booking)}
                      className="group hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {booking.customer?.name}
                          </span>
                          <span className="text-xs text-text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">phone</span>
                            {booking.customer?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {booking.booking_items.map((item) => (
                            <div
                              key={item.id}
                              className="px-2 py-0.5 rounded bg-input-dark border border-border-dark text-[10px] text-text-secondary"
                            >
                              <span className="font-bold text-white mr-1">{item.quantity}x</span>
                              {item.camera.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                              Nhận
                            </span>
                            <span className="text-xs text-white">
                              {format(new Date(booking.pickup_time), 'HH:mm dd/MM', { locale: vi })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase">
                              Trả
                            </span>
                            <span className="text-xs text-white">
                              {format(new Date(booking.return_time), 'HH:mm dd/MM', { locale: vi })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">
                          {booking.final_fee.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(booking.payment_status)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <BookingDetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          booking={selectedBooking as any}
        />
      )}
    </div>
  );
}
