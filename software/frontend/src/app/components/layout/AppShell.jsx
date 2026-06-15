import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/app/context/SidebarContext';
import Sidebar from '@/app/components/layout/Sidebar';
import TopBar from '@/app/components/layout/TopBar';
import { Footer } from '@/app/components/Footer';

export default function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 w-full">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
