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
    staff_pickup?: Employee;
    staff_return?: Employee;
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
            <p className="text-red-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Chưa cọc</p>
          </span>
        );
      case 'deposited':
        return (
          <span className="flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5">
            <p className="text-yellow-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Đã cọc</p>
          </span>
        );
      case 'paid':
        return (
          <span className="flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5">
            <p className="text-emerald-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Đã xong</p>
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
          <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Hoàn thành</p>
        </span>
      );
    }
    if (isPickupCompleted) {
      return (
        <span className="flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5">
          <p className="text-blue-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Đang thuê</p>
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5">
        <p className="text-orange-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Chờ nhận</p>
      </span>
    );
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[100] transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={clsx(
          'absolute right-0 top-0 h-full w-full sm:w-[500px] bg-background shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          'sm:rounded-l-2xl'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 flex flex-col border-b border-border bg-surface px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-text-main tracking-tight text-xl sm:text-2xl font-bold leading-tight flex items-center gap-2">
                  #{booking.id.slice(0, 8).toUpperCase()}
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                    className="p-1 hover:bg-background rounded text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">open_in_new</span>
                  </button>
                </h1>
                <div className="flex gap-1.5 shadow-sm">
                  {getStatusBadge()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getActivityBadge()}
                <p className="text-text-secondary text-[10px] sm:text-xs font-medium">
                  Tạo: {booking.created_at ? format(new Date(booking.created_at), 'HH:mm, dd/MM', { locale: vi }) : 'N/A'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="size-8 sm:size-10 flex items-center justify-center rounded-xl bg-background border border-border text-text-secondary hover:text-text-main hover:bg-surface transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 gap-3 px-4 sm:px-6 py-4 bg-background/50 border-b border-border">
          <button
            onClick={() => onPickup?.(booking.id)}
            disabled={isPickupCompleted}
            className={clsx(
              'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 shadow-sm',
              isPickupCompleted
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-surface border-border text-text-main hover:border-primary hover:text-primary'
            )}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isPickupCompleted ? 'check_circle' : 'inventory_2'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
              {isPickupCompleted ? 'Đã nhận' : 'Bàn giao'}
            </span>
          </button>

          <button
            onClick={() => onReturn?.(booking.id)}
            disabled={isReturnCompleted || !isPickupCompleted}
            className={clsx(
              'flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 shadow-sm',
              isReturnCompleted
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : !isPickupCompleted
                  ? 'bg-surface border-border text-text-secondary opacity-50 cursor-not-allowed'
                  : 'bg-surface border-border text-text-main hover:border-primary hover:text-primary'
            )}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isReturnCompleted ? 'task_alt' : 'assignment_return'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
              {isReturnCompleted ? 'Đã trả' : 'Thu hồi'}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 custom-scrollbar bg-background">
          {/* Customer Section */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary"></span>
              Khách hàng
            </h3>
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="size-10 sm:size-12 rounded-full bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="text-primary group-hover:text-white font-bold text-base sm:text-xl">
                    {booking.customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-text-main font-bold sm:text-lg leading-none">{booking.customer.name}</h4>
                  <p className="text-sm text-text-secondary font-medium mt-1.5">
                    {booking.customer.phone}
                    {booking.customer.phone_2 && (
                      <span className="block mt-0.5 pt-0.5 border-t border-border/50">
                        {booking.customer.phone_2}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {booking.customer.platforms?.map((p) => (
                  <span key={p} className="size-7 sm:size-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary shadow-sm hover:text-primary hover:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                      {platformIcons[p] || 'chat'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Equipment List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary"></span>
                Thiết bị thuê
              </h3>
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {booking.booking_items?.length || 0} món
              </span>
            </div>
            <div className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/50 shadow-sm">
              {booking.booking_items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between group hover:bg-background/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-background border border-border flex items-center justify-center group-hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-text-secondary text-lg group-hover:text-primary">photo_camera</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">{item.camera.name}</p>
                      <p className="text-[10px] text-text-secondary mt-1 font-medium">
                        SL: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-text-main">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
              {booking.booking_accessories && booking.booking_accessories.length > 0 && (
                <div className="p-4 bg-background/20">
                  <p className="text-[10px] font-bold text-text-secondary uppercase mb-3 tracking-widest">Phụ kiện kèm theo:</p>
                  <div className="flex flex-wrap gap-2">
                    {booking.booking_accessories.map((acc, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-surface border border-border text-[10px] font-bold text-text-main shadow-sm flex items-center gap-2">
                        <span className="size-1 rounded-full bg-primary"></span>
                        {acc.name || acc.accessory_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary"></span>
              Lịch trình
            </h3>
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm grid grid-cols-2">
              <div className="p-4 border-r border-border hover:bg-background/20 transition-all">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Giao máy</p>
                <div className="text-lg font-bold text-text-main">{formatTime(booking.pickup_time)}</div>
                <div className="text-xs text-text-secondary font-bold mt-1">{formatDate(booking.pickup_time)}</div>
                {pickupTask?.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-bold truncate">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {pickupTask.location}
                  </div>
                )}
              </div>
              <div className="p-4 hover:bg-background/20 transition-all">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Thu hồi</p>
                <div className="text-lg font-bold text-text-main">{formatTime(booking.return_time)}</div>
                <div className="text-xs text-text-secondary font-bold mt-1">{formatDate(booking.return_time)}</div>
                {returnTask?.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-bold truncate">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {returnTask.location}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Financials */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary"></span>
              Tài chính
            </h3>
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm sm:text-base font-bold text-text-main">
                  <span>Tổng tiền thuê</span>
                  <span>{formatCurrency(booking.total_rental_fee)}</span>
                </div>
                {booking.discount_percent > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-red-500">
                    <span>Giảm giá ({booking.discount_percent}%)</span>
                    <span>-{formatCurrency(booking.total_rental_fee - booking.final_fee)}</span>
                  </div>
                )}
                {totalDeliveryFee > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-primary">
                    <span>Phí giao nhận</span>
                    <span>{formatCurrency(totalDeliveryFee)}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Tổng thanh toán</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary tracking-tighter mt-1">{formatCurrency(booking.final_fee + totalDeliveryFee)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Cọc {booking.deposit_type === 'cccd' ? 'CCCD' : ''}</p>
                  <p className="text-sm sm:text-base font-bold text-text-main">{booking.deposit_type === 'cccd' ? (booking.cccd_name || 'Đã giữ CCCD') : formatCurrency(booking.deposit_amount)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Staff responsible */}
          {(booking.staff_pickup || booking.staff_return || booking.created_by_employee) && (
            <section className="space-y-3 pb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary"></span>
                Nhân sự phụ trách
              </h3>
              <div className="bg-surface rounded-2xl border border-border divide-y divide-border/50 overflow-hidden shadow-sm">
                {booking.created_by_employee && (
                  <div className="p-3 px-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Người tạo đơn:</span>
                    <span className="text-sm font-bold text-text-main">{booking.created_by_employee.name}</span>
                  </div>
                )}
                {booking.staff_pickup && (
                  <div className="p-3 px-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Bàn giao:</span>
                    <span className="text-sm font-bold text-text-main">{booking.staff_pickup.name}</span>
                  </div>
                )}
                {booking.staff_return && (
                  <div className="p-3 px-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Thu hồi:</span>
                    <span className="text-sm font-bold text-text-main">{booking.staff_return.name}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 bg-surface/80 backdrop-blur-xl border-t border-border px-4 sm:px-6 py-4 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => onCancel?.(booking.id)}
            disabled={booking.payment_status === 'cancelled'}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl border font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95",
              booking.payment_status === 'cancelled'
                ? "bg-slate-500/10 border-slate-500/20 text-slate-400 cursor-not-allowed"
                : "border-red-500/20 text-red-500 hover:bg-red-500/5"
            )}
          >
            <span className="material-symbols-outlined text-[20px]">block</span>
            <span className="hidden xs:inline">{booking.payment_status === 'cancelled' ? 'Đã hủy' : 'Hủy đơn'}</span>
          </button>
          <button
            onClick={() => onEdit?.(booking)}
            className="flex-[2] flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl bg-primary text-white font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Chỉnh sửa Booking
          </button>
        </div>
      </div>
    </div>
  );
}



