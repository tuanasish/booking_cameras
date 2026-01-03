import { addDays, startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Lấy tuần hiện tại (thứ 2 đến chủ nhật)
 */
export function getCurrentWeek(): Date[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1, locale: vi });
  const end = endOfWeek(today, { weekStartsOn: 1, locale: vi });
  return eachDayOfInterval({ start, end });
}

/**
 * Lấy tuần của một ngày cụ thể
 */
export function getWeekOfDate(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1, locale: vi });
  const end = endOfWeek(date, { weekStartsOn: 1, locale: vi });
  return eachDayOfInterval({ start, end });
}

/**
 * Kiểm tra xem ngày có phải hôm nay không
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Kiểm tra xem ngày có phải quá khứ không
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Kiểm tra xem ngày có phải tương lai không
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Tính số giờ giữa 2 thời điểm
 */
export function getHoursBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Xác định loại giá thuê dựa trên số giờ
 * Chỉ còn 2 mức giá: 6h và theo ngày (>= 24h)
 */
export function getRentalType(hours: number): '6h' | '24h' {
  if (hours <= 6) return '6h';
  return '24h';
}
/**
 * Parse chuỗi nhập nhanh thành đối tượng Date
 * Hỗ trợ: "03 01 2026 20 30", "030120262030", "03/01/2026 20:30"
 */
export function parseQuickDateTime(input: string): Date | null {
  // Loại bỏ tất cả ký tự không phải số
  const digits = input.replace(/\D/g, '');

  // Mong đợi ít nhất 8 chữ số (ddMMyyyy)
  if (digits.length < 8) return null;

  const day = parseInt(digits.slice(0, 2));
  const month = parseInt(digits.slice(2, 4)) - 1; // Month is 0-indexed
  const year = parseInt(digits.slice(4, 8));

  // Mặc định giờ/phút nếu không nhập
  let hour = 0;
  let minute = 0;

  if (digits.length >= 10) {
    hour = parseInt(digits.slice(8, 10));
  }

  if (digits.length >= 12) {
    minute = parseInt(digits.slice(10, 12));
  }

  const date = new Date(year, month, day, hour, minute);

  // Kiểm tra tính hợp lệ của ngày
  if (isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day) {
    return null;
  }

  return date;
}
