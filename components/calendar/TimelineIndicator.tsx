'use client';

import { useEffect, useState } from 'react';

export default function TimelineIndicator() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const percent = ((hours * 60 + minutes) / (24 * 60)) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-primary z-0 pointer-events-none opacity-30 border-l border-dashed border-primary"
      style={{ left: `${percent}%` }}
    />
  );
}


