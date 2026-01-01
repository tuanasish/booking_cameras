'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingForm } from '@/hooks/useBookingForm';
import { Camera, Employee } from '@/lib/types/database';
import BookingFormStepper from '@/components/booking/BookingFormStepper';

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

    useEffect(() => {
        fetchBookingAndPopulateForm();
    }, [params.id]);

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
                    platforms: b.customer.platforms || [],
                    pickupTime: new Date(b.pickup_time).toISOString().slice(0, 16),
                    returnTime: new Date(b.return_time).toISOString().slice(0, 16),
                    selectedCameras: b.booking_items.map((item: any) => ({
                        cameraId: item.camera_id,
                        camera: item.camera,
                        quantity: item.quantity,
                    })),
                    hasTripod: b.booking_accessories.some((a: any) => a.accessory_type === 'tripod'),
                    hasReflector: b.booking_accessories.some((a: any) => a.accessory_type === 'reflector'),
                    otherAccessories: b.booking_accessories
                        .filter((a: any) => !['tripod', 'reflector'].includes(a.accessory_type))
                        .map((a: any) => a.name)
                        .join(', '),
                    depositType: b.deposit_type,
                    depositAmount: b.deposit_amount,
                    cccdName: b.cccd_name || '',
                    hasVNeID: b.deposit_type === 'cccd' && !b.cccd_name, // Simple heuristic
                    deliveryLocation: b.tasks?.find((t: any) => t.type === 'pickup')?.location || '',
                    deliveryFee: b.tasks?.find((t: any) => t.type === 'pickup')?.delivery_fee || 0,
                    totalRentalFee: b.total_rental_fee,
                    hasDiscount: b.discount_percent > 0,
                    discountPercent: b.discount_percent,
                    discountReason: b.discount_reason || '',
                    finalFee: b.final_fee,
                    createdBy: b.created_by,
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
        if (!validateStep('D')) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/bookings/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Note: Simplistic PATCH. In a real app, you might need to handle 
                    // sub-records (items, accessories, tasks) updating too via deeper logic
                    // or a dedicated update endpoint. Here we update the core fields.
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
            <div className="flex items-center justify-center h-full bg-[#111318]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#111318]">
            <header className="flex h-16 items-center border-b border-border-dark bg-[#111318] px-6 shrink-0">
                <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-white uppercase">Chỉnh sửa Booking</h1>
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
