import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight, Zap } from 'lucide-react';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const getDashboardLink = () => {
    if (!user) return '/get-started';
    if (user.role === 'USER') return '/user/dashboard';
    if (user.role === 'GARAGE_OWNER') return '/garage/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/redirect';
  };

  const navLinks = [
    { label: 'Services',     href: '#services' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pro',          href: '/pro', isRoute: true, badge: 'NEW' },
    { label: 'For Partners', href: '#partner' },
  ];

  return (
    <>
      {/* ── Navbar — fixed, solid, 80px tall ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: '#0d1526',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Orange accent strip at very top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />

        <div className="container-custom">
          <div className="flex items-center justify-between gap-8" style={{ height: '72px' }}>

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 rounded-lg"
            >
              <GarageMateNavLogo />
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/6 transition-all duration-150"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="text-2xs font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none tracking-wide">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/6 transition-all duration-150"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>

            {/* ── Desktop CTA ── */}
            <div className="hidden lg:flex items-center gap-3 ml-auto">
              {isAuthenticated ? (
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors"
                  style={{ boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
                >
                  My Dashboard <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/user/login"
                    className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/6 transition-all duration-150"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/get-started"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors"
                    style={{ boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
                  >
                    <Zap className="w-4 h-4" />
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2.5 text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-[60] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 350 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-[70] lg:hidden flex flex-col"
              style={{ background: '#0d1526', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <GarageMateNavLogo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 rounded-xl transition-all"
                    >
                      <span className="flex items-center gap-2.5">
                        {link.label}
                        {link.badge && (
                          <span className="text-2xs font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 rounded-xl transition-all"
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </a>
                  )
                )}
              </nav>

              {/* Drawer CTAs */}
              <div
                className="px-4 py-5 space-y-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {isAuthenticated ? (
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                    style={{ boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
                  >
                    My Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth/user/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full py-3 text-sm font-semibold text-slate-200 rounded-xl border border-white/15 hover:bg-white/8 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/get-started"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                      style={{ boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
