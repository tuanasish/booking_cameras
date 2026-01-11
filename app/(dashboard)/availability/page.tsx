'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

interface CameraAvailability {
    camera_id: string;
    camera_name: string;
    model_line: string | null;
    total_qty: number;
    booked_qty: number;
    blocked_qty: number;
    available_qty: number;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function AvailabilityPage() {
    const [data, setData] = useState<CameraAvailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [filterModelLine, setFilterModelLine] = useState<string>('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchAvailability = useCallback(async () => {
        try {
            const response = await fetch('/api/cameras/availability');
            const result = await response.json();
            if (result.data) {
                setData(result.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchAvailability, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchAvailability]);

    // Get unique model lines
    const modelLines = Array.from(new Set(data.map(c => c.model_line))).filter((ml): ml is string => Boolean(ml));

    // Filter data
    const filteredData = filterModelLine
        ? data.filter(c => c.model_line === filterModelLine)
        : data;

    // Calculate totals
    const totals = filteredData.reduce(
        (acc, c) => ({
            total: acc.total + c.total_qty,
            booked: acc.booked + c.booked_qty,
            blocked: acc.blocked + c.blocked_qty,
            available: acc.available + c.available_qty,
        }),
        { total: 0, booked: 0, blocked: 0, available: 0 }
    );

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 shrink-0 shadow-sm">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight uppercase">
                        Máy trống tại cửa hàng
                    </h1>
                    <p className="hidden sm:block text-[11px] text-text-secondary font-medium mt-0.5">
                        Theo dõi số lượng máy khả dụng realtime
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Auto refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            autoRefresh
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                : 'bg-background border border-border text-text-secondary'
                        )}
                    >
                        <span className={clsx(
                            'material-symbols-outlined text-[16px]',
                            autoRefresh && 'animate-spin'
                        )}>
                            {autoRefresh ? 'sync' : 'sync_disabled'}
                        </span>
                        <span>{autoRefresh ? 'Auto' : 'Paused'}</span>
                    </button>

                    {/* Manual refresh */}
                    <button
                        onClick={fetchAvailability}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-all"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Refresh</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Last updated & Filter */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span>Cập nhật: {format(lastUpdated, 'HH:mm:ss dd/MM/yyyy', { locale: vi })}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm text-text-secondary">Lọc:</label>
                            <select
                                value={filterModelLine}
                                onChange={(e) => setFilterModelLine(e.target.value)}
                                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-main text-sm focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="">Tất cả</option>
                                {modelLines.map((ml) => (
                                    <option key={ml} value={ml || ''}>
                                        {ml}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-text-secondary font-medium uppercase">Tổng máy</span>
                                <span className="material-symbols-outlined text-primary text-[20px]">photo_camera</span>
                            </div>
                            <p className="text-2xl font-bold text-text-main">{totals.total}</p>
                        </div>

                        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-text-secondary font-medium uppercase">Đang thuê</span>
                                <span className="material-symbols-outlined text-blue-500 text-[20px]">assignment</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-500">{totals.booked}</p>
                        </div>

                        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-text-secondary font-medium uppercase">Đang block</span>
                                <span className="material-symbols-outlined text-orange-500 text-[20px]">block</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-500">{totals.blocked}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/80 font-medium uppercase">Còn trống</span>
                                <span className="material-symbols-outlined text-white/80 text-[20px]">check_circle</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totals.available}</p>
                        </div>
                    </div>

                    {/* Data Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Máy ảnh
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Dòng máy
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Tổng
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Đang thuê
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Đang block
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Trống
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredData.map((camera) => (
                                        <tr key={camera.camera_id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-text-main">{camera.camera_name}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                                    {camera.model_line || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-semibold text-text-main">{camera.total_qty}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx(
                                                    'text-sm font-semibold',
                                                    camera.booked_qty > 0 ? 'text-blue-500' : 'text-text-secondary'
                                                )}>
                                                    {camera.booked_qty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx(
                                                    'text-sm font-semibold',
                                                    camera.blocked_qty > 0 ? 'text-orange-500' : 'text-text-secondary'
                                                )}>
                                                    {camera.blocked_qty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx(
                                                    'text-sm font-bold',
                                                    camera.available_qty > 0 ? 'text-emerald-500' : 'text-red-500'
                                                )}>
                                                    {camera.available_qty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {camera.available_qty > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Có sẵn
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        Hết máy
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredData.length === 0 && (
                                <div className="text-center py-12 text-text-secondary">
                                    Không có dữ liệu
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
