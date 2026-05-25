import { Outlet } from 'react-router-dom';
import Header from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

/**
 * Shared chrome: header, scrollable main, footer.
 * All primary routes render inside this layout.
 */
export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
