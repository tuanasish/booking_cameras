'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatCurrency, formatMoney } from '@/lib/utils/format';
import clsx from 'clsx';

type DateRange = 'today' | 'week' | 'month' | 'custom';

interface RevenueData {
  summary: {
    total_revenue: number;
    total_bookings: number;
    avg_revenue_per_booking: number;
  };
  by_camera?: Array<{
    camera_id: string;
    camera_name: string;
    model_line: string | null;
    revenue: number;
    bookings: number;
    quantity: number;
  }>;
  by_model_line?: Array<{
    model_line: string;
    revenue: number;
    bookings: number;
    quantity: number;
  }>;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (dateRange) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = startOfDay(new Date(customStartDate));
          end = endOfDay(new Date(customEndDate));
        } else {
          start = startOfDay(now);
        }
        break;
      default:
        start = startOfDay(now);
    }

    return { start, end };
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const response = await fetch(
        `/api/analytics/revenue?startDate=${start.toISOString()}&endDate=${end.toISOString()}&groupBy=all`
      );
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    const { start, end } = getDateRange();
    const csvRows = [
      ['Báo cáo doanh thu', format(start, 'dd/MM/yyyy'), 'đến', format(end, 'dd/MM/yyyy')],
      [],
      ['Tổng doanh thu', formatMoney(data.summary.total_revenue)],
      ['Số lượt cho thuê', data.summary.total_bookings.toString()],
      ['Trung bình/booking', formatMoney(data.summary.avg_revenue_per_booking)],
      [],
      ['Doanh thu theo máy'],
      ['Máy', 'Dòng máy', 'Doanh thu', 'Số lượt', 'SL thuê'],
      ...(data.by_camera || []).map((item) => [
        item.camera_name,
        item.model_line || '',
        formatMoney(item.revenue),
        item.bookings.toString(),
        item.quantity.toString(),
      ]),
      [],
      ['Doanh thu theo dòng máy'],
      ['Dòng máy', 'Doanh thu', 'Số lượt', 'SL thuê'],
      ...(data.by_model_line || []).map((item) => [
        item.model_line,
        formatMoney(item.revenue),
        item.bookings.toString(),
        item.quantity.toString(),
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue-report-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-main">Dashboard Doanh thu</h1>
          <p className="text-sm text-text-secondary mt-1">Theo dõi dòng tiền và hiệu suất cho thuê thiết bị</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-text-main">Tổng quan hiệu quả</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-surface p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDateRange('today')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    dateRange === 'today'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 dark:text-[#9da6b9] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setDateRange('week')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    dateRange === 'week'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 dark:text-[#9da6b9] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Tuần này
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    dateRange === 'month'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 dark:text-[#9da6b9] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Tháng này
                </button>
                <button
                  onClick={() => setDateRange('custom')}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                    dateRange === 'custom'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 dark:text-[#9da6b9] hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  Tùy chỉnh
                </button>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-surface-hover rounded-xl text-sm font-semibold text-text-main transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="mb-6 flex items-center gap-3 bg-surface p-4 rounded-xl border border-border">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-1 focus:ring-primary outline-none"
              />
              <span className="text-text-secondary">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : data ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm opacity-90">Tổng doanh thu</p>
                    <span className="material-symbols-outlined text-[24px] opacity-80">payments</span>
                  </div>
                  <p className="text-3xl font-bold">{formatMoney(data.summary.total_revenue)}đ</p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-text-secondary">Số lượt cho thuê</p>
                    <span className="material-symbols-outlined text-[24px] text-primary">assignment</span>
                  </div>
                  <p className="text-3xl font-bold text-text-main">{data.summary.total_bookings}</p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-text-secondary">Trung bình/booking</p>
                    <span className="material-symbols-outlined text-[24px] text-emerald-500">trending_up</span>
                  </div>
                  <p className="text-3xl font-bold text-text-main">
                    {formatMoney(data.summary.avg_revenue_per_booking)}đ
                  </p>
                </div>

                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-text-secondary">Số máy</p>
                    <span className="material-symbols-outlined text-[24px] text-yellow-500">photo_camera</span>
                  </div>
                  <p className="text-3xl font-bold text-text-main">{data.by_camera?.length || 0}</p>
                </div>
              </div>

              {/* Revenue by Camera */}
              {data.by_camera && data.by_camera.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-text-main mb-4">Doanh thu theo máy</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                            Máy ảnh
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                            Dòng máy
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            Doanh thu
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            Số lượt
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            SL thuê
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        {data.by_camera.map((item) => (
                          <tr key={item.camera_id} className="hover:bg-background transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-text-main">{item.camera_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-text-secondary">{item.model_line || '-'}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-bold text-text-main">{formatMoney(item.revenue)}đ</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-text-main">{item.bookings}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-text-main">{item.quantity}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Revenue by Model Line */}
              {data.by_model_line && data.by_model_line.length > 0 && (
                <div className="bg-white dark:bg-[#1a1f29] rounded-xl border border-slate-200 dark:border-border-dark p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Doanh thu theo dòng máy</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">
                            Dòng máy
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            Doanh thu
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            Số lượt
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase">
                            SL thuê
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                        {data.by_model_line.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#111318] transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.model_line}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(item.revenue)}đ</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-slate-900 dark:text-white">{item.bookings}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-slate-900 dark:text-white">{item.quantity}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#9da6b9]">Không có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
