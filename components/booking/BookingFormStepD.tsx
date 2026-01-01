'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { Employee } from '@/lib/types/database';
import { calculateFinalFee } from '@/lib/utils/booking';
import clsx from 'clsx';

interface BookingFormStepDProps {
  depositType: 'none' | 'default' | 'custom' | 'cccd';
  depositAmount: number;
  cccdName: string;
  hasVNeID: boolean;
  deliveryLocation: string;
  deliveryFee: number;
  totalRentalFee: number; // S
  hasDiscount: boolean;
  discountPercent: number;
  discountReason: string;
  finalFee: number; // P
  createdBy: string;
  errors: Record<string, string>;
  onUpdate: (updates: {
    depositType?: 'none' | 'default' | 'custom' | 'cccd';
    depositAmount?: number;
    cccdName?: string;
    hasVNeID?: boolean;
    deliveryLocation?: string;
    deliveryFee?: number;
    hasDiscount?: boolean;
    discountPercent?: number;
    discountReason?: string;
    finalFee?: number;
    createdBy?: string;
  }) => void;
}

const discountReasons = [
  { value: 'birthday', label: 'Sinh nhật' },
  { value: 'long_term', label: 'Dài ngày' },
  { value: 'feedback', label: 'Để lại feedback' },
  { value: 'two_cameras', label: 'Thuê 2 máy' },
  { value: 'other', label: 'Khác' },
];

