'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils/format';
import { calculateLateFee } from '@/lib/utils/booking';
import Input from '@/components/ui/Input';
import clsx from 'clsx';

interface ReturnTaskModalProps {
  task: {
    id: string;
    booking_id: string;
    due_at: string;
    location: string | null;
    booking: {
      id: string;
      customer: {
        name: string;
        phone: string;
      };
      booking_items: Array<{
        camera: { name: string; price_6h: number };
        quantity: number;
      }>;
      booking_accessories?: Array<{
        accessory_type: string;
        name: string | null;
        quantity: number;
      }>;
      payment_status: string;
      deposit_type: string;
      deposit_amount: number;
      cccd_name: string | null;
      pickup_time: string;
      return_time: string;
      final_fee: number;
      late_fee: number;
      total_delivery_fee: number;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnTaskModal({ task, isOpen, onClose }: ReturnTaskModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    staffId: '',
    returnLocation: task.location || '',
    returnDeliveryFee: 0,
    needRecovery: false,
    needUpload: false,
    memoryCardCode: '',
    cccdReturned: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ lateFeeDivisor: 5 });

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
    calculateLateFeeAmount();
  }, []);

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
        setSettings({ lateFeeDivisor: data.data[0].late_fee_divisor || 5 });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const calculateLateFeeAmount = () => {
    const now = new Date();
    const dueDate = new Date(task.due_at);

    if (now > dueDate) {
      // Calculate late fee based on first camera's price_6h
      const firstCamera = task.booking.booking_items?.[0]?.camera;
      if (firstCamera) {
        const lateFee = calculateLateFee(firstCamera.price_6h, settings.lateFeeDivisor);
        // Update booking late_fee
        setFormData((prev) => ({ ...prev }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.staffId) {
      alert('Vui lòng chọn nhân viên thu máy');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const dueDate = new Date(task.due_at);
      const isLate = now > dueDate;

      // Calculate late fee if late
      let lateFee = 0;
      if (isLate && task.booking.booking_items?.[0]?.camera) {
        const firstCamera = task.booking.booking_items[0].camera;
        lateFee = calculateLateFee(firstCamera.price_6h, settings.lateFeeDivisor);
      }

      // Update task
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: now.toISOString(),
          staff_id: formData.staffId,
          location: formData.returnLocation || task.location,
          delivery_fee: formData.returnDeliveryFee,
        }),
      });

      // Update booking
      const totalDeliveryFee = task.booking.total_delivery_fee + formData.returnDeliveryFee;
      await fetch(`/api/bookings/${task.booking_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          late_fee: lateFee,
          total_delivery_fee: totalDeliveryFee,
        }),
      });

      // Create recovery task if needed
      if (formData.needRecovery || formData.needUpload) {
        await fetch('/api/recovery-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: task.booking_id,
            memory_card_code: formData.memoryCardCode || null,
            need_recovery: formData.needRecovery,
            need_upload: formData.needUpload,
          }),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Lỗi khi xử lý trả máy');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const now = new Date();
  const dueDate = new Date(task.due_at);
  const isLate = now > dueDate;
  const hoursLate = isLate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)) : 0;

  // Calculate late fee
  let calculatedLateFee = 0;
  if (isLate && task.booking.booking_items?.[0]?.camera) {
    const firstCamera = task.booking.booking_items[0].camera;
    calculatedLateFee = calculateLateFee(firstCamera.price_6h, settings.lateFeeDivisor);
  }

  const totalFee =
    task.booking.final_fee +
    calculatedLateFee +
    task.booking.total_delivery_fee +
    formData.returnDeliveryFee;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#111318] rounded-xl border border-border-dark shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-dark">
            <div>
              <h2 className="text-xl font-bold text-white">Xử lý trả máy</h2>
              <p className="text-sm text-[#9da6b9] mt-1">
                {task.booking.customer.name} - {task.booking.customer.phone}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Booking Summary + accessories reminder */}
            <div className="bg-[#1a1f29] rounded-lg border border-border-dark p-4">
              <h3 className="text-sm font-bold text-white mb-3">Thông tin booking</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#9da6b9] mb-1">Thiết bị:</p>
                  <div className="flex flex-wrap gap-1">
                    {task.booking.booking_items?.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-[#111318] text-white text-xs"
                      >
                        {item.camera.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[#9da6b9] mb-1">Hạn trả:</p>
                  <p className="text-white font-medium">
                    {format(new Date(task.due_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
                <div>
                  <p className="text-[#9da6b9] mb-1">Phụ kiện:</p>
                  <div className="flex flex-wrap gap-1">
                    {task.booking.booking_accessories?.map((acc: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-[#111318] text-white text-xs"
                      >
                        {acc.accessory_type === 'tripod'
                          ? 'Tripod'
                          : acc.accessory_type === 'reflector'
                            ? 'Hắt sáng'
                            : acc.name || 'Khác'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CCCD Reminder */}
            {task.booking.deposit_type === 'cccd' && task.booking.cccd_name && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-yellow-400">warning</span>
                  <h3 className="text-sm font-bold text-yellow-400">Nhắc nhở trả CCCD</h3>
                </div>
                <p className="text-sm text-yellow-300">
                  Tên trên CCCD: <strong>{task.booking.cccd_name}</strong>
                </p>
                <label className="mt-3 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cccdReturned}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cccdReturned: e.target.checked,
                      }))
                    }
                    className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm text-yellow-200">
                    Đã trả lại CCCD cho khách
                  </span>
                </label>
              </div>
            )}

            {/* Late Fee Warning */}
            {isLate && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-red-400">schedule</span>
                  <h3 className="text-sm font-bold text-red-400">Trả trễ</h3>
                </div>
                <p className="text-sm text-red-300">
                  Trễ {hoursLate} giờ. Phí trả trễ: {formatCurrency(calculatedLateFee)} (không áp dụng chiết khấu)
                </p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Nhân viên thu máy <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full bg-input-dark border border-border-dark rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Địa điểm thu máy"
                icon="location_on"
                value={formData.returnLocation}
                onChange={(e) => setFormData({ ...formData, returnLocation: e.target.value })}
                placeholder={task.location || 'Nhập địa điểm thu máy'}
              />

              <Input
                label="Phí giao máy thu hồi"
                icon="local_shipping"
                type="number"
                value={formData.returnDeliveryFee.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, returnDeliveryFee: parseInt(e.target.value) || 0 })
                }
                placeholder="Nhập phí giao máy (nếu có)"
              />

              {/* Recovery Services */}
              <div className="space-y-3 pt-4 border-t border-border-dark">
                <h3 className="text-sm font-medium text-white">Dịch vụ thêm</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border-dark bg-[#1a1f29] cursor-pointer hover:bg-[#282e39] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.needRecovery}
                    onChange={(e) => setFormData({ ...formData, needRecovery: e.target.checked })}
                    className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0"
                  />
                  <span className="material-symbols-outlined text-[20px] text-[#9da6b9]">storage</span>
                  <span className="text-sm text-white flex-1">Khôi phục thẻ nhớ</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border-dark bg-[#1a1f29] cursor-pointer hover:bg-[#282e39] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.needUpload}
                    onChange={(e) => setFormData({ ...formData, needUpload: e.target.checked })}
                    className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0"
                  />
                  <span className="material-symbols-outlined text-[20px] text-[#9da6b9]">cloud_upload</span>
                  <span className="text-sm text-white flex-1">Tải ảnh lên Drive</span>
                </label>

                {(formData.needRecovery || formData.needUpload) && (
                  <Input
                    label="Mã số thẻ nhớ"
                    icon="badge"
                    value={formData.memoryCardCode}
                    onChange={(e) => setFormData({ ...formData, memoryCardCode: e.target.value })}
                    placeholder="Nhập mã số thẻ nhớ để dễ tìm lại"
                  />
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-[#1a1f29] rounded-lg border border-border-dark p-4 space-y-2">
              <h3 className="text-sm font-bold text-white mb-3">Tổng thanh toán</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9da6b9]">Phí thuê (P):</span>
                <span className="text-white">{formatCurrency(task.booking.final_fee)}</span>
              </div>
              {calculatedLateFee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9da6b9]">Phí trả trễ:</span>
                  <span className="text-red-400">{formatCurrency(calculatedLateFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9da6b9]">Phí giao máy:</span>
                <span className="text-white">
                  {formatCurrency(task.booking.total_delivery_fee + formData.returnDeliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base pt-2 border-t border-border-dark">
                <span className="text-white font-bold">Tổng cộng:</span>
                <span className="text-primary font-bold text-lg">{formatCurrency(totalFee)}</span>
              </div>
              {task.booking.deposit_amount > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border-dark">
                  <span className="text-[#9da6b9]">Đã cọc:</span>
                  <span className="text-yellow-400">
                    {task.booking.deposit_type === 'cccd'
                      ? 'CCCD'
                      : formatCurrency(task.booking.deposit_amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border-dark">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-dark bg-[#1a1f29] text-white hover:bg-[#282e39] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.staffId}
              className={clsx(
                'px-6 py-2 rounded-lg font-bold text-white transition-colors',
                submitting || !formData.staffId
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              )}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                    check_circle
                  </span>
                  Xác nhận trả máy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

