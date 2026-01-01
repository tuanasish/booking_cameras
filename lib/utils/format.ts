/**
 * Format số tiền VNĐ
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Format số tiền đơn giản (không có ký hiệu VNĐ)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Format ngày giờ
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format ngày
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format giờ
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format số điện thoại
 */
export function formatPhone(phone: string): string {
  // Format: 0912 345 678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Rút gọn số điện thoại để hiển thị
 */
export function shortenPhone(phone: string, length: number = 4): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length > length) {
    return `${cleaned.slice(0, length)}...`;
  }
  return phone;
}