export default function BookingFormStepD({
  depositType,
  depositAmount,
  cccdName,
  hasVNeID,
  deliveryLocation,
  deliveryFee,
  totalRentalFee,
  hasDiscount,
  discountPercent,
  discountReason,
  finalFee,
  createdBy,
  errors,
  onUpdate,
}: BookingFormStepDProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState({
    defaultDeposit: 50000,
    deliveryFeePerKm: 8000,
  });

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
  }, []);

  useEffect(() => {
    // Auto-calculate final fee when discount changes
    if (hasDiscount && discountPercent > 0) {
      const newFinalFee = calculateFinalFee(totalRentalFee, discountPercent);
      onUpdate({ finalFee: newFinalFee });
    } else {
      onUpdate({ finalFee: totalRentalFee });
    }
  }, [hasDiscount, discountPercent, totalRentalFee]);

  useEffect(() => {
    // Set default deposit amount
    if (depositType === 'default') {
      onUpdate({ depositAmount: settings.defaultDeposit });
    } else if (depositType === 'none' || depositType === 'cccd') {
      onUpdate({ depositAmount: 0 });
    }
  }, [depositType, settings.defaultDeposit]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setSettings({
          defaultDeposit: data.data[0].default_deposit || 50000,
          deliveryFeePerKm: data.data[0].delivery_fee_per_km || 8000,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleDepositTypeChange = (type: 'none' | 'default' | 'custom' | 'cccd') => {
    onUpdate({ depositType: type });

    if (type === 'default') {
      onUpdate({ depositAmount: settings.defaultDeposit });
    } else if (type === 'none' || type === 'cccd') {
      onUpdate({ depositAmount: 0 });
    }
  };

  const getPaymentStatus = (): 'pending' | 'deposited' | 'paid' => {
    if (depositType === 'none') return 'pending';
    if (depositType === 'cccd' || depositAmount > 0) return 'deposited';
    return 'pending';
  };

  return (
    <section className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
      <div className="p-4 border-b border-border-dark bg-input-dark/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="flex items-center justify-center size-6 rounded bg-surface-dark border border-border-dark text-xs text-white">
            D
          </span>
          Thanh toán & Giao máy
        </h3>
        <span className="text-xs text-red-400 font-medium">* Bắt buộc</span>
      </div>

      <div className="p-6 grid gap-6">
        {/* Deposit Section */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-secondary">Cọc</span>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleDepositTypeChange('none')}
              className={clsx(
                'p-3 rounded-lg border text-sm font-medium transition-all',
                depositType === 'none'
                  ? 'border-red-500 bg-red-500/10 text-red-400 ring-1 ring-red-500'
                  : 'border-border-dark bg-input-dark text-text-secondary hover:border-[#3b4354] hover:text-white'
              )}
            >
              Chưa cọc
            </button>
            <button
              onClick={() => handleDepositTypeChange('default')}
              className={clsx(
                'p-3 rounded-lg border text-sm font-medium transition-all',
                depositType === 'default'
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500'
                  : 'border-border-dark bg-input-dark text-text-secondary hover:border-[#3b4354] hover:text-white'
              )}
            >
              Cọc {settings.defaultDeposit.toLocaleString('vi-VN')}đ
            </button>
            <button
              onClick={() => handleDepositTypeChange('custom')}
              className={clsx(
                'p-3 rounded-lg border text-sm font-medium transition-all',
                depositType === 'custom'
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500'
                  : 'border-border-dark bg-input-dark text-text-secondary hover:border-[#3b4354] hover:text-white'
              )}
            >
              Cọc khác
            </button>
          </div>

          {depositType === 'custom' && (
            <div className="mt-2">
              <Input
                label="Số tiền cọc"
                icon="payments"
                type="number"
                value={depositAmount.toString()}
                onChange={(e) => onUpdate({ depositAmount: parseInt(e.target.value) || 0 })}
                error={errors.depositAmount}
                placeholder="Nhập số tiền"
              />
            </div>
          )}

          {depositType === 'cccd' && !hasVNeID && (
            <div className="mt-2">
              <Input
                label="Tên trên CCCD *"
                icon="badge"
                value={cccdName}
                onChange={(e) => onUpdate({ cccdName: e.target.value })}
                error={errors.cccdName}
                placeholder="Nhập tên trên CCCD để nhắc nhở khi trả"
              />
            </div>
          )}

          {/* CCCD & VNeID options */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={depositType === 'cccd'}
                onChange={(e) =>
                  handleDepositTypeChange(e.target.checked ? 'cccd' : 'none')
                }
                className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-white">Cọc CCCD vật lý</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVNeID}
                onChange={(e) => onUpdate({ hasVNeID: e.target.checked })}
                className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-white">Khách có VNeID (không cần giữ CCCD)</span>
            </label>
          </div>

          {depositType !== 'none' && (
            <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500 text-[18px]">info</span>
                <span className="text-sm text-yellow-400">
                  Trạng thái: {depositType === 'cccd' ? 'Cọc CCCD' : 'Đã cọc'} ({depositAmount > 0 ? depositAmount.toLocaleString('vi-VN') + 'đ' : 'CCCD'})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Location & Fee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Địa điểm giao máy *"
            icon="location_on"
            value={deliveryLocation}
            onChange={(e) => onUpdate({ deliveryLocation: e.target.value })}
            error={errors.deliveryLocation}
            placeholder="Nhập địa điểm giao máy"
          />

          <Input
            label="Phí giao máy"
            icon="local_shipping"
            type="number"
            value={deliveryFee.toString()}
            onChange={(e) => onUpdate({ deliveryFee: parseInt(e.target.value) || 0 })}
            placeholder={`Tính: ${settings.deliveryFeePerKm.toLocaleString('vi-VN')}đ/km - Nhân viên tự tính`}
          />
        </div>

        {/* Discount Section */}
        <div className="flex flex-col gap-4 pt-4 border-t border-border-dark">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Chiết khấu</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => onUpdate({ hasDiscount: e.target.checked })}
                className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-white">Có chiết khấu</span>
            </label>
          </div>

          {hasDiscount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">
                  % Chiết khấu
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent.toString()}
                  onChange={(e) => onUpdate({ discountPercent: parseInt(e.target.value) || 0 })}
                  className="w-full bg-input-dark border border-border-dark rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                  placeholder="Nhập %"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">
                  Lý do chiết khấu
                </label>
                <select
                  value={discountReason}
                  onChange={(e) => onUpdate({ discountReason: e.target.value })}
                  className="w-full bg-input-dark border border-border-dark rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Chọn lý do</option>
                  {discountReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Employee Selection */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border-dark">
          <label className="text-sm font-medium text-text-secondary">
            Nhân viên lên lịch <span className="text-red-500">*</span>
          </label>
          <select
            value={createdBy}
            onChange={(e) => onUpdate({ createdBy: e.target.value })}
            className="w-full bg-input-dark border border-border-dark rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">Chọn nhân viên</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          {errors.createdBy && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {errors.createdBy}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-[#1e232e] border border-border-dark space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Phí thuê gốc (S):</span>
            <span className="text-white font-medium">
              {totalRentalFee.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {hasDiscount && discountPercent > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Chiết khấu ({discountPercent}%):</span>
                <span className="text-red-400 font-medium">
                  -{(totalRentalFee - finalFee).toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border-dark">
                <span className="text-text-secondary">Phí sau chiết khấu (P):</span>
                <span className="text-white font-bold">
                  {finalFee.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </>
          )}

          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Phí giao máy:</span>
              <span className="text-white font-medium">
                {deliveryFee.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-base pt-2 border-t border-border-dark">
            <span className="text-white font-bold">Tổng thanh toán:</span>
            <span className="text-primary font-bold text-lg">
              {(finalFee + deliveryFee).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

