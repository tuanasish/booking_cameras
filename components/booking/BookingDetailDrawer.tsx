'use client';

import { Booking, Customer, Employee } from '@/lib/types/database';
import { formatTime, formatCurrency, formatDate } from '@/lib/utils/format';
import { getPaymentStatusBgColor } from '@/lib/utils/booking';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface BookingDetailDrawerProps {
  booking: Booking & {
    customer: Customer;
    booking_items?: Array<{
      camera: { name: string; model_line: string | null };
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
    booking_accessories?: Array<{
      accessory_type: string;
      name: string | null;
      quantity: number;
    }>;
    tasks?: Array<{
      id: string;
      type: 'pickup' | 'return';
      due_at: string;
      completed_at: string | null;
      staff_id: string | null;
      location: string | null;
      delivery_fee: number;
    }>;
    created_by_employee?: Employee;
  };
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
  onCancel?: (bookingId: string) => void;
  onPickup?: (bookingId: string) => void;
  onReturn?: (bookingId: string) => void;
}

const platformIcons: Record<string, string> = {
  IG: 'photo_camera',
  ZL: 'chat',
  TT: 'video_library',
  FB: 'social_leaderboard',
  VL: 'storefront',
};

export default function BookingDetailDrawer({
  booking,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  onPickup,
  onReturn,
}: BookingDetailDrawerProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const pickupTask = booking.tasks?.find((t) => t.type === 'pickup');
  const returnTask = booking.tasks?.find((t) => t.type === 'return');
  const isPickupCompleted = pickupTask?.completed_at !== null;
  const isReturnCompleted = returnTask?.completed_at !== null;
  const totalDeliveryFee = (pickupTask?.delivery_fee || 0) + (returnTask?.delivery_fee || 0);

  const getStatusBadge = () => {
    switch (booking.payment_status) {
      case 'pending':
        return (
          <span className="flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5">
            <p className="text-red-400 text-xs font-semibold uppercase tracking-wide">Chưa cọc</p>
          </span>
        );
      case 'deposited':
        return (
          <span className="flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5">
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">Đã cọc</p>
          </span>
        );
      case 'paid':
        return (
          <span className="flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Đã thanh toán</p>
          </span>
        );
      default:
        return null;
    }
  };

  const getActivityBadge = () => {
    if (isReturnCompleted) {
      return (
        <span className="flex items-center justify-center rounded-full bg-slate-500/10 border border-slate-500/20 px-2.5 py-0.5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Hoàn thành</p>
        </span>
      );
    }
    if (isPickupCompleted) {
      return (
        <span className="flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide">Đang thuê</p>
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5">
        <p className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Chờ giao</p>
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[720px] flex flex-col bg-surface shadow-2xl border-l border-border animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 z-50 flex flex-col border-b border-border bg-surface px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-text-main tracking-tight text-[28px] font-bold leading-tight flex items-center gap-2">
                  {booking.id.slice(0, 8).toUpperCase()}
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                    className="p-1 hover:bg-background rounded text-primary transition-colors"
                    title="Xem trang chi tiết"
                  >
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>
                </h1>
                <div className="flex gap-2">
                  {getStatusBadge()}
                  {getActivityBadge()}
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                Tạo lúc: {booking.created_at ? format(new Date(booking.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi }) : 'N/A'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => router.push(`/bookings/${booking.id}/edit`)}
                className="group p-2 text-text-secondary hover:text-text-main hover:bg-background rounded-lg transition-colors"
                title="Chỉnh sửa trang"
              >
                <span className="material-symbols-outlined text-[24px]">edit</span>
              </button>
              {onCancel && booking.payment_status !== 'cancelled' && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="group p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Huỷ Booking"
                >
                  <span className="material-symbols-outlined text-[24px]">block</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="group p-2 text-text-secondary hover:text-text-main hover:bg-background rounded-lg transition-colors"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Customer Info */}
            <section className="bg-background/40 rounded-xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">person</span>
                Thông tin khách hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary mb-1">Tên khách hàng</p>
                  <p className="text-sm font-medium text-text-main">{booking.customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Số điện thoại</p>
                  <p className="text-sm font-medium text-text-main">{booking.customer.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-text-secondary mb-1">Kênh liên hệ</p>
                  <div className="flex gap-2">
                    {booking.customer.platforms?.map((platform) => (
                      <span
                        key={platform}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {platformIcons[platform] || 'link'}
                        </span>
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Equipment */}
            <section className="bg-background/40 rounded-xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">camera</span>
                Thiết bị thuê
              </h2>
              <div className="space-y-3">
                {booking.booking_items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-main">{item.camera.name}</p>
                      {item.camera.model_line && (
                        <p className="text-xs text-text-secondary">{item.camera.model_line}</p>
                      )}
                      <p className="text-xs text-text-secondary mt-1">
                        SL: {item.quantity} × {formatCurrency(item.unit_price)} ={' '}
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}

                {booking.booking_accessories && booking.booking_accessories.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-text-secondary mb-2">Phụ kiện:</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.booking_accessories.map((acc, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {acc.accessory_type === 'tripod'
                              ? 'tripod'
                              : acc.accessory_type === 'reflector'
                                ? 'light_mode'
                                : 'inventory_2'}
                          </span>
                          {acc.accessory_type === 'tripod'
                            ? 'Tripod'
                            : acc.accessory_type === 'reflector'
                              ? 'Hắt sáng'
                              : acc.name || 'Khác'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Time Schedule */}
            <section className="bg-background/40 rounded-xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
                Lịch trình
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={clsx('p-4 rounded-lg border', isPickupCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface border-border')}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-secondary">Nhận máy</p>
                    {isPickupCompleted && (
                      <span className="text-xs text-emerald-500 font-bold">✓ Đã giao</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-text-main">
                    {format(new Date(booking.pickup_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </p>
                  {pickupTask?.location && (
                    <p className="text-xs text-text-secondary mt-1">{pickupTask.location}</p>
                  )}
                </div>
                <div className={clsx('p-4 rounded-lg border', isReturnCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surface border-border')}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-secondary">Trả máy</p>
                    {isReturnCompleted && (
                      <span className="text-xs text-emerald-500 font-bold">✓ Đã trả</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-text-main">
                    {format(new Date(booking.return_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </p>
                  {returnTask?.location && (
                    <p className="text-xs text-text-secondary mt-1">{returnTask.location}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-background/40 rounded-xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Thanh toán
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">Phí thuê gốc (S):</p>
                  <p className="text-sm font-medium text-text-main">{formatCurrency(booking.total_rental_fee)}</p>
                </div>

                {booking.discount_percent > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary">
                        Chiết khấu ({booking.discount_percent}%):
                      </p>
                      <p className="text-sm font-medium text-red-500">
                        -{formatCurrency(booking.total_rental_fee - booking.final_fee)}
                      </p>
                    </div>
                    {booking.discount_reason && (
                      <p className="text-xs text-text-secondary">Lý do: {booking.discount_reason}</p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-sm text-text-secondary">Phí sau chiết khấu (P):</p>
                  <p className="text-sm font-bold text-text-main">{formatCurrency(booking.final_fee)}</p>
                </div>

                {booking.late_fee > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Phí trả trễ:</p>
                    <p className="text-sm font-medium text-red-500">{formatCurrency(booking.late_fee)}</p>
                  </div>
                )}

                {totalDeliveryFee > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Phí giao máy:</p>
                    <p className="text-sm font-medium text-text-main">
                      {formatCurrency(totalDeliveryFee)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-base font-bold text-text-main">Tổng thanh toán:</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(booking.final_fee + booking.late_fee + totalDeliveryFee)}
                  </p>
                </div>

                {/* Deposit Info */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">Cọc:</p>
                    <p className="text-sm font-medium text-text-main">
                      {booking.deposit_type === 'cccd'
                        ? 'CCCD'
                        : booking.deposit_amount > 0
                          ? formatCurrency(booking.deposit_amount)
                          : 'Chưa cọc'}
                    </p>
                  </div>
                  {booking.deposit_type === 'cccd' && booking.cccd_name && (
                    <p className="text-xs text-amber-500 font-medium">
                      Tên trên CCCD: {booking.cccd_name}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Staff Info */}
            {booking.created_by_employee && (
              <section className="bg-background/40 rounded-xl border border-border p-5">
                <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                  Nhân viên
                </h2>
                <p className="text-sm text-text-main">Lên lịch bởi: {booking.created_by_employee.name}</p>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-border bg-surface p-6 shadow-lg shadow-surface/20">
          <div className="flex gap-4">
            {!isPickupCompleted && onPickup && (
              <button
                onClick={() => onPickup(booking.id)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                Xác nhận giao máy
              </button>
            )}
            {isPickupCompleted && !isReturnCompleted && onReturn && (
              <button
                onClick={() => onReturn(booking.id)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                Xử lý trả máy
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(booking)}
                className="flex size-[48px] items-center justify-center rounded-xl border border-border bg-background text-text-secondary hover:text-text-main hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}


