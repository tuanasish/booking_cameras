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
      <svg viewBox="0 0 50 50" className="size-[18px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M22.782 0.166016H27.199C33.2653 0.166016 36.8103 1.05701 39.9572 2.74421C43.1041 4.4314 45.5875 6.89585 47.2557 10.0428C48.9429 13.1897 49.8339 16.7347 49.8339 22.801V27.1991C49.8339 33.2654 48.9429 36.8104 47.2557 39.9573C45.5685 43.1042 43.1041 45.5877 39.9572 47.2559C36.8103 48.9431 33.2653 49.8341 27.199 49.8341H22.8009C16.7346 49.8341 13.1896 48.9431 10.0427 47.2559C6.89583 45.5687 4.41243 43.1042 2.7442 39.9573C1.057 36.8104 0.166016 33.2654 0.166016 27.1991V22.801C0.166016 16.7347 1.057 13.1897 2.7442 10.0428C4.43139 6.89585 6.89583 4.41245 10.0427 2.74421C13.1707 1.05701 16.7346 0.166016 22.782 0.166016Z" fill="#0068FF" />
        <path opacity="0.12" fill-rule="evenodd" clip-rule="evenodd" d="M49.8336 26.4736V27.1994C49.8336 33.2657 48.9427 36.8107 47.2555 39.9576C45.5683 43.1045 43.1038 45.5879 39.9569 47.2562C36.81 48.9434 33.265 49.8344 27.1987 49.8344H22.8007C17.8369 49.8344 14.5612 49.2378 11.8104 48.0966L7.27539 43.4267L49.8336 26.4736Z" fill="#001A33" />
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.779 43.5892C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z" fill="white" />
        <path d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z" fill="#0068FF" />
        <path d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z" fill="#0068FF" />
        <path d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z" fill="#0068FF" />
        <path d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z" fill="#0068FF" />
        <path d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z" fill="#0068FF" />
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





