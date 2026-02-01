'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface ParsedBooking {
    cameraName: string | null;
    customerPhone: string | null;
    pickupDate: string | null;
    pickupHour: number | null;
    pickupMinute: number | null;
    returnDate: string | null;
    returnHour: number | null;
    returnMinute: number | null;
    totalFee: number | null;
    depositAmount: number | null;
}

interface ChatbotResult {
    data: ParsedBooking;
    available?: boolean;
    camera?: any;
    booking?: any;
    success?: boolean;
    error?: string;
    isFastPath?: boolean;
}

export default function ChatbotWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ChatbotResult | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                const button = document.getElementById('chatbot-toggle-btn');
                if (button && !button.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleProcess = async () => {
        if (!message.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/chatbot/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, action: 'auto_create' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setResult({ data: {}, error: data.error || 'Lỗi khi xử lý' } as ChatbotResult);
                return;
            }

            setResult(data);
        } catch (err) {
            setResult({ data: {}, error: err instanceof Error ? err.message : 'Đã xảy ra lỗi' } as ChatbotResult);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBooking = () => {
        if (result?.booking?.id) {
            router.push(`/bookings/${result.booking.id}`);
            setIsOpen(false);
            setMessage('');
            setResult(null);
        }
    };

    const handleReset = () => {
        setMessage('');
        setResult(null);
    };

    const handleUseTemplate = () => {
        setMessage(
            `- Tên khách hàng: \n` +
            `- Số điện thoại: \n` +
            `- Nền tảng: \n\n` +
            `- Thiết bị: \n` +
            `- Thời gian nhận máy: \n` +
            `- Thời gian trả máy: \n\n` +
            `- Tổng phí thuê: \n` +
            `- Đã đặt cọc: `
        );
    };

    const formatTime = (hour: number | null | undefined, minute: number | null | undefined) => {
        if (hour === null || hour === undefined) return '--:--';
        return `${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '--/--/----';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '--/--/----';
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch {
            return '--/--/----';
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                id="chatbot-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95',
                    isOpen
                        ? 'bg-rose-500 hover:bg-rose-600 rotate-0'
                        : 'bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-primary'
                )}
            >
                <span className="material-symbols-outlined text-white text-[28px]">
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="fixed bottom-24 right-6 z-50 w-[500px] max-h-[92vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-blue-500/10">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-main">Kantra AI Assistant</h3>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Input Area */}
                        {!result?.success && (
                            <div className="space-y-3">
                                <div className="flex justify-end items-center">
                                    <button
                                        onClick={handleUseTemplate}
                                        className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">content_paste</span>
                                        Dùng mẫu
                                    </button>
                                </div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Dán nội dung tin nhắn..."
                                    rows={15}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text-main placeholder:text-text-secondary/30 focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                                />
                                <button
                                    onClick={handleProcess}
                                    disabled={loading || !message.trim()}
                                    className={clsx(
                                        'w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2',
                                        loading || !message.trim()
                                            ? 'bg-surface-hover text-text-secondary cursor-not-allowed'
                                            : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:from-blue-600 hover:to-primary active:scale-[0.98] shadow-lg'
                                    )}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">bolt</span>
                                            <span>Tạo Booking</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Error */}
                        {result?.error && !result?.success && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                                    <span className="text-sm font-bold text-red-500">Lỗi xử lý</span>
                                </div>
                                <p className="text-xs text-red-400">{result.error}</p>

                                {/* Show parsed data even on error */}
                                {result.data && (
                                    <div className="mt-3 pt-3 border-t border-red-500/20">
                                        <div className="bg-red-500/5 rounded p-2 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">Máy:</span>
                                                <span className="text-text-main">{result.data.cameraName || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-text-secondary">Thời gian:</span>
                                                <span className="text-text-main">
                                                    {formatTime(result.data.pickupHour, result.data.pickupMinute)} - {formatTime(result.data.returnHour, result.data.returnMinute)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleReset}
                                    className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all"
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* Success */}
                        {result?.success && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-500 text-[28px]">check_circle</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-bold text-emerald-500">Thành công!</h4>
                                                {result.isFastPath && (
                                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">bolt</span>
                                                        TỨC THÌ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface rounded-lg border border-border p-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-text-secondary">Máy ảnh:</span>
                                            <span className="text-text-main font-bold">{result.camera?.name || result.data?.cameraName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-text-secondary">SĐT:</span>
                                            <span className="text-text-main font-medium">{result.data?.customerPhone || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-text-secondary">Nhận máy:</span>
                                            <span className="text-text-main font-medium">
                                                {formatTime(result.data?.pickupHour ?? null, result.data?.pickupMinute ?? null)}, {formatDate(result.data?.pickupDate ?? null)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-text-secondary">Trả máy:</span>
                                            <span className="text-text-main font-medium">
                                                {formatTime(result.data?.returnHour ?? null, result.data?.returnMinute ?? null)}, {formatDate(result.data?.returnDate ?? null)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                                            <span className="text-text-secondary">Phí thu:</span>
                                            <span className="text-primary font-bold">
                                                {result.data?.totalFee ? `${result.data.totalFee.toLocaleString('vi-VN')}đ` : '—'}
                                            </span>
                                        </div>
                                        {(result.data?.depositAmount ?? 0) > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-text-secondary">Đã cọc:</span>
                                                <span className="text-emerald-500 font-medium">
                                                    {result.data?.depositAmount?.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="py-2.5 rounded-lg border border-border bg-surface text-text-secondary text-sm font-medium hover:bg-surface-hover transition-all"
                                    >
                                        Tạo thêm
                                    </button>
                                    <button
                                        onClick={handleViewBooking}
                                        className="py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        Xem booking
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
