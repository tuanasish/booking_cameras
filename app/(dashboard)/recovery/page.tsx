'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDate, formatTime } from '@/lib/utils/format';
import clsx from 'clsx';

interface RecoveryTask {
  id: string;
  booking_id: string;
  memory_card_code: string | null;
  need_recovery: boolean;
  need_upload: boolean;
  is_recovered: boolean;
  is_uploaded: boolean;
  is_link_sent: boolean;
  no_error_24h: boolean;
  created_at: string;
  completed_at: string | null;
  booking: {
    id: string;
    customer: {
      name: string;
      phone: string;
    };
  };
}

export default function RecoveryPage() {
  const [tasks, setTasks] = useState<RecoveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recovery-tasks');
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching recovery tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (
    taskId: string,
    field: 'is_recovered' | 'is_uploaded' | 'is_link_sent' | 'no_error_24h',
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/recovery-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        fetchTasks();
      } else {
        alert('Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Lỗi khi cập nhật');
    }
  };

  const handleMemoryCardCodeChange = async (taskId: string, code: string) => {
    try {
      await fetch(`/api/recovery-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory_card_code: code }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating memory card code:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa task này? Task đã hoàn thành sẽ bị xóa vĩnh viễn.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recovery-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTasks();
      } else {
        alert('Lỗi khi xóa task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Lỗi khi xóa task');
    }
  };

  const isTaskCompleted = (task: RecoveryTask) => {
    const allChecked =
      (!task.need_recovery || task.is_recovered) &&
      (!task.need_upload || task.is_uploaded) &&
      task.is_link_sent &&
      task.no_error_24h;
    return allChecked;
  };

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        task.booking.customer.name.toLowerCase().includes(query) ||
        task.booking.customer.phone.includes(query) ||
        task.booking_id.toLowerCase().includes(query) ||
        (task.memory_card_code && task.memory_card_code.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus === 'completed') {
      return isTaskCompleted(task);
    } else if (filterStatus === 'pending') {
      return !isTaskCompleted(task);
    }

    return true;
  });

  const pendingTasks = tasks.filter((t) => !isTaskCompleted(t));
  const completedTasks = tasks.filter((t) => isTaskCompleted(t));
  const overdueTasks = pendingTasks.filter((task) => {
    const createdDate = new Date(task.created_at);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated > 24 && !task.is_link_sent;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-main">Quản lý Recovery & Upload</h1>
          <p className="text-sm text-text-secondary mt-1">
            Theo dõi và xử lý dữ liệu khách hàng sau khi trả máy
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-secondary font-medium">Tổng Task Đang Xử Lý</p>
                <span className="material-symbols-outlined text-primary text-[24px]">pending_actions</span>
              </div>
              <p className="text-3xl font-bold text-text-main">{pendingTasks.length}</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-secondary font-medium">Đến Hạn Hôm Nay</p>
                <span className="material-symbols-outlined text-blue-500 text-[24px]">today</span>
              </div>
              <p className="text-3xl font-bold text-text-main">{pendingTasks.length}</p>
            </div>
            <div className="bg-surface rounded-xl border border-red-500/30 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-500 font-medium">Cảnh Báo Quá Hạn</p>
                <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
              </div>
              <p className="text-3xl font-bold text-red-500">{overdueTasks.length}</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-surface rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-secondary text-[20px]">search</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm Booking ID, Tên, SĐT, Mã thẻ nhớ..."
                  className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-text-main placeholder-text-secondary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text-secondary hover:text-text-main'
                  )}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'pending'
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text-secondary hover:text-text-main'
                  )}
                >
                  Đang xử lý
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterStatus === 'completed'
                      ? 'bg-primary text-white'
                      : 'bg-background border border-border text-text-secondary hover:text-text-main'
                  )}
                >
                  Hoàn thành
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#9da6b9]">Không có recovery task nào</p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Mã thẻ nhớ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Checklist
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTasks.map((task) => {
                      const completed = isTaskCompleted(task);
                      return (
                        <tr
                          key={task.id}
                          className={clsx(
                            'hover:bg-background transition-colors',
                            completed && 'opacity-70'
                          )}
                        >
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-text-main">
                              {task.booking_id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-text-main">{task.booking.customer.name}</p>
                              <p className="text-xs text-text-secondary">{task.booking.customer.phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              value={task.memory_card_code || ''}
                              onChange={(e) => handleMemoryCardCodeChange(task.id, e.target.value)}
                              placeholder="Nhập mã thẻ nhớ"
                              className="w-32 px-2 py-1 text-sm bg-background border border-border rounded text-text-main placeholder-text-secondary focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              {task.need_recovery && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={task.is_recovered}
                                    onChange={(e) =>
                                      handleCheckboxChange(task.id, 'is_recovered', e.target.checked)
                                    }
                                    className="rounded border-[#3b4354] bg-[#1e232e] text-primary focus:ring-0"
                                  />
                                  <span className="text-xs text-text-main group-hover:text-primary transition-colors">
                                    Đã khôi phục
                                  </span>
                                </label>
                              )}
                              {task.need_upload && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={task.is_uploaded}
                                    onChange={(e) =>
                                      handleCheckboxChange(task.id, 'is_uploaded', e.target.checked)
                                    }
                                    className="rounded border-border bg-background text-primary focus:ring-0"
                                  />
                                  <span className="text-xs text-text-main group-hover:text-primary transition-colors">
                                    Đã tải ảnh lên Drive
                                  </span>
                                </label>
                              )}
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={task.is_link_sent}
                                  onChange={(e) =>
                                    handleCheckboxChange(task.id, 'is_link_sent', e.target.checked)
                                  }
                                  className="rounded border-border bg-background text-primary focus:ring-0"
                                />
                                <span className="text-xs text-text-main group-hover:text-primary transition-colors">
                                  Đã gửi link cho khách
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={task.no_error_24h}
                                  onChange={(e) =>
                                    handleCheckboxChange(task.id, 'no_error_24h', e.target.checked)
                                  }
                                  className="rounded border-border bg-background text-primary focus:ring-0"
                                />
                                <span className="text-xs text-text-main group-hover:text-primary transition-colors">
                                  Khách không báo lỗi sau 24h
                                </span>
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-text-secondary">
                              {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {completed ? (
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                              >
                                Xóa thông tin
                              </button>
                            ) : (
                              <span className="text-xs text-[#9da6b9]">Đang xử lý...</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
