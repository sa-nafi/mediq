import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/api/auth';
import { queryClient } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoSrc from '@/assets/logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/lab-tech' },
  { icon: User, label: 'My Profile', href: '/lab-tech/profile' },
];

export function LabTechLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      queryClient.clear();
      clearAuth();
      navigate('/login');
    }
  };

  const NavContent = () => (
    <>
      <div className="flex h-18 items-center px-6">
        <div className="flex items-center gap-2.5">
          <img src={logoSrc} alt="Noor Healthcare Logo" className="h-9 w-9 object-contain" />
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[20px] font-bold text-primary tracking-tight">Noor</span>
            <span className="text-[12px] font-bold text-secondary uppercase tracking-wider">Lab</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/lab-tech'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-secondary/10 text-secondary" 
                  : "text-foreground/70 hover:bg-secondary/5 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border-light">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex h-16 items-center justify-between border-b border-border-light bg-surface px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-primary">Lab Portal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface shadow-xl md:hidden"
            >
              <div className="absolute right-4 top-4">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border-light bg-surface sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full overflow-hidden p-4 md:p-8">
        <div className="mx-auto max-w-6xl h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
