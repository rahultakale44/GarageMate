import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Store, Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';

const roles = [
  {
    type: 'user',
    icon: User,
    title: 'Driver / User',
    description: 'Find nearby garages, request roadside assistance, manage your vehicles, and track mechanics in real-time.',
    loginRoute: '/auth/user/login',
    registerRoute: '/auth/user/register',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.25)',
    accentHover: 'rgba(59,130,246,0.20)',
    iconBg: '#3b82f6',
    tag: 'Most Popular',
  },
  {
    type: 'garage',
    icon: Store,
    title: 'Garage Owner',
    description: 'Register your garage, receive service requests, assign mechanics, and manage your business earnings.',
    loginRoute: '/auth/garage/login',
    registerRoute: '/auth/garage/register',
    accentBg: 'rgba(249,115,22,0.12)',
    accentBorder: 'rgba(249,115,22,0.30)',
    accentHover: 'rgba(249,115,22,0.20)',
    iconBg: '#f97316',
    tag: 'Partner',
  },
  {
    type: 'admin',
    icon: Shield,
    title: 'Administrator',
    description: 'Verify garages, monitor services, manage users, oversee payments, and resolve complaints.',
    loginRoute: '/auth/admin/login',
    registerRoute: '/auth/admin/login',
    accentBg: 'rgba(100,116,139,0.10)',
    accentBorder: 'rgba(100,116,139,0.20)',
    accentHover: 'rgba(100,116,139,0.18)',
    iconBg: '#475569',
    tag: 'Restricted',
  },
];

const RoleSelection = () => (
  <div
    className="min-h-screen flex flex-col"
    style={{ background: 'linear-gradient(135deg,#0a0f1a 0%,#0f172a 50%,#0a0f1a 100%)' }}
  >
    {/* Grid texture */}
    <div
      className="fixed inset-0 opacity-[0.04] pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(to right,#f97316 1px,transparent 1px),linear-gradient(to bottom,#f97316 1px,transparent 1px)',
        backgroundSize: '56px 56px',
      }}
    />

    {/* Orange top accent */}
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-orange-500 z-50" />

    {/* Header */}
    <header
      className="relative z-10 flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Link to="/">
        <GarageMateNavLogo />
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
    </header>

    {/* Main */}
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
          — Choose Your Role
        </span>
        <h1 className="text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
          How would you like to{' '}
          <span className="text-orange-400">continue?</span>
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          Select your role to access the right experience.
        </p>
      </motion.div>

      {/* Role cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role, index) => (
          <motion.div
            key={role.type}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: '#1e293b',
              border: `1px solid ${role.accentBorder}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* Icon area */}
            <div
              className="px-6 pt-8 pb-6 flex flex-col items-center transition-colors duration-300"
              style={{ background: role.accentBg }}
            >
              {/* Tag */}
              <span
                className="text-2xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4"
                style={{
                  background: role.accentBorder,
                  color: role.type === 'user' ? '#93c5fd' : role.type === 'garage' ? '#fdba74' : '#94a3b8',
                }}
              >
                {role.tag}
              </span>

              {/* Icon circle */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-105"
                style={{ background: role.iconBg, boxShadow: `0 8px 24px ${role.iconBg}55` }}
              >
                <role.icon className="w-8 h-8 text-white" strokeWidth={1.75} />
              </div>

              <h2 className="text-lg font-bold text-white">{role.title}</h2>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex-1 flex flex-col">
              <p className="text-sm text-slate-400 leading-relaxed mb-7 flex-1">
                {role.description}
              </p>

              <div className="space-y-3">
                {/* Sign In */}
                <Link
                  to={role.loginRoute}
                  className="group/btn flex items-center justify-between w-full px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200"
                  style={{
                    background: role.iconBg,
                    boxShadow: `0 4px 14px ${role.iconBg}40`,
                  }}
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>

                {/* Create Account */}
                {role.type !== 'admin' && (
                  <Link
                    to={role.registerRoute}
                    className="flex items-center justify-center w-full px-5 py-3 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-200 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5"
                  >
                    Create Account
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-10 text-xs text-slate-600 text-center"
      >
        Not sure which role to pick?{' '}
        <a href="#" className="text-orange-500 hover:text-orange-400 transition-colors">Learn more</a>
      </motion.p>
    </main>
  </div>
);

export default RoleSelection;
