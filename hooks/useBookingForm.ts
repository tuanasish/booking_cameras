import { useState, useCallback } from 'react';
import { Customer, Camera, Employee } from '@/lib/types/database';

export interface BookingFormData {
  // Step A: Customer Info
  customerName: string;
  customerPhone: string;
  customerPhone2: string;
  platforms: string[]; // Max 2

  // Step B: Time
  pickupTime: string;
  returnTime: string;

  // Step C: Equipment
  selectedCameras: Array<{
    cameraId: string;
    camera: Camera;
    quantity: number;
  }>;
  hasTripod: boolean;
  hasReflector: boolean;
  otherAccessories: string;

  // Step D: Payment
  depositType: 'none' | 'default' | 'custom' | 'cccd';
  depositAmount: number;
  cccdName: string;
  hasVNeID: boolean;
  deliveryLocation: string;
  deliveryFee: number;
  totalRentalFee: number; // S
  extraPriceTotal: number; // Phần không chiết khấu
  hasDiscount: boolean;
  discountPercent: number;
  discountReason: string;
  finalFee: number; // P
  createdBy: string; // Employee ID
}

export function useBookingForm() {
  const [currentStep, setCurrentStep] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerPhone2: '',
    platforms: [],
    pickupTime: '',
    returnTime: '',
    selectedCameras: [],
    hasTripod: false,
    hasReflector: false,
    otherAccessories: '',
    depositType: 'none',
    depositAmount: 0,
    cccdName: '',
    hasVNeID: false,
    deliveryLocation: '',
    deliveryFee: 0,
    totalRentalFee: 0,
    extraPriceTotal: 0,
    hasDiscount: false,
    discountPercent: 0,
    discountReason: '',
    finalFee: 0,
    createdBy: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors when updating
    setErrors({});
  }, []);

  const validateStep = useCallback((step: 'A' | 'B' | 'C' | 'D' | 'all'): boolean => {
    const newErrors: Record<string, string> = {};

    // Step A: Time
    if (step === 'A' || step === 'all') {
      if (!formData.pickupTime) {
        newErrors.pickupTime = 'Thời gian nhận máy là bắt buộc';
      }
      if (!formData.returnTime) {
        newErrors.returnTime = 'Thời gian trả máy là bắt buộc';
      }
      if (formData.pickupTime && formData.returnTime) {
        const pickup = new Date(formData.pickupTime);
        const returnTime = new Date(formData.returnTime);
        if (returnTime <= pickup) {
          newErrors.returnTime = 'Thời gian trả phải sau thời gian nhận';
        } else {
          const diffMs = returnTime.getTime() - pickup.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours < 4) {
            newErrors.returnTime = 'Thời gian thuê tối thiểu phải là 4 tiếng';
          }
        }
      }
    }

    // Step B: Equipment
    if (step === 'B' || step === 'all') {
      if (formData.selectedCameras.length === 0) {
        newErrors.cameras = 'Vui lòng chọn ít nhất một máy ảnh';
      }
    }

    // Step C: Customer Info
    if (step === 'C' || step === 'all') {
      if (!formData.customerName.trim()) {
        newErrors.customerName = 'Tên khách hàng là bắt buộc';
      }
      if (!formData.customerPhone.trim()) {
        newErrors.customerPhone = 'Số điện thoại là bắt buộc';
      } else if (!/^[0-9]{10,11}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
        newErrors.customerPhone = 'Số điện thoại không hợp lệ';
      }
      if (formData.platforms.length === 0) {
        newErrors.platforms = 'Vui lòng chọn ít nhất một nền tảng';
      }
    }

    // Step D: Payment
    if (step === 'D' || step === 'all') {
      if (formData.depositType === 'cccd' && !formData.cccdName.trim()) {
        newErrors.cccdName = 'Tên trên CCCD là bắt buộc khi cọc bằng CCCD';
      }
      if (!formData.createdBy) {
        newErrors.createdBy = 'Vui lòng chọn nhân viên tạo đơn';
      }
      if (formData.depositType === 'custom' && formData.depositAmount <= 0) {
        newErrors.depositAmount = 'Vui lòng nhập số tiền cọc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      const steps: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    const steps: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const searchCustomer = useCallback(async (phone: string) => {
    try {
      const response = await fetch(`/api/customers?phone=${phone}`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setExistingCustomer(data.data[0]);
        updateFormData({
          customerName: data.data[0].name,
          customerPhone2: data.data[0].phone_2 || '',
          platforms: data.data[0].platforms || [],
        });
        return data.data[0];
      } else {
        setExistingCustomer(null);
        return null;
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      return null;
    }
  }, [updateFormData]);

  return {
    currentStep,
    formData,
    errors,
    existingCustomer,
    updateFormData,
    setCurrentStep,
    nextStep,
    prevStep,
    validateStep,
    searchCustomer,
  };
}

