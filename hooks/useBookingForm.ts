import { useState } from 'react';
import { Customer, Camera, Employee } from '@/lib/types/database';

export interface BookingFormData {
  // Step A: Customer Info
  customerName: string;
  customerPhone: string;
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
    hasDiscount: false,
    discountPercent: 0,
    discountReason: '',
    finalFee: 0,
    createdBy: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors when updating
    setErrors({});
  };

  const validateStep = (step: 'A' | 'B' | 'C' | 'D'): boolean => {
    const newErrors: Record<string, string> = {};

    // Step A is now Time
    if (step === 'A') {
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
        }
      }
    }

    // Step B is now Equipment
    if (step === 'B') {
      if (formData.selectedCameras.length === 0) {
        newErrors.cameras = 'Vui lòng chọn ít nhất một máy ảnh';
      }
    }

    // Step C is now Customer Info
    if (step === 'C') {
      if (!formData.customerName.trim()) {
        newErrors.customerName = 'Tên khách hàng là bắt buộc';
      }
      if (!formData.customerPhone.trim()) {
        newErrors.customerPhone = 'Số điện thoại là bắt buộc';
      } else if (!/^[0-9]{10,11}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
        newErrors.customerPhone = 'Số điện thoại không hợp lệ';
      }
      if (formData.platforms.length > 2) {
        newErrors.platforms = 'Chỉ được chọn tối đa 2 kênh liên hệ';
      }
    }

    // Step D remains Payment
    if (step === 'D') {
      if (!formData.deliveryLocation.trim()) {
        newErrors.deliveryLocation = 'Địa điểm giao máy là bắt buộc';
      }
      if (!formData.createdBy) {
        newErrors.createdBy = 'Vui lòng chọn nhân viên lên lịch';
      }
      if (formData.depositType === 'cccd' && !formData.hasVNeID && !formData.cccdName.trim()) {
        newErrors.cccdName = 'Vui lòng nhập tên trên CCCD';
      }
      if (formData.depositType === 'custom' && formData.depositAmount <= 0) {
        newErrors.depositAmount = 'Vui lòng nhập số tiền cọc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const steps: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const prevStep = () => {
    const steps: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const searchCustomer = async (phone: string) => {
    try {
      const response = await fetch(`/api/customers?phone=${phone}`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setExistingCustomer(data.data[0]);
        updateFormData({
          customerName: data.data[0].name,
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
  };

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

