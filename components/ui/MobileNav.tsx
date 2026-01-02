'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const mobileNavItems = [
    { href: '/dashboard', label: 'Home', icon: 'home' },
    { href: '/calendar', label: 'Lịch', icon: 'calendar_month' },
    { href: '/tasks/pickup', label: 'Nhận', icon: 'inventory_2' },
    { href: '/tasks/return', label: 'Trả', icon: 'check_circle' },
    { href: '/bookings', label: 'Đơn', icon: 'assignment' },
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-border bg-surface/80 backdrop-blur-lg md:hidden">
            {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                            isActive ? 'text-primary' : 'text-text-secondary active:text-text-main'
                        )}
                    >
                        <span className={clsx(
                            'material-symbols-outlined text-[24px]',
                            isActive && 'fill-all'
                        )}>
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium leading-none">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
