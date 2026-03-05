'use client';

import clsx from 'clsx';
import { Camera } from '@/lib/types/database';
import BookingFormStepA from '@/components/booking/BookingFormStepA';
import BookingFormStepB from '@/components/booking/BookingFormStepB';
import BookingFormStepC from '@/components/booking/BookingFormStepC';
import BookingFormStepD from '@/components/booking/BookingFormStepD';
import { BookingFormData } from '@/hooks/useBookingForm';

interface BookingFormStepperProps {
  currentStep: 'A' | 'B' | 'C' | 'D';
  formData: BookingFormData;
  errors: Record<string, string>;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  availableCameras?: any[];
  onSearchCustomer?: (phone: string) => Promise<any>;
  onAvailabilityCheck?: (pickupTime: string, returnTime: string) => Promise<void>;
  existingCustomer?: any;
  isEdit?: boolean;
}

const steps = [
  { id: 'A', label: 'Thời gian', desc: 'Nhận & Trả máy' },
  { id: 'B', label: 'Thiết bị', desc: 'Body, Lens, Phụ kiện' },
  { id: 'C', label: 'Thông tin khách', desc: 'Tên, SĐT, Kênh liên hệ' },
  { id: 'D', label: 'Thanh toán', desc: 'Cọc, Chiết khấu, Phí giao' },
] as const;

export default function BookingFormStepper({
  currentStep,
  formData,
  errors,
  updateFormData,
  onNext,
  onBack,
  onSubmit,
  submitting,
  isEdit = false,
  availableCameras = [],
  onSearchCustomer,
  onAvailabilityCheck,
  existingCustomer,
}: BookingFormStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={clsx("grid grid-cols-1 gap-6", !isEdit && "lg:grid-cols-4")}>
      {/* Stepper Sidebar - Hidden in Edit Mode */}
      {!isEdit && (
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-6 px-2 text-text-main">Tiến trình</h3>
            <div className="flex flex-col gap-0">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = index < currentIndex;

                return (
                  <div key={step.id} className="step-item relative flex gap-4 pb-8 group">
                    {index < steps.length - 1 && (
                      <div
                        className={clsx(
                          'step-connector absolute left-[15px] top-[35px] bottom-[-15px] w-[2px] z-0',
                          isCompleted || isActive ? 'bg-primary/30' : 'bg-border'
                        )}
                      />
                    )}
                    <div
                      className={clsx(
                        'z-10 relative flex items-center justify-center size-8 rounded-full font-bold text-sm transition-all',
                        isActive
                          ? 'bg-primary text-white shadow-[0_0_0_4px_rgba(19,91,236,0.2)]'
                          : isCompleted
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-surface border-2 border-border text-text-secondary'
                      )}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="pt-1">
                      <p
                        className={clsx(
                          'text-sm leading-none mb-1',
                          isActive
                            ? 'font-bold text-text-main'
                            : isCompleted
                              ? 'font-medium text-text-secondary'
                              : 'font-medium text-text-secondary/40'
                        )}
                      >
                        {step.label}
                      </p>
                      <p
                        className={clsx(
                          'text-xs',
                          isActive ? 'text-text-secondary' : 'text-text-secondary/60'
                        )}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 bg-primary/5 rounded-xl border border-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined">info</span>
                <span className="text-sm font-bold">Lưu ý vận hành</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Kiểm tra kỹ CCCD và lịch sử thuê của khách hàng mới trước khi xác nhận booking giá trị cao.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className={clsx("space-y-6", !isEdit ? "lg:col-span-3" : "max-w-4xl mx-auto w-full")}>
        {(currentStep === 'A' || isEdit) && (
          <BookingFormStepB
            pickupTime={formData.pickupTime}
            returnTime={formData.returnTime}
            errors={errors}
            onUpdate={updateFormData}
            onAvailabilityCheck={onAvailabilityCheck || (async () => { })}
          />
        )}

        {(currentStep === 'B' || isEdit) && (
          <BookingFormStepC
            selectedCameras={formData.selectedCameras}
            tripodQuantity={formData.tripodQuantity}
            reflectorQuantity={formData.reflectorQuantity}
            otherAccessories={formData.otherAccessories}
            pickupTime={formData.pickupTime}
            returnTime={formData.returnTime}
            errors={errors}
            availableCameras={availableCameras ?? []}
            onUpdate={updateFormData}
          />
        )}

        {(currentStep === 'C' || isEdit) && (
          <BookingFormStepA
            customerName={formData.customerName}
            customerPhone={formData.customerPhone}
            customerPhone2={formData.customerPhone2}
            platforms={formData.platforms}
            errors={errors}
            existingCustomer={existingCustomer}
            onUpdate={updateFormData}
            onSearchCustomer={onSearchCustomer || (async () => null)}
          />
        )}

        {(currentStep === 'D' || isEdit) && (
          <BookingFormStepD
            depositType={formData.depositType}
            depositAmount={formData.depositAmount}
            cccdName={formData.cccdName}
            hasVNeID={formData.hasVNeID}
            pickupTime={formData.pickupTime}
            returnTime={formData.returnTime}
            pickupLocation={formData.pickupLocation}
            pickupFee={formData.pickupFee}
            returnLocation={formData.returnLocation}
            returnFee={formData.returnFee}
            totalRentalFee={formData.totalRentalFee}
            extraPriceTotal={formData.extraPriceTotal}
            isManualFee={formData.isManualFee}
            manualTotalRentalFee={formData.manualTotalRentalFee}
            hasDiscount={formData.hasDiscount}
            discountPercent={formData.discountPercent}
            discountReason={formData.discountReason}
            finalFee={formData.finalFee}
            createdBy={formData.createdBy}
            notes={formData.notes}
            errors={errors}
            onUpdate={updateFormData}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          {!isEdit ? (
            <>
              <button
                onClick={onBack}
                disabled={currentStep === 'A'}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                  currentStep === 'A'
                    ? 'opacity-50 cursor-not-allowed text-text-secondary'
                    : 'bg-surface border border-border text-text-main hover:bg-surface-hover hover:border-primary/30 active:scale-95'
                )}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Quay lại
              </button>

              {currentStep !== 'D' ? (
                <button
                  onClick={onNext}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all"
                >
                  Tiếp theo
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              ) : (
                <button
                  onClick={onSubmit}
                  disabled={submitting}
                  className={clsx(
                    'flex items-center gap-2 px-6 py-2 rounded-lg font-bold shadow-md transition-all',
                    submitting
                      ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                      : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                  )}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>Lưu Booking</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold shadow-md transition-all h-12',
                submitting
                  ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                  : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98]'
              )}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span className="text-lg">Xác nhận cập nhật Booking</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}





