'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { getHoursBetween, parseQuickDateTime } from '@/lib/utils/date';
import { formatDateTime } from '@/lib/utils/format';

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

  // Local state for raw text inputs
  const [pickupText, setPickupText] = useState(pickupTime ? formatDateTime(pickupTime) : '');
  const [returnText, setReturnText] = useState(returnTime ? formatDateTime(returnTime) : '');

  // Sync with props when they change (e.g. from parent or drag selection)
  useEffect(() => {
    if (pickupTime) {
      const formatted = formatDateTime(pickupTime);
      if (formatted !== pickupText) setPickupText(formatted);
    }
    if (returnTime) {
      const formatted = formatDateTime(returnTime);
      if (formatted !== returnText) setReturnText(formatted);
    }
  }, [pickupTime, returnTime]);

  useEffect(() => {
    if (pickupTime && returnTime) {
      const hours = getHoursBetween(pickupTime, returnTime);
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      setRentalDuration({ days, hours: remainingHours });

      if (onAvailabilityCheck) {
        onAvailabilityCheck(pickupTime, returnTime);
      }
    } else {
      setRentalDuration(null);
    }
  }, [pickupTime, returnTime, onAvailabilityCheck]);

  const handleTextChange = (
    field: 'pickupTime' | 'returnTime',
    value: string,
    setText: (v: string) => void
  ) => {
    // Basic mask: dd/mm/yyyy hh:mm
    let cleaned = value.replace(/\D/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += '/';
        formatted += cleaned.slice(2, 4);
      }
      if (cleaned.length > 4) {
        formatted += '/';
        formatted += cleaned.slice(4, 8);
      }
      if (cleaned.length > 8) {
        formatted += ' ';
        formatted += cleaned.slice(8, 10);
      }
      if (cleaned.length > 10) {
        formatted += ':';
        formatted += cleaned.slice(10, 12);
      }
    }

    setText(formatted);

    // If we have enough digits, try to parse and update parent
    if (cleaned.length >= 12) {
      const parsed = parseQuickDateTime(formatted);
      if (parsed) {
        onUpdate({ [field]: parsed.toISOString() });
      }
    }
  };

  const renderQuickInput = (
    field: 'pickupTime' | 'returnTime',
    label: string,
    text: string,
    setText: (v: string) => void
  ) => {
    const error = errors[field];

    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary">
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => handleTextChange(field, e.target.value, setText)}
            placeholder="03/01/2026 20:30"
            className="w-full bg-surface border border-border rounded-lg py-3 px-4 text-text-main font-mono focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary/50 uppercase font-bold tracking-widest hidden sm:block">
            DD/MM/YYYY HH:MM
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-surface/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-text-main flex items-center gap-2">
          <span className="flex items-center justify-center size-6 rounded bg-surface border border-border text-xs text-text-main">
            B
          </span>
          Thời gian thuê
        </h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Nhập nhanh
        </span>
      </div>

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderQuickInput('pickupTime', 'Bắt đầu (Pickup)', pickupText, setPickupText)}
          {renderQuickInput('returnTime', 'Kết thúc (Return)', returnText, setReturnText)}
        </div>

        {rentalDuration && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-sm text-text-secondary">Thời gian thuê dự kiến:</span>
            <span className="text-sm font-bold text-text-main">
              {rentalDuration.days > 0 && `${rentalDuration.days} ngày `}
              {rentalDuration.hours} giờ
            </span>
          </div>
        )}
      </div>
    </section>
  );
}






