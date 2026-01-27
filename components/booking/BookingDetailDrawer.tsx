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

const platformIcons: Record<string, React.ReactNode> = {
  IG: (
    <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  ZL: (
    <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.3 2.3v19.4h19.4V2.3H2.3zm12.9 14.1l-1.6-1.6c-.1-.1-.1-.3 0-.4l2.4-2.4c.1-.1.1-.3 0-.4l-2.4-2.4c-.1-.1-.1-.3 0-.4l1.6-1.6c.1-.1.3-.1.4 0l4.2 4.2c.1.1.1.3 0 .4l-4.2 4.2c-.1.1-.3.1-.4 0zm-6.4 0L4.6 12.2c-.1-.1-.1-.3 0-.4l4.2-4.2c.1-.1.3-.1.4 0l1.6 1.6c.1.1.1.3 0 .4l-2.4 2.4c-.1.1-.1.3 0 .4l2.4 2.4c.1.1.1.3 0 .4l-1.6 1.6c-.1.1-.3.1-.4 0z" />
    </svg>
  ),
  TT: (
    <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.53 1.53-.3 2.7-1.57 2.8-3.14.07-5.9.03-11.81.04-17.71z" />
    </svg>
  ),
  FB: (
    <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
  ),
  VL: (
    <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </svg>
  ),
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
                  <span key={p} className="size-7 sm:size-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary shadow-sm hover:text-primary hover:border-primary/30 transition-all p-1.5">
                    {platformIcons[p] || (
                      <svg viewBox="0 0 24 24" className="size-full fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    )}
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
                        SL: {item.quantity} × {formatCurrency(item.unit_price || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-text-main">
                    {formatCurrency(item.subtotal || 0)}
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
                  <span>{formatCurrency(booking.total_rental_fee || 0)}</span>
                </div>
                {booking.discount_percent > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-red-500">
                    <span>Giảm giá ({booking.discount_percent}%)</span>
                    <span>-{formatCurrency((booking.total_rental_fee || 0) - (booking.final_fee || 0))}</span>
                  </div>
                )}
                {totalDeliveryFee > 0 && (
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-primary">
                    <span>Phí giao nhận</span>
                    <span>{formatCurrency(totalDeliveryFee || 0)}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Tổng thanh toán</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary tracking-tighter mt-1">{formatCurrency((booking.final_fee || 0) + (totalDeliveryFee || 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Cọc {booking.deposit_type === 'cccd' ? 'CCCD' : ''}</p>
                  <p className="text-sm sm:text-base font-bold text-text-main">{booking.deposit_type === 'cccd' ? (booking.cccd_name || 'Đã giữ CCCD') : formatCurrency(booking.deposit_amount || 0)}</p>
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

          {/* Notes Section */}
          {booking.notes && (
            <section className="space-y-3 pb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-400"></span>
                Ghi chú
              </h3>
              <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-text-main whitespace-pre-wrap">{booking.notes}</p>
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



