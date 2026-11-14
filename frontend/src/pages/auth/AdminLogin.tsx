import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin(formData.email, formData.password);
      navigate('/redirect');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Unable to sign in';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right,#f97316 1px,transparent 1px),linear-gradient(to bottom,#f97316 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-modal">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <GarageMateLogoIcon size={42} showText={true} />
          </div>

          {/* Icon + heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-xl font-display font-bold text-white">Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Restricted access — authorised personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input id="email" type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all"
                  placeholder="admin@garagemate.com" autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input id="password" type={showPassword ? 'text' : 'password'} required value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all"
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg">
              <p className="text-xs font-semibold text-amber-300 mb-1.5">Demo Admin Account</p>
              <p className="text-xs text-amber-200/80"><span className="font-medium">Email:</span> demo.admin@garagemate.com</p>
              <p className="text-xs text-amber-200/80"><span className="font-medium">Password:</span> Demo@12345</p>
              <button type="button"
                onClick={() => setFormData({ email: 'demo.admin@garagemate.com', password: 'Demo@12345' })}
                className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-200 underline">
                Fill credentials →
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/get-started" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Back to role selection
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
