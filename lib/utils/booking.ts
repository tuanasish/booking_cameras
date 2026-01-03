import { Camera, Booking, BookingItem } from '@/lib/types/database';
import { getHoursBetween, getRentalType } from './date';

/**
 * Cấu trúc giá thuê chi tiết
 */
export interface RentalPriceBreakdown {
  total: number;
  basePrice: number;  // Phần được chiết khấu (ngày nguyên)
  extraPrice: number; // Phần không được chiết khấu (giờ lẻ)
}

/**
 * Tính giá thuê máy dựa trên số giờ
 */
export function calculateRentalPrice(
  camera: Camera,
  pickupTime: Date | string,
  returnTime: Date | string,
  lateFeeDivisor: number = 5
): RentalPriceBreakdown {
  const hours = getHoursBetween(pickupTime, returnTime);

  const getBaseDailyPrice = (numDays: number) => {
    if (numDays <= 0) return 0;
    const firstDayPrice = camera.price_24h ?? (camera.price_6h * 1.5);
    const additionalDayPrice = firstDayPrice - 50000;

    if (numDays === 1) return firstDayPrice;
    return firstDayPrice + (additionalDayPrice * (numDays - 1));
  };

  const day1Price = camera.price_24h ?? (camera.price_6h * 1.5);

  // Rule 0: Minimum charge is the 6h package (Full fee is discountable)
  if (hours <= 6) {
    return {
      total: camera.price_6h,
      basePrice: camera.price_6h,
      extraPrice: 0
    };
  }

  // Rule 1: Additional hours beyond full days
  const fullDays = Math.floor(hours / 24);
  const extraHours = hours % 24;

  if (fullDays === 0) {
    // If > 6 and < 24 -> Price for 1 day (Full fee is discountable)
    return {
      total: day1Price,
      basePrice: day1Price,
      extraPrice: 0
    };
  }

  // If we have full days
  const basePrice = getBaseDailyPrice(fullDays);

  if (extraHours === 0) {
    return {
      total: basePrice,
      basePrice: basePrice,
      extraPrice: 0
    };
  }

  // If extra > 0, calculate granular price
  // base price for full days + (camera.price_6h / divisor) * extra hours
  const extraPrice = Math.round((camera.price_6h / lateFeeDivisor) * extraHours);

  return {
    total: basePrice + extraPrice,
    basePrice: basePrice,
    extraPrice: extraPrice
  };
}

/**
 * Tính phí sau chiết khấu
 * CHỈ chiết khấu trên phần base price, phần lẻ giờ (extraPrice) giữ nguyên
 */
export function calculateFinalFee(
  totalRentalFee: number,
  discountPercent: number,
  extraPriceTotal: number = 0
): number {
  const discountableAmount = totalRentalFee - extraPriceTotal;
  const discountedBase = Math.round(discountableAmount * (1 - discountPercent / 100));
  return discountedBase + extraPriceTotal;
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

/**
 * Làm tròn lên đến hàng nghìn
 */
export function roundUpToThousand(amount: number): number {
  return Math.ceil(amount / 1000) * 1000;
}
