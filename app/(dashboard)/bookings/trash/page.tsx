'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';

interface Booking {
    id: string;
    pickup_time: string;
    return_time: string;
    payment_status: 'cancelled';
    final_fee: number;
    customer: {
        name: string;
        phone: string;
    };
    booking_items: Array<{
        id: string;
        camera: { name: string };
        quantity: number;
    }>;
}

export default function TrashPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const fetchCancelledBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bookings?statusFilter=cancelled');
            const data = await response.json();
            if (data.data) {
                // Double check status client side as API might not support statusFilter parameter yet
                const cancelled = data.data.filter((b: any) => b.payment_status === 'cancelled');
                setBookings(cancelled);
            }
        } catch (error) {
            console.error('Error fetching trash bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCancelledBookings();
    }, []);

    const handleRestore = async (id: string) => {
        setRestoringId(id);
        try {
            const response = await fetch(`/api/bookings/${id}/restore`, {
                method: 'POST',
            });

            const result = await response.json();

            if (response.ok) {
                alert('Khôi phục đơn hàng thành công!');
                fetchCancelledBookings();
            } else {
                alert(`Không thể khôi phục: ${result.error}`);
            }
        } catch (error) {
            console.error('Error restoring booking:', error);
            alert('Đã có lỗi xảy ra khi khôi phục');
        } finally {
            setRestoringId(null);
        }
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <header className="flex h-16 items-center border-b border-border bg-surface px-6 shrink-0">
                <Link
                    href="/bookings"
                    className="mr-4 p-2 hover:bg-surface-hover rounded text-text-secondary hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500">delete</span>
                        Thùng rác
                    </h1>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {bookings.length} Đơn đã hủy
                    </span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-text-secondary">Đang tải danh sách đã hủy...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-dashed border-border gap-4">
                            <span className="material-symbols-outlined text-[64px] text-text-secondary/20">auto_delete</span>
                            <div className="text-center space-y-1">
                                <p className="text-text-main font-bold">Thùng rác trống</p>
                                <p className="text-sm text-text-secondary">Các đơn hàng bạn hủy sẽ được lưu giữ ở đây.</p>
                            </div>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm hover:border-primary/30 transition-all flex flex-col md:flex-row"
                            >
                                <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Customer & Fee */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-text-main">{booking.customer.name}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">phone</span>
                                            {booking.customer.phone}
                                        </div>
                                        <div className="text-sm font-bold text-primary">
                                            {booking.final_fee.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="flex flex-wrap gap-2 content-start">
                                        {booking.booking_items.map((item, idx) => (
                                            <div key={idx} className="px-2 py-1 rounded-lg bg-background border border-border text-[11px] text-text-secondary flex items-center gap-1">
                                                <span className="font-bold text-text-main">{item.quantity}x</span>
                                                {item.camera.name}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Date Time */}
                                    <div className="flex flex-col justify-center gap-1.5 md:border-l md:border-border md:pl-6 text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 text-emerald-500 font-bold uppercase">Nhận:</span>
                                            <span className="text-text-main font-medium">
                                                {format(new Date(booking.pickup_time), 'HH:mm - EEEE, dd/MM', { locale: vi })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 text-rose-500 font-bold uppercase">Trả:</span>
                                            <span className="text-text-main font-medium">
                                                {format(new Date(booking.return_time), 'HH:mm - EEEE, dd/MM', { locale: vi })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-background/50 border-t md:border-t-0 md:border-l border-border p-4 flex items-center justify-center shrink-0">
                                    <button
                                        onClick={() => handleRestore(booking.id)}
                                        disabled={restoringId === booking.id}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all",
                                            restoringId === booking.id
                                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 active:scale-95"
                                        )}
                                    >
                                        {restoringId === booking.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                <span>Đang xử lý...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[20px]">history</span>
                                                <span>Khôi phục</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
