'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
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
      // Check admin credentials in database
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', adminForm.username)
        .eq('password_hash', adminForm.password) // In production, use bcrypt
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

      // Store admin session
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        name: data.name,
        role: 'admin'
      }));

      // Use window.location to force full page reload so middleware can check localStorage
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
      // Check if employee exists and is active
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

      // Send magic link via Supabase Auth
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

      // Store employee info temporarily
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
          <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-[32px]">photo_camera</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-text-main">
            Kantra Camera
          </h1>
          <p className="text-text-secondary text-base md:text-lg font-normal">
            Hệ thống quản lý booking cho thuê máy ảnh
          </p>
        </div>

        {/* Cards Container */}
        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Admin Login */}
          <div className="group flex flex-col bg-surface rounded-2xl border border-border shadow-xl p-6 md:p-8 relative overflow-hidden transition-all">
            {/* Top decoration line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
              <h2 className="text-xl font-bold text-text-main">Quản trị viên (Admin)</h2>
            </div>

            <form className="flex flex-col gap-5 flex-1" onSubmit={handleAdminLogin}>
              {/* Email/Username */}
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

              {/* Password */}
              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-secondary">Mật khẩu</span>
                </div>
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
                {/* Error State */}
                {adminError && (
                  <div className="flex items-center gap-1.5 text-rose-500 text-xs mt-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{adminError}</span>
                  </div>
                )}
              </label>

              <div className="flex items-center justify-between mt-1">
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

              <div className="mt-auto pt-6">
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full flex items-center justify-center h-12 rounded-lg bg-primary hover:bg-blue-600 active:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Employee Login */}
          <div className="group flex flex-col bg-surface rounded-2xl border border-border shadow-xl p-6 md:p-8 transition-all">
            <div className="mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-2xl">badge</span>
              <h2 className="text-xl font-bold text-text-main">Nhân viên (Employee)</h2>
            </div>

            <div className="flex-1 flex flex-col">
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

                <div className="pt-6 mt-auto">
                  <button
                    type="submit"
                    disabled={employeeLoading}
                    className="w-full flex items-center justify-center h-12 rounded-lg border border-border hover:border-emerald-500 hover:text-emerald-500 bg-transparent text-text-main font-bold transition-all group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="mr-2">{employeeLoading ? 'Đang gửi...' : 'Gửi link đăng nhập'}</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-12 flex flex-col gap-4 text-center">
          <p className="text-text-secondary text-xs">
            © 2024 Kantra Camera Inc. Version 2.0.4
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

