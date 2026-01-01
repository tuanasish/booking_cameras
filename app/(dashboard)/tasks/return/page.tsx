'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, isToday, isPast, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatTime, formatCurrency } from '@/lib/utils/format';
import ReturnTaskModal from '@/components/tasks/ReturnTaskModal';
import clsx from 'clsx';

interface ReturnTask {
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
      camera: { name: string; price_6h: number };
      quantity: number;
    }>;
    booking_accessories: Array<{
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
}

export default function ReturnTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<ReturnTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ReturnTask | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [selectedDate]);

  useEffect(() => {
    if (bookingId && tasks.length > 0) {
      const task = tasks.find((t) => t.booking_id === bookingId);
      if (task && !task.completed_at) {
        setSelectedTask(task);
        setShowModal(true);
      }
    }
  }, [bookingId, tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();

      const response = await fetch(
        `/api/tasks?type=return&startDate=${start}&endDate=${end}`
      );
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleTaskClick = (task: ReturnTask) => {
    if (!task.completed_at) {
      setSelectedTask(task);
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTask(null);
    fetchTasks();
  };

  const completedTasks = tasks.filter((t) => t.completed_at);
  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const overdueTasks = pendingTasks.filter((t) => isPast(new Date(t.due_at)));

  return (
    <div className="flex h-full flex-col bg-[#0f172a]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-surface-dark px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Danh sách tác vụ trả máy</h1>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
              {tasks.length} Task
            </span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-input-dark p-1 rounded-lg border border-border-dark">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-1.5 hover:bg-surface-dark rounded-md text-text-secondary hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 [color-scheme:dark] w-[110px]"
            />
            <button
              onClick={() => setSelectedDate(new Date())}
              className={clsx(
                'px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-all',
                isToday(selectedDate)
                  ? 'bg-primary text-white'
                  : 'bg-surface-dark text-text-secondary hover:text-white'
              )}
            >
              Hôm nay
            </button>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="p-1.5 hover:bg-surface-dark rounded-md text-text-secondary hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-dark rounded-xl border border-border-dark p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">
                  Tổng tasks
                </p>
                <p className="text-2xl font-bold text-white">{tasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">task</span>
              </div>
            </div>

            <div className="bg-surface-dark rounded-xl border border-rose-500/30 p-5 flex items-center justify-between shadow-lg ring-1 ring-rose-500/5">
              <div>
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-1">
                  Quá hạn
                </p>
                <p className="text-2xl font-bold text-rose-500">{overdueTasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <span className="material-symbols-outlined text-rose-500 text-[20px]">warning</span>
              </div>
            </div>

            <div className="bg-surface-dark rounded-xl border border-emerald-500/30 p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                  Hoàn thành
                </p>
                <p className="text-2xl font-bold text-emerald-500">{completedTasks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-text-secondary">Đang tải tác vụ...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-surface-dark rounded-2xl border border-border-dark/50 border-dashed">
              <span className="material-symbols-outlined text-[64px] text-text-secondary/20 mb-4">
                assignment_turned_in
              </span>
              <p className="text-white font-bold">Không có tác vụ trả máy</p>
              <p className="text-xs text-text-secondary mt-1">Hệ thống chưa ghi nhận tác vụ nào cho ngày này.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="size-2 rounded-full bg-rose-500"></span>
                    <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                      Quá hạn ({overdueTasks.length})
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {overdueTasks.map((task) => (
                      <ReturnTaskCard
                        key={task.id}
                        task={task}
                        isOverdue
                        onClick={() => handleTaskClick(task)}
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
                        <ReturnTaskCard
                          key={task.id}
                          task={task}
                          onClick={() => handleTaskClick(task)}
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
                      <ReturnTaskCard key={task.id} task={task} isCompleted />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Return Task Modal */}
      {showModal && selectedTask && (
        <ReturnTaskModal
          task={selectedTask}
          isOpen={showModal}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

function ReturnTaskCard({
  task,
  isOverdue = false,
  isCompleted = false,
  onClick,
}: {
  task: ReturnTask;
  isOverdue?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}) {
  const platformIcons: Record<string, string> = {
    IG: 'photo_camera',
    ZL: 'chat',
    TT: 'video_library',
    FB: 'social_leaderboard',
    VL: 'storefront',
  };

  const isLate = isPast(new Date(task.due_at)) && !isCompleted;
  const hoursLate = isLate
    ? differenceInHours(new Date(), new Date(task.due_at))
    : 0;

  return (
    <div
      className={clsx(
        'group bg-surface-dark rounded-xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm',
        isOverdue && 'border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/5',
        isCompleted && 'opacity-60 grayscale-[0.2] border-border-dark',
        !isCompleted && !isOverdue && 'border-border-dark hover:border-primary/50 hover:bg-primary/5'
      )}
      onClick={!isCompleted ? onClick : undefined}
      style={{ cursor: isCompleted ? 'default' : 'pointer' }}
    >
      <div className="flex-1 space-y-4 w-full">
        {/* Top: Customer & Platform */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                {task.booking.customer.name}
              </h3>
              <p className="text-[11px] text-text-secondary mt-0.5">{task.booking.customer.phone}</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {task.booking.customer.platforms?.map((p) => (
              <span
                key={p}
                title={p}
                className="size-7 rounded bg-[#0f172a] border border-border-dark flex items-center justify-center text-text-secondary"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {platformIcons[p] || 'link'}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Mid: Equipment */}
        <div className="flex flex-wrap gap-2">
          {task.booking.booking_items?.map((item, idx) => (
            <div
              key={idx}
              className="px-2 py-1 rounded bg-input-dark border border-border-dark text-[10px] text-text-secondary flex items-center gap-1.5"
            >
              <span className="font-bold text-white tracking-widest">{item.quantity}x</span>
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
            <span className="material-symbols-outlined text-rose-500 text-[18px]">schedule</span>
            <span className="text-xs font-bold text-white">{formatTime(task.due_at)}</span>
          </div>

          {task.location && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-[18px]">location_on</span>
              <span className="text-xs text-text-secondary">{task.location}</span>
            </div>
          )}

          {task.booking.deposit_type === 'cccd' && task.booking.cccd_name && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              <span className="material-symbols-outlined text-amber-500 text-[16px]">id_card</span>
              <span className="text-[10px] font-bold text-amber-500">{task.booking.cccd_name}</span>
            </div>
          )}

          {isLate && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Trễ {hoursLate}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: CTA & Price */}
      <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto shrink-0">
        {!isCompleted ? (
          <>
            <div className="text-right">
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mb-1">Cần thanh toán</p>
              <p className="text-lg font-bold text-white tracking-tight">
                {formatCurrency(
                  task.booking.final_fee +
                  task.booking.late_fee +
                  task.booking.total_delivery_fee
                )}
              </p>
            </div>
            <button className="px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              XỬ LÝ TRẢ MÁY
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Đã hoàn thành
          </div>
        )}
      </div>
    </div>
  );
}
