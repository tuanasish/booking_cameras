'use client';

import { useEffect } from 'react';
import Input from '@/components/ui/Input';
import clsx from 'clsx';

interface BookingFormStepAProps {
  customerName: string;
  customerPhone: string;
  customerPhone2: string;
  platforms: string[];
  errors: Record<string, string>;
  existingCustomer: { name: string; phone_2?: string | null; platforms: string[] } | null;
  onUpdate: (updates: {
    customerName?: string;
    customerPhone?: string;
    customerPhone2?: string;
    platforms?: string[];
  }) => void;
  onSearchCustomer: (phone: string) => Promise<void>;
}

const platformOptions = [
  {
    value: 'IG',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  },
  {
    value: 'ZL',
    label: 'Zalo',
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.3 2.3v19.4h19.4V2.3H2.3zm12.9 14.1l-1.6-1.6c-.1-.1-.1-.3 0-.4l2.4-2.4c.1-.1.1-.3 0-.4l-2.4-2.4c-.1-.1-.1-.3 0-.4l1.6-1.6c.1-.1.3-.1.4 0l4.2 4.2c.1.1.1.3 0 .4l-4.2 4.2c-.1.1-.3.1-.4 0zm-6.4 0L4.6 12.2c-.1-.1-.1-.3 0-.4l4.2-4.2c.1-.1.3-.1.4 0l1.6 1.6c.1.1.1.3 0 .4l-2.4 2.4c-.1.1-.1.3 0 .4l2.4 2.4c.1.1.1.3 0 .4l-1.6 1.6c-.1.1-.3.1-.4 0z" />
      </svg>
    )
  },
  {
    value: 'TT',
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.53 1.53-.3 2.7-1.57 2.8-3.14.07-5.9.03-11.81.04-17.71z" />
      </svg>
    )
  },
  {
    value: 'FB',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
      </svg>
    )
  },
  {
    value: 'VL',
    label: 'Vãng lai',
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
      </svg>
    )
  },
];

export default function BookingFormStepA({
  customerName,
  customerPhone,
  customerPhone2,
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
    <section className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-surface/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-text-main flex items-center gap-2">
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
            <div className="flex flex-col">
              <span className="text-sm font-bold text-emerald-500">
                Đã tìm thấy khách hàng: {existingCustomer.name}
              </span>
              {(existingCustomer.phone_2) && (
                <span className="text-xs text-emerald-500/80">
                  SĐT 2: {existingCustomer.phone_2}
                </span>
              )}
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại 1 *"
              icon="call"
              type="tel"
              value={customerPhone}
              onChange={(e) => onUpdate({ customerPhone: e.target.value })}
              error={errors.customerPhone}
              placeholder="09xx xxx xxx"
            />
            <Input
              label="Số điện thoại 2"
              icon="call"
              type="tel"
              value={customerPhone2}
              onChange={(e) => onUpdate({ customerPhone2: e.target.value })}
              error={errors.customerPhone2}
              placeholder="09xx xxx xxx (tùy chọn)"
            />
          </div>
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
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-hover transition-colors'
                    )}
                  >
                    {platform.icon}
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





