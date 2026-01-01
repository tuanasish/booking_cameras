'use client';

import { useState, useEffect } from 'react';
import { Camera } from '@/lib/types/database';
import { calculateRentalPrice } from '@/lib/utils/booking';
import { getHoursBetween } from '@/lib/utils/date';
import clsx from 'clsx';

interface BookingFormStepCProps {
  selectedCameras: Array<{
    cameraId: string;
    camera: Camera;
    quantity: number;
  }>;
  hasTripod: boolean;
  hasReflector: boolean;
  otherAccessories: string;
  pickupTime: string;
  returnTime: string;
  errors: Record<string, string>;
  availableCameras?: Array<{
    camera_id: string;
    available_qty: number;
    name?: string;
    model_line?: string;
    price_6h?: number;
    total_qty?: number;
  }>;
  onUpdate: (updates: {
    selectedCameras?: Array<{ cameraId: string; camera: Camera; quantity: number }>;
    hasTripod?: boolean;
    hasReflector?: boolean;
    otherAccessories?: string;
  }) => void;
}

export default function BookingFormStepC({
  selectedCameras,
  hasTripod,
  hasReflector,
  otherAccessories,
  pickupTime,
  returnTime,
  errors,
  availableCameras = [],
  onUpdate,
}: BookingFormStepCProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripodAvailability, setTripodAvailability] = useState<{ available: number | null }>({
    available: null,
  });
  const [reflectorAvailability, setReflectorAvailability] = useState<{ available: number | null }>({
    available: null,
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  // Fetch accessories availability when time changes
  useEffect(() => {
    const fetchAccessoriesAvailability = async () => {
      if (!pickupTime || !returnTime) return;
      try {
        const [tripodRes, reflectorRes] = await Promise.all([
          fetch('/api/accessories/available', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickupTime,
              returnTime,
              accessoryType: 'tripod',
            }),
          }),
          fetch('/api/accessories/available', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickupTime,
              returnTime,
              accessoryType: 'reflector',
            }),
          }),
        ]);

        const tripodData = await tripodRes.json();
        const reflectorData = await reflectorRes.json();

        setTripodAvailability({
          available: tripodData.data?.available_quantity ?? null,
        });
        setReflectorAvailability({
          available: reflectorData.data?.available_quantity ?? null,
        });
      } catch (error) {
        console.error('Error fetching accessories availability:', error);
      }
    };

    fetchAccessoriesAvailability();
  }, [pickupTime, returnTime]);

  useEffect(() => {
    // Recalculate prices when time changes
    if (pickupTime && returnTime && selectedCameras.length > 0) {
      const updatedCameras = selectedCameras.map((item) => {
        const price = calculateRentalPrice(item.camera, pickupTime, returnTime);
        return {
          ...item,
          camera: { ...item.camera },
        };
      });
      onUpdate({ selectedCameras: updatedCameras });
    }
  }, [pickupTime, returnTime]);

  const fetchCameras = async () => {
    try {
      const response = await fetch('/api/cameras');
      const data = await response.json();
      setCameras(data.data || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraToggle = (camera: Camera) => {
    const existingIndex = selectedCameras.findIndex((item) => item.cameraId === camera.id);

    if (existingIndex >= 0) {
      // Remove camera
      onUpdate({
        selectedCameras: selectedCameras.filter((item) => item.cameraId !== camera.id),
      });
    } else {
      // Add camera
      const price = pickupTime && returnTime
        ? calculateRentalPrice(camera, pickupTime, returnTime)
        : camera.price_6h;

      onUpdate({
        selectedCameras: [
          ...selectedCameras,
          {
            cameraId: camera.id,
            camera,
            quantity: 1,
          },
        ],
      });
    }
  };

  const handleQuantityChange = (cameraId: string, quantity: number) => {
    if (quantity < 1) return;

    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;

    // Check available quantity
    const available = availableCameras.find((ac) => ac.camera_id === cameraId);
    const maxQuantity = available ? available.available_qty : camera.quantity;

    if (quantity > maxQuantity) {
      return; // Don't allow exceeding available quantity
    }

    const updatedCameras = selectedCameras.map((item) =>
      item.cameraId === cameraId ? { ...item, quantity } : item
    );
    onUpdate({ selectedCameras: updatedCameras });
  };

  const getAvailableQuantity = (cameraId: string): number => {
    const available = availableCameras.find((ac) => ac.camera_id === cameraId);
    if (available) return available.available_qty;

    const camera = cameras.find((c) => c.id === cameraId);
    return camera?.quantity || 0;
  };

  const isCameraSelected = (cameraId: string) => {
    return selectedCameras.some((item) => item.cameraId === cameraId);
  };

  const getSelectedQuantity = (cameraId: string) => {
    const selected = selectedCameras.find((item) => item.cameraId === cameraId);
    return selected?.quantity || 0;
  };

  const calculateSubtotal = () => {
    if (!pickupTime || !returnTime) return 0;

    return selectedCameras.reduce((sum, item) => {
      const price = calculateRentalPrice(item.camera, pickupTime, returnTime);
      return sum + price * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <section className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
      <div className="p-4 border-b border-border-dark bg-input-dark/50 flex justify-between items-center">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="flex items-center justify-center size-6 rounded bg-surface-dark border border-border-dark text-xs text-white">
            C
          </span>
          Thiết bị thuê
        </h3>
        <span className="text-xs text-red-400 font-medium">* Bắt buộc</span>
      </div>

      <div className="p-6 grid gap-6">
        {/* Camera Selection */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-secondary">
            Chọn máy ảnh <span className="text-red-500">*</span>
          </span>
          {errors.cameras && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {errors.cameras}
            </span>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cameras.length === 0 ? (
              <div className="col-span-2 p-8 text-center border border-dashed border-border-dark rounded-lg">
                <p className="text-text-secondary">Đang tải danh sách máy ảnh hoặc không có máy ảnh nào...</p>
              </div>
            ) : (
              cameras
                .filter((camera) => {
                  // If we don't have availability data yet, show everything
                  if (!availableCameras || availableCameras.length === 0) return true;

                  const availableQty = getAvailableQuantity(camera.id);
                  const isSelected = isCameraSelected(camera.id);
                  // Show if available OR if it's already selected
                  return availableQty > 0 || isSelected;
                })
                .map((camera) => {
                  const isSelected = isCameraSelected(camera.id);
                  const availableQty = getAvailableQuantity(camera.id);
                  const selectedQty = getSelectedQuantity(camera.id);
                  const isOutOfStock = availableCameras && availableCameras.length > 0 && availableQty === 0 && !isSelected;

                  return (
                    <div
                      key={camera.id}
                      className={clsx(
                        'relative p-4 rounded-lg border transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : isOutOfStock
                            ? 'border-border-dark bg-input-dark/30 opacity-50 cursor-not-allowed'
                            : 'border-border-dark bg-input-dark hover:border-[#3b4354] hover:bg-[#282e39]'
                      )}
                      onClick={() => !isOutOfStock && handleCameraToggle(camera)}
                    >
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500/20 border border-red-500/50">
                          <span className="text-xs font-medium text-red-400">Hết máy</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">{camera.name}</h4>
                          {camera.model_line && (
                            <p className="text-xs text-text-secondary mt-1">{camera.model_line}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                            <span>6h: {camera.price_6h?.toLocaleString('vi-VN')}đ</span>
                            {camera.price_24h && (
                              <span>24h: {camera.price_24h.toLocaleString('vi-VN')}đ</span>
                            )}
                          </div>
                          {availableQty > 0 && (
                            <p className="text-xs text-emerald-400 mt-2">
                              Còn {availableQty} máy
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(camera.id, selectedQty - 1);
                              }}
                              disabled={selectedQty <= 1}
                              className="size-6 rounded border border-border-dark bg-input-dark text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#282e39]"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="text-sm font-bold text-white w-6 text-center">
                              {selectedQty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(camera.id, selectedQty + 1);
                              }}
                              disabled={selectedQty >= availableQty}
                              className="size-6 rounded border border-border-dark bg-input-dark text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#282e39]"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isSelected && pickupTime && returnTime && (
                        <div className="mt-3 pt-3 border-t border-border-dark">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary">Giá thuê:</span>
                            <span className="text-white font-bold">
                              {calculateRentalPrice(camera, pickupTime, returnTime).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          {selectedQty > 1 && (
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-text-secondary">Tổng ({selectedQty} máy):</span>
                              <span className="text-primary font-bold">
                                {(calculateRentalPrice(camera, pickupTime, returnTime) * selectedQty).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Accessories */}
        <div className="flex flex-col gap-4 pt-4 border-t border-border-dark">
          <span className="text-sm font-medium text-text-secondary">Phụ kiện</span>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-dark bg-input-dark hover:bg-[#282e39] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={hasTripod}
                onChange={(e) => onUpdate({ hasTripod: e.target.checked })}
                className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
                disabled={tripodAvailability.available === 0}
              />
              <span className="material-symbols-outlined text-[20px] text-text-secondary">tripod</span>
              <span className="text-sm text-white flex-1">
                Tripod
                {tripodAvailability.available !== null && (
                  <span className="ml-2 text-xs text-text-secondary">
                    (Còn {tripodAvailability.available} cái)
                  </span>
                )}
              </span>
              {tripodAvailability.available === 0 && (
                <span className="text-xs text-red-400">
                  Tripod không còn khả dụng
                </span>
              )}
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border-dark bg-input-dark hover:bg-[#282e39] cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={hasReflector}
                onChange={(e) => onUpdate({ hasReflector: e.target.checked })}
                className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
                disabled={reflectorAvailability.available === 0}
              />
              <span className="material-symbols-outlined text-[20px] text-text-secondary">light_mode</span>
              <span className="text-sm text-white flex-1">
                Hắt sáng
                {reflectorAvailability.available !== null && (
                  <span className="ml-2 text-xs text-text-secondary">
                    (Còn {reflectorAvailability.available} cái)
                  </span>
                )}
              </span>
              {reflectorAvailability.available === 0 && (
                <span className="text-xs text-red-400">
                  Hắt sáng không còn khả dụng
                </span>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              Phụ kiện khác (nếu có)
            </label>
            <textarea
              value={otherAccessories}
              onChange={(e) => onUpdate({ otherAccessories: e.target.value })}
              placeholder="Nhập phụ kiện khác..."
              rows={2}
              className="w-full bg-input-dark border border-border-dark rounded-lg py-2 px-3 text-white text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 resize-none"
            />
          </div>
        </div>

        {/* Subtotal */}
        {selectedCameras.length > 0 && pickupTime && returnTime && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Tổng phí thuê (S):</span>
              <span className="text-lg font-bold text-white">
                {calculateSubtotal().toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

