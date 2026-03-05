'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, isToday, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatTime, formatCurrency } from '@/lib/utils/format';
import clsx from 'clsx';

interface PickupTask {
  id: string;
  booking_id: string;
  due_at: string;
  completed_at: string | null;
  location: string | null;
  delivery_fee: number;
  booking: {
    id: string;
    customer: {
      name: string;
      phone: string;
      platforms: string[] | null;
    };
    booking_items: Array<{
      camera: { name: string };
      quantity: number;
    }>;
    booking_accessories: Array<{
      accessory_type: string;
      name: string | null;
    }>;
    payment_status: string;
    deposit_type: string;
    deposit_amount: number;
    cccd_name: string | null;
  };
}

export default function PickupTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [processingTask, setProcessingTask] = useState<string | null>(null);

  // Modal state for employee selection
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
    fetchTasks();
  }, [selectedDate]);

  useEffect(() => {
    if (bookingId && tasks.length > 0) {
      const task = tasks.find((t) => t.booking_id === bookingId);
      if (task && !task.completed_at) {
        openEmployeeModal(task.id);
      }
    }
  }, [bookingId, tasks]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();

      const response = await fetch(
        `/api/tasks?type=pickup&startDate=${start}&endDate=${end}`
      );
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEmployeeModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedEmployeeId('');
    setShowEmployeeModal(true);
  };

  const closeEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedTaskId(null);
    setSelectedEmployeeId('');
  };

  const handleConfirmPickup = async () => {
    if (!selectedTaskId || !selectedEmployeeId) return;

    setProcessingTask(selectedTaskId);
    closeEmployeeModal();

    try {
      const response = await fetch(`/api/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
          staff_id: selectedEmployeeId,
        }),
      });

      if (response.ok) {
        fetchTasks();
      } else {
        alert('Lỗi khi xác nhận nhận máy');
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Lỗi khi xác nhận nhận máy');
    } finally {
      setProcessingTask(null);
    }
  };

  const handleUndoPickup = async (taskId: string) => {
    if (processingTask) return;

    if (!confirm('Bạn có chắc muốn hoàn tác? Task sẽ chuyển về trạng thái chưa hoàn thành.')) {
      return;
    }

    setProcessingTask(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_at: null,
          staff_id: null,
        }),
      });

      if (response.ok) {
        alert('Đã hoàn tác thành công');
        fetchTasks();
      } else {
        alert('Lỗi khi hoàn tác');
      }
    } catch (error) {
      console.error('Error undoing pickup:', error);
      alert('Lỗi khi hoàn tác');
    } finally {
      setProcessingTask(null);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const completedTasks = tasks.filter((t) => t.completed_at);
  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const overdueTasks = pendingTasks.filter((t) => isPast(new Date(t.due_at)));

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex flex-col sm:flex-row h-auto sm:h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 py-4 sm:py-0 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">NHẬN MÁY</h1>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-tighter">
              {tasks.length} ĐƠN
            </span>
          </div>
        </div>

        {/* Date Selector - Centered */}
        <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-border shadow-sm">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-surface rounded-lg text-primary hover:text-blue-600 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>

          <div className="flex items-center justify-center gap-2 px-2">
            <div className="relative flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="bg-transparent border-none p-0 text-xs sm:text-sm font-bold text-text-main focus:ring-0 w-[100px] sm:w-[110px] outline-none text-center [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <button
              onClick={() => setSelectedDate(new Date())}
              className={clsx(
                'px-2 py-1 text-[9px] font-black rounded-lg uppercase transition-all tracking-tighter',
                isToday(selectedDate)
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-main'
              )}
            >
              HÔM NAY
            </button>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-surface rounded-lg text-primary hover:text-blue-600 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </button>
        </div>

        {/* Spacer for alignment on desktop */}
        <div className="hidden sm:block w-[120px]"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">
                  Tổng tasks
                </p>
                <p className="text-2xl font-bold text-text-main">{tasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">inventory_2</span>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-red-500/30 p-5 flex items-center justify-between shadow-lg ring-1 ring-red-500/5">
              <div>
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">
                  Quá hạn
                </p>
                <p className="text-2xl font-bold text-red-500">{overdueTasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-[20px]">timer_off</span>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-emerald-500/30 p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">
                  Hoàn thành
                </p>
                <p className="text-2xl font-bold text-emerald-500">{completedTasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">task_alt</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-text-secondary">Đang tải tác vụ...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-surface rounded-2xl border border-border/50 border-dashed">
              <span className="material-symbols-outlined text-[64px] text-text-secondary/20 mb-4">
                auto_awesome_motion
              </span>
              <p className="text-text-main font-bold">Không có tác vụ nhận máy</p>
              <p className="text-xs text-text-secondary mt-1">Lịch trình ngày này đang trống.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="size-2 rounded-full bg-red-500"></span>
                    <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest">
                      Quá hạn ({overdueTasks.length})
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {overdueTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOverdue
                        onConfirm={() => openEmployeeModal(task.id)}
                        processing={processingTask === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {pendingTasks.filter((t) => !isPast(new Date(t.due_at))).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="size-2 rounded-full bg-amber-500"></span>
                    <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                      Chờ xử lý ({pendingTasks.filter((t) => !isPast(new Date(t.due_at))).length})
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {pendingTasks
                      .filter((t) => !isPast(new Date(t.due_at)))
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onConfirm={() => openEmployeeModal(task.id)}
                          processing={processingTask === task.id}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="size-2 rounded-full bg-emerald-500"></span>
                    <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Đã hoàn thành ({completedTasks.length})
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isCompleted
                        onUndo={() => handleUndoPickup(task.id)}
                        processing={processingTask === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Employee Selection Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEmployeeModal} />
          <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-main">Chọn nhân viên giao máy</h3>
              <button
                onClick={closeEmployeeModal}
                className="size-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[48px] text-text-secondary/30 mb-2">person_off</span>
                <p className="text-text-secondary text-sm">Chưa có nhân viên nào</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {employees.filter(e => e.is_active !== false).map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                      selectedEmployeeId === emp.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-text-main hover:border-primary/50'
                    )}
                  >
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="text-primary font-bold">{emp.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{emp.name}</p>
                      <p className="text-xs text-text-secondary">{emp.email}</p>
                    </div>
                    {selectedEmployeeId === emp.id && (
                      <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEmployeeModal}
                className="flex-1 py-3 rounded-xl border border-border bg-background text-text-secondary font-bold text-sm hover:bg-surface transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPickup}
                disabled={!selectedEmployeeId}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                  selectedEmployeeId
                    ? 'bg-primary text-white hover:bg-blue-600 shadow-lg'
                    : 'bg-surface text-text-secondary cursor-not-allowed'
                )}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  isOverdue = false,
  isCompleted = false,
  onConfirm,
  onUndo,
  processing = false,
}: {
  task: PickupTask;
  isOverdue?: boolean;
  isCompleted?: boolean;
  onConfirm?: () => void;
  onUndo?: () => void;
  processing?: boolean;
}) {
  const router = useRouter();
  const platformIcons: Record<string, string> = {
    IG: 'photo_camera',
    ZL: 'chat',
    TT: 'video_library',
    FB: 'social_leaderboard',
    VL: 'storefront',
  };

  return (
    <div
      className={clsx(
        'group bg-surface rounded-xl border p-5 transition-all flex flex-col gap-4 shadow-sm',
        isOverdue && 'border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5',
        isCompleted && 'border-emerald-500/30 bg-emerald-500/5',
        !isCompleted && !isOverdue && 'border-border hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      {/* Completion Status Badge - Prominent at top */}
      {isCompleted && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/30">
          <span className="material-symbols-outlined text-emerald-500 text-[32px]">check_circle</span>
          <span className="text-emerald-500 font-black text-lg uppercase tracking-wider">Đã nhận máy</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-4 w-full">
          {/* Top: Customer & Platform */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[20px]">person_check</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                  {task.booking.customer.name}
                </h3>
                <p className="text-[11px] text-text-main/70 mt-0.5">{task.booking.customer.phone}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Mid: Equipment */}
        <div className="flex flex-wrap gap-2">
          {task.booking.booking_items?.map((item, idx) => (
            <div
              key={idx}
              className="px-2 py-1 rounded bg-background border border-border text-[10px] text-text-main/80 flex items-center gap-1.5"
            >
              <span className="font-bold text-text-main tracking-widest">{item.quantity}x</span>
              {item.camera.name}
            </div>
          ))}
          {task.booking.booking_accessories && task.booking.booking_accessories.length > 0 && (
            task.booking.booking_accessories.map((acc, idx) => (
              <div key={idx} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500">
                {acc.name || acc.accessory_type}
              </div>
            ))
          )}
        </div>

        {/* Bottom: Info Bar */}
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
            <span className="text-xs font-bold text-text-main">{formatTime(task.due_at)}</span>
          </div>

          {task.location && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-main/60 text-[18px]">location_on</span>
              <span className="text-xs text-text-main/80">{task.location}</span>
            </div>
          )}

          {task.delivery_fee > 0 && (
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              <span className="text-[11px]">{formatCurrency(task.delivery_fee)}</span>
            </div>
          )}

          {task.booking.payment_status === 'pending' && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Chưa cọc</span>
            </div>
          )}

          {task.booking.deposit_type === 'cccd' && task.booking.cccd_name && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="material-symbols-outlined text-amber-500 text-[16px]">id_card</span>
              <span className="text-[10px] font-bold text-amber-500">{task.booking.cccd_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: CTA */}
      <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto shrink-0">
        {!isCompleted ? (
          <button
            onClick={onConfirm}
            disabled={processing}
            className={clsx(
              'px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2',
              isOverdue
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/10'
                : 'bg-primary text-white hover:bg-blue-600 shadow-blue-500/10',
              processing && 'opacity-50 cursor-wait'
            )}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                <span>ĐANG XỬ LÝ...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                XÁC NHẬN NHẬN MÁY
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={onUndo}
              disabled={processing}
              className={clsx(
                'px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600',
                processing && 'opacity-50 cursor-wait'
              )}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  <span>ĐANG XỬ LÝ...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                  HOÀN TÁC
                </>
              )}
            </button>
          </>
        )}

        <button
          onClick={() => router.push(`/bookings/${task.booking_id}`)}
          className="px-6 py-2 rounded-lg border border-border bg-background text-text-secondary text-[11px] font-bold uppercase hover:bg-surface hover:text-text-main transition-all tracking-wider"
        >
          Chi tiết đơn
        </button>
      </div>
    </div>
  );
}
