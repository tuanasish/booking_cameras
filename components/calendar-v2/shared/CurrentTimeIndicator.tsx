'use client';

import { useEffect, useState } from 'react';

interface CurrentTimeIndicatorProps {
    startHour?: number;
    hourHeight?: number;
}

export default function CurrentTimeIndicator({
    startHour = 0,
    hourHeight = 60,
}: CurrentTimeIndicatorProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Always show (24h grid)

    const topPosition = ((hours - startHour) * 60 + minutes) * (hourHeight / 60);

    return (
        <div
            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
            style={{ top: `${topPosition}px` }}
        >
            <div className="size-2 rounded-full bg-red-500 -ml-1 shadow-lg shadow-red-500/50" />
            <div className="h-[2px] flex-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        </div>
    );
}
