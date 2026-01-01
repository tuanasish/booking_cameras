'use client';

interface TimeColumnProps {
    startHour?: number;
    endHour?: number;
    hourHeight?: number;
}

export default function TimeColumn({
    startHour = 0,
    endHour = 24,
    hourHeight = 60,
}: TimeColumnProps) {
    const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

    return (
        <div
            className="w-16 shrink-0 bg-[#111318] border-r border-border-dark flex flex-col overflow-hidden select-none z-20 sticky left-0"
            style={{ paddingTop: '10px' }}
        >
            {hours.map((hour) => (
                <div
                    key={hour}
                    className="text-right pr-3 text-xs font-medium text-slate-500"
                    style={{ height: `${hourHeight}px` }}
                >
                    {hour.toString().padStart(2, '0')}:00
                </div>
            ))}
        </div>
    );
}
