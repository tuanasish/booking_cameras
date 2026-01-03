'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { SidebarProvider } from '@/lib/context/SidebarContext';
import Sidebar from '@/components/ui/Sidebar';
import MobileNav from '@/components/ui/MobileNav';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userRole) {
      router.push('/login');
    }
  }, [userRole, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <main className="flex h-full flex-1 flex-col overflow-hidden relative pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
        <ChatbotWidget />
      </div>
    </SidebarProvider>
  );
}
