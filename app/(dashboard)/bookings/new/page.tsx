'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    // Calculate total rental fee when cameras or time changes
    if (formData.selectedCameras.length > 0 && formData.pickupTime && formData.returnTime) {
      const total = formData.selectedCameras.reduce((sum, item) => {
        const price = calculateRentalPrice(item.camera, formData.pickupTime, formData.returnTime);
        return sum + price * item.quantity;
      }, 0);
      updateFormData({ totalRentalFee: total });
    }
  }, [formData.selectedCameras, formData.pickupTime, formData.returnTime]);

  const checkAvailability = async (pickupTime: string, returnTime: string) => {
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
  };

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
        // Update existing customer platforms if changed
        await fetch(`/api/customers?id=${customerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          total_delivery_fee: formData.deliveryFee, // Total delivery fee for pickup
          booking_items: formData.selectedCameras.map((item) => ({
            camera_id: item.cameraId,
            quantity: item.quantity,
            unit_price: calculateRentalPrice(
              item.camera,
              formData.pickupTime,
              formData.returnTime
            ),
            subtotal:
              calculateRentalPrice(
                item.camera,
                formData.pickupTime,
                formData.returnTime
              ) * item.quantity,
          })),
          booking_accessories: [
            ...(formData.hasTripod
              ? [{ accessory_type: 'tripod', quantity: 1 }]
              : []),
            ...(formData.hasReflector
              ? [{ accessory_type: 'reflector', quantity: 1 }]
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
              location: formData.deliveryLocation,
              delivery_fee: formData.deliveryFee,
            },
            {
              type: 'return',
              due_at: formData.returnTime,
              location: formData.deliveryLocation,
              delivery_fee: 0,
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
    <div className="flex h-full flex-col overflow-hidden bg-[#111318]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-[#111318] px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-white">Tạo Booking Mới</h1>
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

