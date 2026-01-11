'use client';

import { useState, useEffect } from 'react';
import { Camera, BlockReason } from '@/lib/types/database';
import { format } from 'date-fns';
import clsx from 'clsx';

interface BlockFormProps {
    cameras: Camera[];
    initialData?: {
        id?: string;
        camera_id: string;
        quantity: number;
        start_time: string;
        end_time: string;
        reason: BlockReason;
        note: string;
    };
    onSubmit: (data: {
        camera_id: string;
        quantity: number;
        start_time: string;
        end_time: string;
        reason: BlockReason;
        note: string;
    }) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const REASON_OPTIONS: { value: BlockReason; label: string; icon: string }[] = [
    { value: 'repair', label: 'Sửa chữa', icon: 'build' },
    { value: 'pending_delivery', label: 'Chờ hàng về', icon: 'local_shipping' },
    { value: 'maintenance', label: 'Bảo trì', icon: 'engineering' },
    { value: 'other', label: 'Khác', icon: 'more_horiz' },
];

export default function BlockForm({
    cameras,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: BlockFormProps) {
    const [cameraId, setCameraId] = useState(initialData?.camera_id || '');
    const [quantity, setQuantity] = useState(initialData?.quantity || 1);
    const [startTime, setStartTime] = useState(
        initialData?.start_time
            ? format(new Date(initialData.start_time), "yyyy-MM-dd'T'HH:mm")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm")
    );
    const [endTime, setEndTime] = useState(
        initialData?.end_time
            ? format(new Date(initialData.end_time), "yyyy-MM-dd'T'HH:mm")
            : ''
    );
    const [reason, setReason] = useState<BlockReason>(initialData?.reason || 'repair');
    const [note, setNote] = useState(initialData?.note || '');
    const [error, setError] = useState('');

    const selectedCamera = cameras.find(c => c.id === cameraId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!cameraId) {
            setError('Vui lòng chọn máy ảnh');
            return;
        }

        if (!startTime || !endTime) {
            setError('Vui lòng nhập đầy đủ thời gian');
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            setError('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }

        if (selectedCamera && quantity > selectedCamera.quantity) {
            setError(`Số lượng không thể vượt quá ${selectedCamera.quantity} máy`);
            return;
        }

        try {
            await onSubmit({
                camera_id: cameraId,
                quantity,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                reason,
                note,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Camera Select */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Máy ảnh <span className="text-red-500">*</span>
                </label>
                <select
                    value={cameraId}
                    onChange={(e) => setCameraId(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    disabled={isLoading || !!initialData?.id}
                >
                    <option value="">-- Chọn máy ảnh --</option>
                    {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                            {camera.name} ({camera.model_line}) - SL: {camera.quantity}
                        </option>
                    ))}
                </select>
            </div>

            {/* Quantity */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Số lượng block
                </label>
                <input
                    type="number"
                    min={1}
                    max={selectedCamera?.quantity || 10}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    disabled={isLoading}
                />
                {selectedCamera && (
                    <p className="text-xs text-text-secondary mt-1">
                        Tối đa: {selectedCamera.quantity} máy
                    </p>
                )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Từ <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Đến <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Reason */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Lý do <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {REASON_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setReason(option.value)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
                                reason === option.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background text-text-secondary hover:border-primary/30'
                            )}
                            disabled={isLoading}
                        >
                            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Note */}
            <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Ghi chú
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Thêm ghi chú (tùy chọn)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
                    disabled={isLoading}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-text-secondary font-medium hover:bg-surface transition-all"
                    disabled={isLoading}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            <span>{initialData?.id ? 'Cập nhật' : 'Tạo Block'}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
