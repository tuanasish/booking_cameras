'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Camera, CameraBlock, BlockReason } from '@/lib/types/database';
import BlockForm from '@/components/camera-blocks/BlockForm';
import clsx from 'clsx';

const REASON_LABELS: Record<BlockReason, string> = {
    repair: 'Sửa chữa',
    pending_delivery: 'Chờ hàng',
    maintenance: 'Bảo trì',
    other: 'Khác',
};

const REASON_COLORS: Record<BlockReason, string> = {
    repair: 'bg-red-500/10 text-red-500 border-red-500/20',
    pending_delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    maintenance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface BlockWithRelations extends CameraBlock {
    camera?: { id: string; name: string; model_line: string | null };
    creator?: { id: string; name: string };
}

export default function BlocksPage() {
    const [blocks, setBlocks] = useState<BlockWithRelations[]>([]);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBlock, setEditingBlock] = useState<BlockWithRelations | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'past'>('active');

    const fetchBlocks = useCallback(async () => {
        try {
            const response = await fetch('/api/camera-blocks');
            const result = await response.json();
            if (result.data) {
                setBlocks(result.data);
            }
        } catch (error) {
            console.error('Error fetching blocks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCameras = useCallback(async () => {
        try {
            const response = await fetch('/api/cameras');
            const result = await response.json();
            if (result.data) {
                setCameras(result.data);
            }
        } catch (error) {
            console.error('Error fetching cameras:', error);
        }
    }, []);

    useEffect(() => {
        fetchBlocks();
        fetchCameras();
    }, [fetchBlocks, fetchCameras]);

    const handleCreate = async (data: {
        camera_id: string;
        quantity: number;
        start_time: string;
        end_time: string;
        reason: BlockReason;
        note: string;
    }) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/camera-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create block');
            }

            setShowForm(false);
            fetchBlocks();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (data: {
        camera_id: string;
        quantity: number;
        start_time: string;
        end_time: string;
        reason: BlockReason;
        note: string;
    }) => {
        if (!editingBlock) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/camera-blocks/${editingBlock.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update block');
            }

            setEditingBlock(null);
            fetchBlocks();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (blockId: string) => {
        if (!confirm('Bạn có chắc muốn xóa block này?')) return;

        try {
            const response = await fetch(`/api/camera-blocks/${blockId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete block');
            }

            fetchBlocks();
        } catch (error) {
            console.error('Error deleting block:', error);
            alert('Không thể xóa block');
        }
    };

    // Filter blocks
    const now = new Date();
    const filteredBlocks = blocks.filter(block => {
        const endTime = new Date(block.end_time);
        if (filterStatus === 'active') {
            return endTime > now;
        } else if (filterStatus === 'past') {
            return endTime <= now;
        }
        return true;
    });

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 shrink-0 shadow-sm">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight uppercase">
                        Quản lý Block Lịch
                    </h1>
                    <p className="hidden sm:block text-[11px] text-text-secondary font-medium mt-0.5">
                        Block máy khi sửa chữa, chờ hàng, bảo trì
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Tạo Block</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-6">
                    {/* Filter */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex bg-surface p-1 rounded-xl border border-border">
                            {(['active', 'past', 'all'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                                        filterStatus === status
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-text-secondary hover:text-text-main'
                                    )}
                                >
                                    {status === 'active' ? 'Đang block' : status === 'past' ? 'Đã hết' : 'Tất cả'}
                                </button>
                            ))}
                        </div>
                        <span className="text-sm text-text-secondary ml-auto">
                            {filteredBlocks.length} block
                        </span>
                    </div>

                    {/* Blocks List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredBlocks.length === 0 ? (
                        <div className="text-center py-12 bg-surface rounded-xl border border-border">
                            <span className="material-symbols-outlined text-[48px] text-text-secondary">block</span>
                            <p className="text-text-secondary mt-2">Chưa có block nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBlocks.map((block) => {
                                const isActive = new Date(block.end_time) > now;
                                return (
                                    <div
                                        key={block.id}
                                        className={clsx(
                                            'bg-surface rounded-xl border p-4 transition-all',
                                            isActive ? 'border-border' : 'border-border/50 opacity-60'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-base font-semibold text-text-main">
                                                        {block.camera?.name || 'Unknown'}
                                                    </span>
                                                    {block.camera?.model_line && (
                                                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                                            {block.camera.model_line}
                                                        </span>
                                                    )}
                                                    <span className={clsx(
                                                        'text-xs px-2 py-0.5 rounded-md border font-medium',
                                                        REASON_COLORS[block.reason]
                                                    )}>
                                                        {REASON_LABELS[block.reason]}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                        {format(new Date(block.start_time), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                        <span className="mx-1">→</span>
                                                        {format(new Date(block.end_time), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                                        {block.quantity} máy
                                                    </span>
                                                </div>

                                                {block.note && (
                                                    <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                                                        {block.note}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingBlock(block)}
                                                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Sửa"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(block.id)}
                                                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Xóa"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showForm || editingBlock) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                            setShowForm(false);
                            setEditingBlock(null);
                        }}
                    />
                    <div className="relative bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-text-main">
                                {editingBlock ? 'Sửa Block' : 'Tạo Block Mới'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingBlock(null);
                                }}
                                className="p-2 text-text-secondary hover:text-text-main rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <BlockForm
                                cameras={cameras}
                                initialData={editingBlock ? {
                                    id: editingBlock.id,
                                    camera_id: editingBlock.camera_id,
                                    quantity: editingBlock.quantity,
                                    start_time: editingBlock.start_time,
                                    end_time: editingBlock.end_time,
                                    reason: editingBlock.reason,
                                    note: editingBlock.note || '',
                                } : undefined}
                                onSubmit={editingBlock ? handleUpdate : handleCreate}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingBlock(null);
                                }}
                                isLoading={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
