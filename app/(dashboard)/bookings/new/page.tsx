'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingForm } from '@/hooks/useBookingForm';
import BookingFormStepper from '@/components/booking/BookingFormStepper';
import BookingFormStepA from '@/components/booking/BookingFormStepA';
import BookingFormStepB from '@/components/booking/BookingFormStepB';
import BookingFormStepC from '@/components/booking/BookingFormStepC';
import BookingFormStepD from '@/components/booking/BookingFormStepD';
import { calculateRentalPrice } from '@/lib/utils/booking';
import clsx from 'clsx';

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStep,
    formData,
    errors,
    existingCustomer,
    updateFormData,
    nextStep,
    prevStep,
    validateStep,
    searchCustomer,
  } = useBookingForm();

  const [loading, setLoading] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Read URL parameters and pre-fill form - only once on mount
  const hasProcessedParams = useRef(false);

  useEffect(() => {
    if (hasProcessedParams.current) return;

    const cameraId = searchParams.get('cameraId');
    const pickupTimeParam = searchParams.get('pickupTime');
    const returnTimeParam = searchParams.get('returnTime');
    const dateParam = searchParams.get('date');
    const hourParam = searchParams.get('hour');

    // Chatbot params
    const customerPhoneParam = searchParams.get('customerPhone');
    const depositAmountParam = searchParams.get('depositAmount');

    // Handle drag selection or chatbot (pickupTime + returnTime)
    if (pickupTimeParam && returnTimeParam) {
      const updates: any = {
        pickupTime: pickupTimeParam,
        returnTime: returnTimeParam,
      };

      // If from chatbot, also set customer phone and deposit
      if (customerPhoneParam) {
        updates.customerPhone = customerPhoneParam;
      }
      if (depositAmountParam) {
        const deposit = parseInt(depositAmountParam);
        if (deposit > 0) {
          updates.depositType = 'custom';
          updates.depositAmount = deposit;
        }
      }

      updateFormData(updates);
      hasProcessedParams.current = true;

      // If phone provided, search for existing customer
      if (customerPhoneParam) {
        searchCustomer(customerPhoneParam);
      }
    }
    // Handle single click (date + hour)
    else if (dateParam && hourParam) {
      const pickup = new Date(`${dateParam}T${hourParam}:00:00`);
      const returnTime = new Date(pickup);
      returnTime.setHours(pickup.getHours() + 6); // Default 6 hours

      updateFormData({
        pickupTime: pickup.toISOString(),
        returnTime: returnTime.toISOString(),
      });
      hasProcessedParams.current = true;
    }
  }, [searchParams]);

  // Pre-select camera when available cameras load
  useEffect(() => {
    if (availableCameras.length === 0) return;

    const cameraId = searchParams.get('cameraId');
    if (cameraId && !formData.selectedCameras.some(c => c.cameraId === cameraId)) {
      const camera = availableCameras.find((c: any) => c.id === cameraId);
      if (camera) {
        updateFormData({
          selectedCameras: [{
            cameraId: camera.id,
            camera: camera,
            quantity: 1,
          }],
        });
      }
    }
  }, [availableCameras]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setSettings(data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    // Calculate total rental fee when cameras or time changes
    if (formData.selectedCameras.length > 0 && formData.pickupTime && formData.returnTime) {
      let total = 0;
      let extraTotal = 0;

      formData.selectedCameras.forEach((item) => {
        const priceBreakdown = calculateRentalPrice(
          item.camera,
          formData.pickupTime,
          formData.returnTime,
          settings?.late_fee_divisor || 5
        );
        total += priceBreakdown.total * item.quantity;
        extraTotal += priceBreakdown.extraPrice * item.quantity;
      });

      updateFormData({
        totalRentalFee: total,
        extraPriceTotal: extraTotal
      });
    }
  }, [formData.selectedCameras, formData.pickupTime, formData.returnTime, settings]);

  const checkAvailability = useCallback(async (pickupTime: string, returnTime: string) => {
    if (!pickupTime || !returnTime) return;

    try {
      const response = await fetch('/api/cameras/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupTime, returnTime }),
      });
      const data = await response.json();
      setAvailableCameras(data.data || []);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  }, []);

  const handleSubmit = async () => {
    if (!validateStep('D')) {
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create or find customer
      let customerId = existingCustomer?.id;
      if (!customerId) {
        const customerRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.customerName,
            phone: formData.customerPhone,
            platforms: formData.platforms,
          }),
        });
        const customerData = await customerRes.json();
        customerId = customerData.data.id;
      } else {
        // Update existing customer info if changed
        await fetch(`/api/customers?id=${customerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.customerName,
            phone_2: formData.customerPhone2 || null,
            platforms: formData.platforms,
          }),
        });
      }

      // 2. Calculate payment status
      const paymentStatus =
        formData.depositType === 'none' && !formData.depositAmount
          ? 'pending'
          : 'deposited';

      // 3. Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          created_by: formData.createdBy,
          pickup_time: formData.pickupTime,
          return_time: formData.returnTime,
          payment_status: paymentStatus,
          deposit_type: formData.depositType,
          deposit_amount: formData.depositAmount,
          cccd_name:
            formData.depositType === 'cccd' && !formData.hasVNeID
              ? formData.cccdName
              : null,
          has_vneid: formData.hasVNeID,
          total_rental_fee: formData.totalRentalFee,
          discount_percent: formData.hasDiscount ? formData.discountPercent : 0,
          discount_reason: formData.hasDiscount ? formData.discountReason : null,
          final_fee: formData.finalFee,
          late_fee: 0, // Will be calculated on return
          total_delivery_fee: formData.pickupFee + formData.returnFee, // Total delivery fee
          notes: formData.notes || null,
          booking_items: formData.selectedCameras.map((item) => ({
            camera_id: item.cameraId,
            quantity: item.quantity,
            unit_price: calculateRentalPrice(
              item.camera,
              formData.pickupTime,
              formData.returnTime,
              settings?.late_fee_divisor || 5
            ).total,
            subtotal:
              calculateRentalPrice(
                item.camera,
                formData.pickupTime,
                formData.returnTime,
                settings?.late_fee_divisor || 5
              ).total * item.quantity,
          })),
          booking_accessories: [
            ...(formData.tripodQuantity > 0
              ? [{ accessory_type: 'tripod', quantity: formData.tripodQuantity }]
              : []),
            ...(formData.reflectorQuantity > 0
              ? [{ accessory_type: 'reflector', quantity: formData.reflectorQuantity }]
              : []),
            ...(formData.otherAccessories
              ? [
                {
                  accessory_type: 'other',
                  name: formData.otherAccessories,
                  quantity: 1,
                },
              ]
              : []),
          ],
          tasks: [
            {
              type: 'pickup',
              due_at: formData.pickupTime,
              location: formData.pickupLocation,
              delivery_fee: formData.pickupFee,
            },
            {
              type: 'return',
              due_at: formData.returnTime,
              location: formData.returnLocation,
              delivery_fee: formData.returnFee,
            },
          ],
        }),
      });

      const bookingData = await bookingRes.json();

      if (bookingRes.ok) {
        router.push('/calendar');
      } else {
        alert('Lỗi: ' + (bookingData.error || 'Không thể tạo booking'));
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Lỗi khi tạo booking. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-hover rounded-xl text-text-secondary hover:text-text-main transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-text-main">Tạo Booking Mới</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <BookingFormStepper
            currentStep={currentStep}
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            onSubmit={handleSubmit}
            submitting={submitting}
            availableCameras={availableCameras}
            onSearchCustomer={searchCustomer}
            onAvailabilityCheck={checkAvailability}
            existingCustomer={existingCustomer}
          />
        </div>
      </div>
    </div>
  );
}

