'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingForm } from '@/hooks/useBookingForm';
import { Camera, Employee } from '@/lib/types/database';
import BookingFormStepper from '@/components/booking/BookingFormStepper';
import { calculateRentalPrice } from '@/lib/utils/booking';

export default function EditBookingPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const {
        currentStep,
        formData,
        errors,
        updateFormData,
        setCurrentStep,
        nextStep,
        prevStep,
        validateStep,
        searchCustomer,
    } = useBookingForm();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetchBookingAndPopulateForm();
        fetchSettings();
    }, [params.id]);

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

            if (total !== formData.totalRentalFee || extraTotal !== formData.extraPriceTotal) {
                updateFormData({
                    totalRentalFee: total,
                    extraPriceTotal: extraTotal
                });
            }
        }
    }, [formData.selectedCameras, formData.pickupTime, formData.returnTime, settings]);

    const fetchBookingAndPopulateForm = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/bookings/${params.id}`);
            const data = await response.json();

            if (data.data) {
                const b = data.data;
                // Seed the useBookingForm state
                updateFormData({
                    customerName: b.customer.name,
                    customerPhone: b.customer.phone,
                    customerPhone2: b.customer.phone_2 || '',
                    platforms: b.customer.platforms || [],
                    pickupTime: new Date(b.pickup_time).toISOString().slice(0, 16),
                    returnTime: new Date(b.return_time).toISOString().slice(0, 16),
                    selectedCameras: b.booking_items.map((item: any) => ({
                        cameraId: item.camera_id,
                        camera: item.camera,
                        quantity: item.quantity,
                    })),
                    tripodQuantity: b.booking_accessories.find((a: any) => a.accessory_type === 'tripod')?.quantity || 0,
                    reflectorQuantity: b.booking_accessories.find((a: any) => a.accessory_type === 'reflector')?.quantity || 0,
                    otherAccessories: b.booking_accessories
                        .filter((a: any) => !['tripod', 'reflector'].includes(a.accessory_type))
                        .map((a: any) => a.name)
                        .join(', '),
                    depositType: b.deposit_type,
                    depositAmount: b.deposit_amount,
                    cccdName: b.cccd_name || '',
                    hasVNeID: b.deposit_type === 'cccd' && !b.cccd_name, // Simple heuristic
                    pickupLocation: b.tasks?.find((t: any) => t.type === 'pickup')?.location || '',
                    pickupFee: b.tasks?.find((t: any) => t.type === 'pickup')?.delivery_fee || 0,
                    returnLocation: b.tasks?.find((t: any) => t.type === 'return')?.location || '',
                    returnFee: b.tasks?.find((t: any) => t.type === 'return')?.delivery_fee || 0,
                    totalRentalFee: b.total_rental_fee,
                    hasDiscount: b.discount_percent > 0,
                    discountPercent: b.discount_percent,
                    discountReason: b.discount_reason || '',
                    finalFee: b.final_fee,
                    createdBy: b.created_by,
                    notes: b.notes || '',
                });
            } else {
                alert('Không tìm thấy booking');
                router.push('/calendar');
            }
        } catch (error) {
            console.error('Error seeding edit form:', error);
            alert('Lỗi khi tải thông tin booking');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateStep('all')) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/bookings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Core fields
                    pickup_time: formData.pickupTime,
                    return_time: formData.returnTime,
                    deposit_type: formData.depositType,
                    deposit_amount: formData.depositAmount,
                    cccd_name: formData.cccdName,
                    total_rental_fee: formData.totalRentalFee,
                    discount_percent: formData.discountPercent,
                    discount_reason: formData.discountReason,
                    final_fee: formData.finalFee,
                    payment_status: formData.depositType === 'none' ? 'pending' : 'deposited',
                    // Customer fields
                    customer_name: formData.customerName,
                    customer_phone_2: formData.customerPhone2,
                    platforms: formData.platforms,
                }),
            });

            if (response.ok) {
                alert('Cập nhật booking thành công');
                router.push(`/bookings/${params.id}`);
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Đã có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-background text-text-main">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <header className="flex h-16 items-center border-b border-border bg-surface px-6 shrink-0">
                <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 hover:bg-surface-hover rounded text-text-secondary hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-text-main uppercase">Chỉnh sửa Booking</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <BookingFormStepper
                        currentStep={currentStep}
                        formData={formData}
                        errors={errors}
                        updateFormData={updateFormData}
                        onNext={nextStep}
                        onBack={prevStep}
                        onSubmit={handleUpdate}
                        submitting={submitting}
                        isEdit={true}
                    />
                </div>
            </div>
        </div>
    );
}
