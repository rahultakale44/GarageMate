import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';

export interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number | string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  children: React.ReactNode;
  headerTitle?: string;
  headerActions?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  navItems,
  children,
  headerTitle,
  headerActions,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const activeItemLabel = navItems.find((item) => isActive(item.path))?.label ?? headerTitle ?? 'Dashboard';

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0f1a' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col sidebar-transition',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          background: '#0d1526',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-label="Sidebar navigation"
      >
        {/* Orange top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />

        {/* Logo — exact height matches top header */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            height: '73px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Link to="/" className="flex items-center">
            <GarageMateNavLogo />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" role="navigation">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={active ? {
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.25)',
                  color: '#fb923c',
                } : {
                  color: '#94a3b8',
                  border: '1px solid transparent',
                }}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; } }}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange-500' : 'text-slate-600'}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={active
                      ? { background: 'rgba(249,115,22,0.25)', color: '#fb923c' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile + logout */}
        <div className="flex-shrink-0 p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.20)', border: '1px solid rgba(249,115,22,0.30)' }}
            >
              <UserIcon className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 transition-all"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.20)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">

        {/* Top header — same height as sidebar logo block */}
        <header
          className="sticky top-0 z-30 flex-shrink-0 flex items-center gap-4 px-5"
          style={{
            height: '73px',
            background: 'rgba(13,21,38,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors hidden sm:block">
              GarageMate
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-700 hidden sm:block" />
            <span className="text-sm font-semibold text-white truncate">{activeItemLabel}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 animate-fade-in" style={{ background: '#0a0f1a' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
