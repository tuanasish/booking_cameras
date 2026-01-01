import { Camera, Booking, BookingItem } from '@/lib/types/database';
import { getHoursBetween, getRentalType } from './date';

/**
 * Tính giá thuê máy dựa trên số giờ
 */
export function calculateRentalPrice(
  camera: Camera,
  pickupTime: Date | string,
  returnTime: Date | string
): number {
  const hours = getHoursBetween(pickupTime, returnTime);
  const type = getRentalType(hours);

  // Nếu thuê <= 6 giờ: dùng giá 6h
  if (type === '6h') {
    return camera.price_6h;
  }

  // Thuê theo ngày: sử dụng price_24h cho ngày đầu
  // và price_additional_day cho các ngày tiếp theo
  const days = Math.max(1, Math.ceil(hours / 24));
  const firstDayPrice = camera.price_24h ?? camera.price_6h;
  const additionalDayPrice =
    // @ts-ignore - field được khai báo trong Database types
    (camera as any).price_additional_day ?? firstDayPrice;

  if (days === 1) {
    return firstDayPrice;
  }

  return firstDayPrice + additionalDayPrice * (days - 1);
}

/**
 * Tính phí sau chiết khấu
 */
export function calculateFinalFee(
  totalFee: number,
  discountPercent: number
): number {
  return Math.round(totalFee * (1 - discountPercent / 100));
}

/**
 * Tính phí trả trễ
 */
export function calculateLateFee(price6h: number, divisor: number = 5): number {
  return Math.round(price6h / divisor);
}

/**
 * Tính tổng phí booking
 */
export function calculateTotalFee(
  bookingItems: BookingItem[],
  discountPercent: number = 0,
  lateFee: number = 0,
  deliveryFee: number = 0
): number {
  const subtotal = bookingItems.reduce((sum, item) => sum + item.subtotal, 0);
  const afterDiscount = calculateFinalFee(subtotal, discountPercent);
  return afterDiscount + lateFee + deliveryFee;
}

/**
 * Lấy màu sắc theo payment status
 */
export function getPaymentStatusColor(
  status: 'pending' | 'deposited' | 'paid' | 'cancelled'
): string {
  switch (status) {
    case 'pending':
      return 'bg-red-500';
    case 'deposited':
      return 'bg-yellow-500';
    case 'paid':
      return 'bg-emerald-500';
    case 'cancelled':
      return 'bg-slate-500';
    default:
      return 'bg-slate-500';
  }
}

/**
 * Lấy màu nền cho booking card theo payment status
 */
export function getPaymentStatusBgColor(
  status: 'pending' | 'deposited' | 'paid' | 'cancelled'
): string {
  switch (status) {
    case 'pending':
      return 'bg-[#2e1515] border-red-500';
    case 'deposited':
      return 'bg-[#2a2415] border-yellow-500';
    case 'paid':
      return 'bg-[#0f2e1b] border-emerald-500';
    case 'cancelled':
      return 'bg-slate-800 border-slate-500';
    default:
      return 'bg-slate-800 border-slate-500';
  }
}

