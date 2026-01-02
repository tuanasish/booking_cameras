import { Camera, Booking, BookingItem } from '@/lib/types/database';
import { getHoursBetween, getRentalType } from './date';

/**
 * Tính giá thuê máy dựa trên số giờ
 */
export function calculateRentalPrice(
  camera: Camera,
  pickupTime: Date | string,
  returnTime: Date | string,
  lateFeeDivisor: number = 5
): number {
  const hours = getHoursBetween(pickupTime, returnTime);

  // Rule 0: Minimum charge is the 6h package
  if (hours <= 6) {
    return camera.price_6h;
  }

  // Rule 1: Additional hours beyond full days
  const fullDays = Math.floor(hours / 24);
  const extraHours = hours % 24;

  const getBaseDailyPrice = (numDays: number) => {
    if (numDays <= 0) return 0;
    const firstDayPrice = camera.price_24h ?? (camera.price_6h * 1.5);
    const additionalDayPrice = firstDayPrice - 50000;

    if (numDays === 1) return firstDayPrice;
    return firstDayPrice + (additionalDayPrice * (numDays - 1));
  };

  const day1Price = camera.price_24h ?? (camera.price_6h * 1.5);

  if (fullDays === 0) {
    // We already know hours > 6 since we passed the first check
    // If > 6 and < 24 -> Price for 1 day
    return day1Price;
  }

  // If we have full days
  if (extraHours === 0) {
    return getBaseDailyPrice(fullDays);
  }

  // New Rule: if extra > 0, calculate granular price
  // base price for full days + (day1Price / divisor) * extra hours
  const extraPrice = Math.round((day1Price / lateFeeDivisor) * extraHours);
  return getBaseDailyPrice(fullDays) + extraPrice;
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

