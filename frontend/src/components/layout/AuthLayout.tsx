import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Accent content shown on the left panel (desktop only) */
  panel?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

/**
 * Shared split-screen layout for all auth pages.
 * Left panel: brand accent. Right panel: form.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  panel,
  backTo = '/get-started',
  backLabel = 'Back',
}) => (
  <div className="min-h-screen flex">
    {/* ── Left panel (desktop) ──────────────────────────────────── */}
    <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 relative bg-slate-900 flex-col overflow-hidden">
      {/* Orange accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right,#f97316 1px,transparent 1px),linear-gradient(to bottom,#f97316 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 p-8">
        <Link to="/">
          <GarageMateNavLogo />
        </Link>
      </div>

      {/* Panel content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-16">
        {panel ?? (
          <div className="space-y-6 text-white">
            <h2 className="text-3xl font-display font-bold leading-tight">
              Roadside help,<br />
              <span className="text-orange-400">instantly.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Verified local garages, real-time mechanic tracking, and transparent pricing — all in one place.
            </p>
          </div>
        )}
      </div>
    </div>

    {/* ── Right panel: form ─────────────────────────────────────── */}
    <div className="flex-1 flex flex-col bg-white min-h-screen">
      {/* Mobile logo + back link */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <Link to="/">
          <GarageMateNavLogo />
        </Link>
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
      </div>

      {/* Desktop back link */}
      <div className="hidden lg:block px-10 pt-8">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
