'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { getHoursBetween } from '@/lib/utils/date';

interface BookingFormStepBProps {
  pickupTime: string;
  returnTime: string;
  errors: Record<string, string>;
  onUpdate: (updates: { pickupTime?: string; returnTime?: string }) => void;
  onAvailabilityCheck?: (pickupTime: string, returnTime: string) => Promise<void>;
}

export default function BookingFormStepB({
  pickupTime,
  returnTime,
  errors,
  onUpdate,
  onAvailabilityCheck,
}: BookingFormStepBProps) {
  const [rentalDuration, setRentalDuration] = useState<{ days: number; hours: number } | null>(
    null
  );

  useEffect(() => {
    if (pickupTime && returnTime) {
      const hours = getHoursBetween(pickupTime, returnTime);
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      setRentalDuration({ days, hours: remainingHours });

      // Check availability
      if (onAvailabilityCheck) {
        onAvailabilityCheck(pickupTime, returnTime);
      }
    } else {
      setRentalDuration(null);
    }
  }, [pickupTime, returnTime, onAvailabilityCheck]);

  // Format datetime-local input value
  const formatDateTimeLocal = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateTimeChange = (field: 'pickupTime' | 'returnTime', value: string) => {
    // Convert datetime-local to ISO string
    if (value) {
      const date = new Date(value);
      onUpdate({ [field]: date.toISOString() });
    } else {
      onUpdate({ [field]: '' });
    }
  };

  return (
    <section className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
      <div className="p-4 border-b border-border-dark bg-input-dark/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="flex items-center justify-center size-6 rounded bg-surface-dark border border-border-dark text-xs text-white">
            B
          </span>
          Thời gian thuê
        </h3>
      </div>

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              Bắt đầu (Pickup) <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeLocal(pickupTime)}
              onChange={(e) => handleDateTimeChange('pickupTime', e.target.value)}
              className="w-full bg-input-dark border border-border-dark rounded-lg py-3 px-4 text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 [color-scheme:dark]"
            />
            {errors.pickupTime && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                {errors.pickupTime}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              Kết thúc (Return) <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeLocal(returnTime)}
              onChange={(e) => handleDateTimeChange('returnTime', e.target.value)}
              className="w-full bg-input-dark border border-border-dark rounded-lg py-3 px-4 text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 [color-scheme:dark]"
            />
            {errors.returnTime && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                {errors.returnTime}
              </p>
            )}
          </div>
        </div>

        {rentalDuration && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-sm text-text-secondary">Thời gian thuê dự kiến:</span>
            <span className="text-sm font-bold text-white">
              {rentalDuration.days > 0 && `${rentalDuration.days} ngày `}
              {rentalDuration.hours} giờ
            </span>
          </div>
        )}
      </div>
    </section>
  );
}


