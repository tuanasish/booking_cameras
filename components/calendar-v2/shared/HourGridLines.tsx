'use client';

interface HourGridLinesProps {
    startHour?: number;
    endHour?: number;
    hourHeight?: number;
}

export default function HourGridLines({
    startHour = 0,
    endHour = 24,
    hourHeight = 60,
}: HourGridLinesProps) {
    const hours = Array.from({ length: endHour - startHour }, (_, i) => i);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col" style={{ paddingTop: '20px' }}>
            {hours.map((i) => (
                <div
                    key={i}
                    className="border-t border-border-dark/50 w-full relative"
                    style={{ height: `${hourHeight}px` }}
                >
                    {/* Half-hour dotted line */}
                    <div
                        className="absolute w-full border-t border-dotted border-border-dark/20"
                        style={{ top: `${hourHeight / 2}px` }}
                    />
                </div>
            ))}
        </div>
    );
}
