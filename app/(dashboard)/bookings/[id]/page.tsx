'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Booking, Customer, Employee } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/format';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface BookingWithDetails extends Booking {
  customer: Customer;
  booking_items: Array<{
    camera: { name: string; model_line: string | null };
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  booking_accessories: Array<{
    accessory_type: string;
    name: string | null;
    quantity: number;
  }>;
  tasks: Array<{
    id: string;
    type: 'pickup' | 'return';
    due_at: string;
    completed_at: string | null;
    location: string | null;
    delivery_fee: number;
  }>;
  created_by_employee?: Employee;
}

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${params.id}`);
      const data = await response.json();
      if (data.data) {
        setBooking(data.data);
      } else {
        alert('Không tìm thấy booking');
        router.push('/calendar');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Lỗi khi tải thông tin booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'cancelled' }),
      });

      if (response.ok) {
        alert('Đã hủy đơn hàng');
        fetchBooking();
      } else {
        const err = await response.json();
        alert(`Lỗi: ${err.error}`);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Đã có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background text-text-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) return null;

  const pickupTask = booking.tasks?.find((t) => t.type === 'pickup');
  const returnTask = booking.tasks?.find((t) => t.type === 'return');
  const isPickupCompleted = pickupTask?.completed_at !== null;
  const isReturnCompleted = returnTask?.completed_at !== null;
  const totalDeliveryFee = (pickupTask?.delivery_fee || 0) + (returnTask?.delivery_fee || 0);

  const getStatusBadge = () => {
    switch (booking.payment_status) {
      case 'cancelled':
        return (
          <span className="flex items-center justify-center rounded-full bg-slate-500/10 border border-slate-500/20 px-3 py-1">
            <p className="text-slate-400 text-xs font-bold uppercase">Đã hủy</p>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1">
            <p className="text-red-400 text-xs font-bold uppercase">Chưa cọc</p>
          </span>
        );
      case 'deposited':
        return (
          <span className="flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1">
            <p className="text-yellow-400 text-xs font-bold uppercase">Đã cọc</p>
          </span>
        );
      case 'paid':
        return (
          <span className="flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
            <p className="text-emerald-400 text-xs font-bold uppercase">Đã thanh toán</p>
          </span>
        );
      default:
        return null;
    }
  };

  const getActivityBadge = () => {
    if (booking.payment_status === 'cancelled') return null;
    if (isReturnCompleted) {
      return (
        <span className="flex items-center justify-center rounded-full bg-slate-500/10 border border-slate-500/20 px-3 py-1">
          <p className="text-slate-400 text-xs font-bold uppercase">Hoàn thành</p>
        </span>
      );
    }
    if (isPickupCompleted) {
      return (
        <span className="flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1">
          <p className="text-blue-400 text-xs font-bold uppercase">Đang thuê</p>
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1">
        <p className="text-orange-400 text-xs font-bold uppercase">Chờ nhận</p>
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/calendar')}
            className="mr-2 p-2 hover:bg-surface-hover rounded text-text-secondary hover:text-text-main transition-colors"
            title="Về lịch chính"
          >
            <span className="material-symbols-outlined">calendar_today</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-main uppercase">
              Booking {booking.id.slice(0, 8)}
            </h1>
            <div className="flex gap-2">
              {getStatusBadge()}
              {getActivityBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {booking.payment_status !== 'cancelled' && (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">block</span>
                <span>Hủy đơn</span>
              </button>
              <button
                onClick={() => router.push(`/bookings/${booking.id}/edit`)}
                className="flex items-center gap-2 rounded-lg bg-surface border border-border px-4 py-2 text-sm font-bold text-text-main shadow-sm hover:bg-surface-hover transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                <span>Chỉnh sửa</span>
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/calendar')}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
            <span>Xong & Về lịch</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Thông tin khách hàng
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Tên khách hàng</label>
                  <p className="text-text-main font-medium text-lg">{booking.customer.name}</p>
                </div>
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Số điện thoại</label>
                  <p className="text-text-main font-medium text-lg">{booking.customer.phone}</p>
                  {booking.customer.phone_2 && (
                    <p className="text-text-main font-medium text-lg border-t border-border mt-1 pt-1">
                      {booking.customer.phone_2}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2 block">Kênh liên hệ</label>
                  <div className="flex flex-wrap gap-2">
                    {booking.customer.platforms?.map((platform) => (
                      <span
                        key={platform}
                        className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Equipment Info */}
            <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">camera</span>
                Thiết bị thuê
              </h2>
              <div className="space-y-4">
                {booking.booking_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                    <div>
                      <p className="text-text-main font-medium">{item.camera.name}</p>
                      <p className="text-xs text-text-secondary">Số lượng: {item.quantity}</p>
                    </div>
                    <p className="text-text-main font-bold">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}

                {booking.booking_accessories && booking.booking_accessories.length > 0 && (
                  <div className="pt-2">
                    <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-2 block">Phụ kiện kèm theo</label>
                    <div className="flex flex-wrap gap-2">
                      {booking.booking_accessories.map((acc, index) => (
                        <span key={index} className="px-2 py-1 rounded bg-background border border-border text-text-main text-xs">
                          {acc.accessory_type === 'tripod' ? 'Tripod' : acc.accessory_type === 'reflector' ? 'Hắt sáng' : acc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule */}
            <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Lịch trình
              </h2>
              <div className="space-y-4">
                <div className={clsx('p-4 rounded-lg border', isPickupCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background border-border')}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-text-secondary">Nhận máy</span>
                    {isPickupCompleted && <span className="text-xs font-bold text-emerald-500">ĐÃ NHẬN</span>}
                  </div>
                  <p className="text-text-main font-bold text-lg">
                    {format(new Date(booking.pickup_time), 'HH:mm, dd MMMM yyyy', { locale: vi })}
                  </p>
                  {pickupTask?.location && <p className="text-sm text-text-secondary mt-1">{pickupTask.location}</p>}
                </div>

                <div className={clsx('p-4 rounded-lg border', isReturnCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background border-border')}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-text-secondary">Trả máy</span>
                    {isReturnCompleted && <span className="text-xs font-bold text-emerald-500">ĐÃ THU</span>}
                  </div>
                  <p className="text-text-main font-bold text-lg">
                    {format(new Date(booking.return_time), 'HH:mm, dd MMMM yyyy', { locale: vi })}
                  </p>
                  {returnTask?.location && <p className="text-sm text-text-secondary mt-1">{returnTask.location}</p>}
                </div>
              </div>
            </section>

            {/* Payment Summary */}
            <section className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Thanh toán
              </h2>
              <div className="space-y-3 flex-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Phí thuê gốc:</span>
                  <span className="text-text-main">{formatCurrency(booking.total_rental_fee)}</span>
                </div>
                {booking.discount_percent > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Chiết khấu ({booking.discount_percent}%):</span>
                    <span>-{formatCurrency(booking.total_rental_fee - booking.final_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-text-main pt-2 border-t border-border">
                  <span>Thành tiền:</span>
                  <span>{formatCurrency(booking.final_fee)}</span>
                </div>
                {totalDeliveryFee > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Phí giao:</span>
                    <span className="text-text-main">{formatCurrency(totalDeliveryFee)}</span>
                  </div>
                )}
                {booking.late_fee > 0 && (
                  <div className="flex justify-between text-red-400 font-bold">
                    <span>Phí trễ:</span>
                    <span>{formatCurrency(booking.late_fee)}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-primary/20 bg-primary/5 -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <span className="text-text-main font-bold">TỔNG CỘNG:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(booking.final_fee + totalDeliveryFee + booking.late_fee)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border text-sm">
                  <span className="text-text-secondary">ĐÃ CỌC:</span>
                  <span className="text-yellow-500 font-bold">
                    {booking.deposit_type === 'cccd' ? 'CCCD' : formatCurrency(booking.deposit_amount)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
