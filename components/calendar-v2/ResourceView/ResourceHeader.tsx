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
        return 'bg-emerald-500';
    };

    const isMultiUnit = camera.quantity > 1;
    const lanes = showLanes && isMultiUnit
        ? Array.from({ length: Math.min(camera.quantity, 3) }, (_, i) => String.fromCharCode(65 + i))
        : [];

    return (
        <div
            className={clsx(
                'border-r border-border-dark flex flex-col relative group',
                isMultiUnit && showLanes ? 'w-80' : 'w-64'
            )}
        >
            {/* Main Header */}
            <div className="p-3 pb-2 bg-[#111318] z-10">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-bold">{camera.name}</span>
                    <span className="bg-surface-dark border border-border-dark text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                        {camera.quantity} máy
                    </span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={clsx('h-full transition-all', getProgressColor())}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>

            {/* Sub-lanes Header (for multi-unit cameras) */}
            {lanes.length > 0 && (
                <div className="flex flex-1 text-[10px] uppercase font-semibold text-slate-500 bg-[#151921] border-t border-border-dark/50">
                    {lanes.map((lane, i) => (
                        <div
                            key={lane}
                            className={clsx(
                                'flex-1 text-center py-1',
                                i < lanes.length - 1 && 'border-r border-dashed border-border-dark/50'
                            )}
                        >
                            Lane {lane}
                        </div>
                    ))}
                </div>
            )}

            {/* Hover Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 border border-gray-700 text-white text-xs rounded shadow-xl p-2 hidden group-hover:block z-50">
                <p className="font-semibold mb-1">Thông tin</p>
                <div className="flex justify-between text-gray-400">
                    <span>Tổng số:</span>
                    <span className="text-white">{camera.quantity} máy</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>Sử dụng:</span>
                    <span className={usagePercent >= 80 ? 'text-red-400' : 'text-green-400'}>
                        {Math.round(usagePercent)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
