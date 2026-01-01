'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Input from '@/components/ui/Input';
import clsx from 'clsx';

interface Employee {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees?all=true');
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.email || !formData.name) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          is_active: true,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ email: '', name: '' });
        fetchEmployees();
      } else {
        setError(result.error || 'Lỗi khi thêm nhân viên');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Lỗi khi thêm nhân viên');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (employeeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchEmployees();
      } else {
        alert('Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên "${employeeName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEmployees();
      } else {
        alert('Lỗi khi xóa nhân viên');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Lỗi khi xóa nhân viên');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-main">Quản lý nhân viên</h1>
          <p className="text-sm text-text-secondary mt-1">Thêm, sửa và quản lý quyền truy cập nhân viên</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm nhân viên
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary mb-4">Chưa có nhân viên nào</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
              >
                Thêm nhân viên đầu tiên
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-main">{employee.name}</p>
                              <p className="text-xs text-text-secondary">ID: {employee.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-main">{employee.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">
                            {format(new Date(employee.created_at), 'dd/MM/yyyy', { locale: vi })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={employee.is_active}
                                onChange={() => handleToggleActive(employee.id, employee.is_active)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDelete(employee.id, employee.name)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Xóa nhân viên"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border bg-background">
                <h2 className="text-xl font-bold text-text-main">Thêm nhân viên mới</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-surface rounded text-text-secondary hover:text-text-main transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Email nhân viên *"
                  icon="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nhanvien@example.com"
                  error={error && !formData.email ? 'Email là bắt buộc' : undefined}
                />

                <Input
                  label="Tên nhân viên *"
                  icon="person"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên nhân viên"
                  error={error && !formData.name ? 'Tên là bắt buộc' : undefined}
                />

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary">
                    Nhân viên sẽ nhận được email magic link để đăng nhập vào hệ thống.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-background">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-border/50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddEmployee}
                  disabled={submitting}
                  className={clsx(
                    'px-6 py-2 rounded-lg font-bold text-white transition-colors',
                    submitting
                      ? 'bg-slate-600 cursor-not-allowed'
                      : 'bg-primary hover:bg-blue-600'
                  )}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang thêm...</span>
                    </div>
                  ) : (
                    'Thêm nhân viên'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
