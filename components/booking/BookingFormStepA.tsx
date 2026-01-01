'use client';

import { useEffect } from 'react';
import Input from '@/components/ui/Input';
import clsx from 'clsx';

interface BookingFormStepAProps {
  customerName: string;
  customerPhone: string;
  platforms: string[];
  errors: Record<string, string>;
  existingCustomer: { name: string; platforms: string[] } | null;
  onUpdate: (updates: {
    customerName?: string;
    customerPhone?: string;
    platforms?: string[];
  }) => void;
  onSearchCustomer: (phone: string) => Promise<void>;
}

const platformOptions = [
  { value: 'IG', label: 'Instagram', icon: 'photo_camera' },
  { value: 'ZL', label: 'Zalo', icon: 'chat' },
  { value: 'TT', label: 'TikTok', icon: 'video_library' },
  { value: 'FB', label: 'Facebook', icon: 'social_leaderboard' },
  { value: 'VL', label: 'Walk-in', icon: 'storefront' },
];

export default function BookingFormStepA({
  customerName,
  customerPhone,
  platforms,
  errors,
  existingCustomer,
  onUpdate,
  onSearchCustomer,
}: BookingFormStepAProps) {
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const timeoutId = setTimeout(() => {
        onSearchCustomer(customerPhone);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [customerPhone, onSearchCustomer]);

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      onUpdate({ platforms: platforms.filter((p) => p !== platform) });
    } else if (platforms.length < 2) {
      onUpdate({ platforms: [...platforms, platform] });
    }
  };

  return (
    <section className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
      <div className="p-4 border-b border-border-dark bg-input-dark/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="flex items-center justify-center size-6 rounded bg-primary text-xs text-white">
            A
          </span>
          Thông tin khách hàng
        </h3>
        <span className="text-xs text-red-400 font-medium">* Bắt buộc</span>
      </div>

      <div className="p-6 grid gap-6">
        {/* Existing Customer Notice */}
        {existingCustomer && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            <span className="text-sm text-emerald-500">
              Đã tìm thấy khách hàng: {existingCustomer.name}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Tên khách hàng *"
            icon="person"
            value={customerName}
            onChange={(e) => onUpdate({ customerName: e.target.value })}
            error={errors.customerName}
            placeholder="Nhập tên khách"
          />

          <Input
            label="Số điện thoại *"
            icon="call"
            type="tel"
            value={customerPhone}
            onChange={(e) => onUpdate({ customerPhone: e.target.value })}
            error={errors.customerPhone}
            placeholder="09xx xxx xxx"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Kênh liên hệ (Chọn tối đa 2)
          </span>
          {errors.platforms && (
            <span className="text-xs text-red-400">{errors.platforms}</span>
          )}
          <div className="flex flex-wrap gap-3">
            {platformOptions.map((platform) => {
              const isSelected = platforms.includes(platform.value);
              const isDisabled = !isSelected && platforms.length >= 2;

              return (
                <label
                  key={platform.value}
                  className={clsx(
                    'cursor-pointer group relative',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(platform.value)}
                    disabled={isDisabled}
                    className="peer sr-only"
                  />
                  <div
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border-dark bg-input-dark text-text-secondary hover:bg-border-dark'
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {platform.icon}
                    </span>
                    <span className="text-sm font-medium">{platform.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


