'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatCurrency, shortenPhone } from '@/lib/utils/format';
import Input from '@/components/ui/Input';
import clsx from 'clsx';

interface Customer {
  id: string;
  name: string;
  phone: string;
  platforms: string[] | null;
  created_at: string;
  bookings?: Array<{
    id: string;
    pickup_time: string;
    return_time: string;
    payment_status: string;
    final_fee: number;
    booking_items: Array<{
      camera: { name: string };
      quantity: number;
    }>;
  }>;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      const data = await response.json();
      
      // Fetch bookings for each customer
      const customersWithBookings = await Promise.all(
        (data.data || []).map(async (customer: Customer) => {
          const bookingsRes = await fetch(
            `/api/bookings?customerId=${customer.id}&limit=5`
          );
          const bookingsData = await bookingsRes.json();
          return {
            ...customer,
            bookings: bookingsData.data || [],
          };
        })
      );
      
      setCustomers(customersWithBookings);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.id.toLowerCase().includes(query)
    );
  });

  const platformIcons: Record<string, string> = {
    IG: 'photo_camera',
    ZL: 'chat',
    TT: 'video_library',
    FB: 'social_leaderboard',
    VL: 'storefront',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#111318]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-[#111318] px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Quản lý khách hàng</h1>
          <p className="text-sm text-[#9da6b9] mt-1">Tìm kiếm và xem lịch sử booking của khách hàng</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[#9da6b9] text-[20px]">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên, số điện thoại hoặc Booking ID..."
                className="w-full pl-10 pr-3 py-2.5 border border-border-dark rounded-lg bg-[#111318] text-white placeholder-[#9da6b9] focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1f29] rounded-xl border border-border-dark p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#9da6b9] font-medium">Tổng khách hàng</p>
                <span className="material-symbols-outlined text-primary text-[24px]">people</span>
              </div>
              <p className="text-3xl font-bold text-white">{customers.length}</p>
            </div>
            <div className="bg-[#1a1f29] rounded-xl border border-border-dark p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#9da6b9] font-medium">Kết quả tìm kiếm</p>
                <span className="material-symbols-outlined text-blue-400 text-[24px]">filter_list</span>
              </div>
              <p className="text-3xl font-bold text-white">{filteredCustomers.length}</p>
            </div>
            <div className="bg-[#1a1f29] rounded-xl border border-border-dark p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#9da6b9] font-medium">Tổng booking</p>
                <span className="material-symbols-outlined text-emerald-400 text-[24px]">assignment</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {customers.reduce((sum, c) => sum + (c.bookings?.length || 0), 0)}
              </p>
            </div>
          </div>

          {/* Customers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#9da6b9]">
                {searchQuery ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-[#1a1f29] rounded-xl border border-border-dark p-6 hover:border-[#3b4354] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[#9da6b9]">{customer.phone}</span>
                            {customer.platforms?.map((p) => (
                              <span
                                key={p}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs"
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {platformIcons[p] || 'link'}
                                </span>
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Booking History */}
                      {customer.bookings && customer.bookings.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-border-dark">
                          <p className="text-xs text-[#9da6b9] mb-2 font-semibold uppercase tracking-wide">
                            Lịch sử booking gần đây ({customer.bookings.length})
                          </p>
                          <div className="space-y-2">
                            {customer.bookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="flex items-center justify-between p-3 bg-[#111318] rounded-lg border border-border-dark hover:border-[#3b4354] transition-colors cursor-pointer"
                                onClick={() => router.push(`/calendar?bookingId=${booking.id}`)}
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {format(new Date(booking.pickup_time), 'dd/MM/yyyy HH:mm', { locale: vi })} -{' '}
                                      {format(new Date(booking.return_time), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {booking.booking_items?.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded bg-[#1a1f29] border border-border-dark text-white text-xs"
                                        >
                                          {item.camera.name} × {item.quantity}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={clsx(
                                      'px-2 py-1 rounded text-xs font-medium',
                                      booking.payment_status === 'paid'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : booking.payment_status === 'deposited'
                                        ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    )}
                                  >
                                    {booking.payment_status === 'paid'
                                      ? 'Đã thanh toán'
                                      : booking.payment_status === 'deposited'
                                      ? 'Đã cọc'
                                      : 'Chưa cọc'}
                                  </span>
                                  <span className="text-sm font-bold text-white">
                                    {formatCurrency(booking.final_fee)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-border-dark">
                          <p className="text-sm text-[#9da6b9]">Chưa có booking nào</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-border-dark">
                        <p className="text-xs text-[#9da6b9]">
                          Tham gia từ: {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/bookings/new?customerId=${customer.id}`)}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Tạo booking mới
                      </button>
                      <button
                        onClick={() => router.push(`/calendar?customerId=${customer.id}`)}
                        className="px-4 py-2 rounded-lg border border-border-dark bg-[#111318] text-white text-sm hover:bg-[#282e39] transition-colors"
                      >
                        Xem tất cả booking
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

