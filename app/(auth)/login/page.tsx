'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { useTheme } from '@/lib/context/ThemeContext';

type TabType = 'admin' | 'employee';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('admin');
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [employeeForm, setEmployeeForm] = useState({ email: '' });
  const [adminError, setAdminError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', adminForm.username)
        .eq('password_hash', adminForm.password)
        .single();

      if (error) {
        console.error('Admin login error:', error);
        if (error.code === 'PGRST116') {
          setAdminError('Tên đăng nhập hoặc mật khẩu không chính xác');
        } else {
          setAdminError(`Lỗi: ${error.message || 'Không thể kết nối database'}`);
        }
        return;
      }

      if (!data) {
        setAdminError('Tên đăng nhập hoặc mật khẩu không chính xác');
        return;
      }

      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        name: data.name,
        role: 'admin'
      }));

      window.location.href = '/calendar';
    } catch (error: any) {
      console.error('Admin login exception:', error);
      setAdminError(`Đã xảy ra lỗi: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError('');
    setEmployeeLoading(true);

    try {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', employeeForm.email)
        .eq('is_active', true)
        .single();

      if (employeeError) {
        console.error('Employee check error:', employeeError);
        if (employeeError.code === 'PGRST116') {
          setEmployeeError('Email không tồn tại hoặc chưa được kích hoạt');
        } else {
          setEmployeeError(`Lỗi: ${employeeError.message || 'Không thể kết nối database'}`);
        }
        return;
      }

      if (!employee) {
        setEmployeeError('Email không tồn tại hoặc chưa được kích hoạt');
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: employeeForm.email,
        options: {
          emailRedirectTo: `${window.location.origin}/calendar`,
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        setEmployeeError(`Không thể gửi email: ${authError.message || 'Vui lòng thử lại'}`);
        return;
      }

      localStorage.setItem('pendingEmployee', JSON.stringify({
        email: employeeForm.email,
        name: employee.name,
      }));

      alert('Đã gửi link đăng nhập đến email của bạn. Vui lòng kiểm tra hộp thư.');
    } catch (error: any) {
      console.error('Employee login exception:', error);
      setEmployeeError(`Đã xảy ra lỗi: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setEmployeeLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background font-display text-text-main antialiased overflow-x-hidden selection:bg-primary/30 selection:text-white">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-full opacity-50 dark:opacity-30"></div>
      </div>

      <div className="flex h-full grow flex-col relative z-10 justify-center items-center p-4 md:p-8">
        {/* Header / Logo Section */}
        <div className="flex flex-col items-center justify-center text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <div className="mb-6 relative h-16 w-40">
            <Image
              src={theme === 'dark' ? '/logo/darklogo.png' : '/logo/lightlogo.png'}
              alt="Kantra Camera"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-text-secondary text-base md:text-lg font-normal">
            Hệ thống quản lý booking cho thuê máy ảnh
          </p>
        </div>

        {/* Login Card with Tabs */}
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl border border-border shadow-xl overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-border bg-background/50">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-sm transition-all relative ${activeTab === 'admin'
                  ? 'text-primary bg-surface'
                  : 'text-text-secondary hover:text-text-main hover:bg-surface/50'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span>Quản trị viên</span>
                {activeTab === 'admin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('employee')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-sm transition-all relative ${activeTab === 'employee'
                  ? 'text-emerald-500 bg-surface'
                  : 'text-text-secondary hover:text-text-main hover:bg-surface/50'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">badge</span>
                <span>Nhân viên</span>
                {activeTab === 'employee' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {/* Admin Tab */}
              {activeTab === 'admin' && (
                <form className="flex flex-col gap-5" onSubmit={handleAdminLogin}>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-secondary">Email hoặc Tên đăng nhập</span>
                    <input
                      className="w-full h-12 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-text-main placeholder:text-text-secondary/50 px-4 transition-colors outline-none"
                      placeholder="admin@kantra.com"
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-secondary">Mật khẩu</span>
                    <div className="relative">
                      <input
                        className="w-full h-12 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-text-main placeholder:text-text-secondary/50 px-4 pr-12 transition-colors outline-none"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-4 flex items-center text-text-secondary hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {adminError && (
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs mt-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{adminError}</span>
                      </div>
                    )}
                  </label>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        className="rounded bg-background border-border focus:ring-offset-0 focus:ring-primary text-primary w-4 h-4"
                        type="checkbox"
                      />
                      <span className="text-xs text-text-secondary">Ghi nhớ</span>
                    </label>
                    <a className="text-xs font-medium text-primary hover:text-blue-400 underline decoration-transparent hover:decoration-current transition-all" href="#">
                      Quên mật khẩu?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full flex items-center justify-center h-12 rounded-lg bg-primary hover:bg-blue-600 active:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {adminLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                  </button>
                </form>
              )}

              {/* Employee Tab */}
              {activeTab === 'employee' && (
                <div className="flex flex-col">
                  <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    Nhập email công việc của bạn để nhận liên kết đăng nhập một lần (Magic Link). Không cần mật khẩu.
                  </p>

                  <form className="flex flex-col gap-5" onSubmit={handleEmployeeLogin}>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-text-secondary">Email công việc</span>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        </span>
                        <input
                          className="w-full h-12 rounded-lg bg-background border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-text-main placeholder:text-text-secondary/50 pl-11 pr-4 transition-colors outline-none"
                          placeholder="nhanvien@kantra.com"
                          type="email"
                          value={employeeForm.email}
                          onChange={(e) => setEmployeeForm({ email: e.target.value })}
                          required
                        />
                      </div>
                      {employeeError && (
                        <div className="flex items-center gap-1.5 text-rose-500 text-xs mt-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{employeeError}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-text-secondary/60 flex items-start gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Chỉ email đã được Admin cấp quyền mới có thể truy cập.
                      </p>
                    </label>

                    <button
                      type="submit"
                      disabled={employeeLoading}
                      className="w-full flex items-center justify-center h-12 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      <span className="mr-2">{employeeLoading ? 'Đang gửi...' : 'Gửi link đăng nhập'}</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col gap-4 text-center">
          <p className="text-text-secondary text-xs">
            © 2024 Kantra Camera Inc. Version 2.0.5
          </p>
          <div className="flex justify-center gap-6">
            <a className="text-xs text-text-secondary hover:text-text-main transition-colors" href="#">
              Điều khoản sử dụng
            </a>
            <a className="text-xs text-text-secondary hover:text-text-main transition-colors" href="#">
              Chính sách bảo mật
            </a>
            <a className="text-xs text-text-secondary hover:text-text-main transition-colors" href="#">
              Hỗ trợ kỹ thuật
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
