'use client';

import { Camera } from '@/lib/types/database';
import clsx from 'clsx';

interface ResourceHeaderProps {
    camera: Camera;
    usagePercent: number;
    showLanes: boolean;
}

export default function ResourceHeader({
    camera,
    usagePercent,
    showLanes,
}: ResourceHeaderProps) {
    const getProgressColor = () => {
        if (usagePercent >= 80) return 'bg-red-500';
        if (usagePercent >= 50) return 'bg-amber-500';
        return 'bg-teal-500';
    };

    const isMultiUnit = camera.quantity > 1;
    const lanes = showLanes && isMultiUnit
        ? Array.from({ length: Math.min(camera.quantity, 3) }, (_, i) => String.fromCharCode(65 + i))
        : [];

    return (
        <div
            className={clsx(
                'border-r border-border flex flex-col relative group',
                isMultiUnit && showLanes ? 'w-80' : 'w-64'
            )}
        >
            {/* Main Header */}
            <div className="p-4 bg-surface z-10 transition-colors group-hover:bg-background/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-text-main text-sm font-bold tracking-tight">{camera.name}</span>
                    <span className="bg-background border border-border text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {camera.quantity} máy
                    </span>
                </div>
                <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
                    <div
                        className={clsx('h-full transition-all shadow-sm', getProgressColor())}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>

            {/* Sub-lanes Header (for multi-unit cameras) */}
            {lanes.length > 0 && (
                <div className="flex flex-1 text-[10px] uppercase font-bold tracking-widest text-text-secondary bg-surface border-t border-border">
                    {lanes.map((lane, i) => (
                        <div
                            key={lane}
                            className={clsx(
                                'flex-1 text-center py-1.5',
                                i < lanes.length - 1 && 'border-r border-dashed border-border'
                            )}
                        >
                            Lane {lane}
                        </div>
                    ))}
                </div>
            )}

            {/* Hover Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-surface border border-border text-text-main text-xs rounded-xl shadow-2xl p-3 hidden group-hover:block z-50 animate-in fade-in zoom-in duration-200">
                <p className="font-bold mb-2 uppercase tracking-wider text-[10px] text-text-secondary">Thông tin thiết bị</p>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-text-secondary font-medium">Tổng số:</span>
                    <span className="text-text-main font-bold">{camera.quantity} máy</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">Sử dụng:</span>
                    <span className={clsx('font-bold', usagePercent >= 80 ? 'text-red-500' : 'text-teal-500')}>
                        {Math.round(usagePercent)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
