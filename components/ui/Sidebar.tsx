'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/lib/context/SidebarContext';
import clsx from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'pie_chart', adminOnly: true },
  { href: '/calendar', label: 'Lịch Booking', icon: 'calendar_month' },
  { href: '/bookings', label: 'Đơn thuê', icon: 'assignment' },
  { href: '/tasks/pickup', label: 'Nhận máy', icon: 'inventory_2' },
  { href: '/tasks/return', label: 'Trả máy', icon: 'inventory_2' },
  { href: '/recovery', label: 'Recovery Tasks', icon: 'task' },
  { href: '/customers', label: 'Khách hàng', icon: 'group' },
];

const adminNavItems: NavItem[] = [
  { href: '/employees', label: 'Nhân viên', icon: 'badge', adminOnly: true },
  { href: '/settings', label: 'Cài đặt', icon: 'settings', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userRole, userName, signOut } = useAuth();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  );

  return (
    <aside
      className={clsx(
        'hidden flex-col border-r border-slate-200 dark:border-surface-border bg-white dark:bg-[#151e2e] md:flex z-20 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-surface-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">photo_camera</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-none tracking-tight">Kantra</h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Operations
              </span>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'flex items-center justify-center size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <span className="material-symbols-outlined text-[20px] text-slate-500">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-dark dark:hover:text-slate-100',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Section */}
        {userRole === 'admin' && (
          <div className="mt-8">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
                Quản trị
              </h3>
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-dark dark:hover:text-slate-100',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="border-t border-slate-200 dark:border-surface-border p-2">
        <div className={clsx(
          'flex items-center gap-3 px-2 py-2.5',
          isCollapsed && 'justify-center'
        )}>
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate w-full">
                  {userName || 'User'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {userRole === 'admin' ? 'Admin' : 'Employee'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                title="Đăng xuất"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
