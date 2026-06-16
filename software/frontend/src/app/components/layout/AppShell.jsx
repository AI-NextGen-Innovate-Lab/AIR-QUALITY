import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/app/context/SidebarContext';
import Sidebar from '@/app/components/layout/Sidebar';
import TopBar from '@/app/components/layout/TopBar';
import { Footer } from '@/app/components/Footer';
import { cn } from '@/app/lib/utils/cn';

function AppShellLayout() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-200',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <TopBar />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <SidebarProvider>
      <AppShellLayout />
    </SidebarProvider>
  );
}
