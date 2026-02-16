import React from 'react';
import { useAppStore } from '../store';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Brain,
} from 'lucide-react';
import type { Page } from '../types';

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    page: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
  },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentPage, setPage } = useAppStore();
  const { user, logout } = useAuthStore();

  const firstName =
    user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* ───── Sidebar ───── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border/30">
          <div className="p-2 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Flow State</h1>
            <p className="text-[10px] text-muted-foreground leading-none">
              AI Focus Co-Pilot
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left',
                currentPage === item.page
                  ? 'bg-linear-to-r from-violet-600/20 to-indigo-600/10 text-violet-400 border border-violet-500/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  currentPage === item.page
                    ? 'text-violet-400'
                    : 'text-muted-foreground'
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-border/30">
          <div className="text-[10px] text-muted-foreground text-center">
            <p>Flow State v1.0.0-beta</p>
            <p>© 2026 SeobiLabs</p>
          </div>
        </div>
      </aside>

      {/* ───── Main Content ───── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          {/* Page Title */}
          <div>
            <h2 className="text-lg font-semibold capitalize tracking-tight">
              {currentPage}
            </h2>
          </div>

          {/* User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-md ring-2 ring-background">
                {firstName.charAt(0)}
              </div>
              <span className="text-sm font-medium">
                {firstName}
              </span>
            </div>

            <div className="w-px h-6 bg-border/50" />

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-0 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};
