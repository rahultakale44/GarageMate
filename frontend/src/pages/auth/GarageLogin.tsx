import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Store, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';

const GarageLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email) setFormData((p) => ({ ...p, email: state.email! }));
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await login(formData.email, formData.password);
      navigate('/redirect');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Unable to sign in';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className="space-y-6 text-white">
      <div>
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Garage Owner Portal</p>
        <h2 className="text-3xl font-display font-bold leading-tight">
          Manage your garage<br />
          <span className="text-orange-400">from anywhere.</span>
        </h2>
      </div>
      <p className="text-slate-400 leading-relaxed max-w-sm">
        Receive instant service requests, manage mechanics, create quotations, and track your earnings.
      </p>
      <ul className="space-y-3 text-sm text-slate-300">
        {['Instant service request alerts', 'Mechanic assignment & tracking', 'Digital quotation management', 'Earnings & performance analytics'].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AuthLayout panel={panel} backTo="/get-started" backLabel="Back to roles">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Garage Sign In</h1>
            <p className="text-sm text-slate-500">
              New here?{' '}
              <Link to="/auth/garage/register" className="text-orange-500 hover:text-orange-600 font-medium">
                Register your garage
              </Link>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {successMessage && (
            <div className="flex items-start gap-3 p-3.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input id="email" type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field pl-10" placeholder="garage@example.com" autoComplete="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <a href="#" className="text-xs text-orange-500 hover:text-orange-600 font-medium">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input id="password" type={showPassword ? 'text' : 'password'} required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-10 pr-10" placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-1.5">Demo Garage Account</p>
            <p className="text-xs text-amber-800"><span className="font-medium">Email:</span> demo.garage@garagemate.com</p>
            <p className="text-xs text-amber-800"><span className="font-medium">Password:</span> Demo@12345</p>
            <button type="button"
              onClick={() => setFormData({ email: 'demo.garage@garagemate.com', password: 'Demo@12345' })}
              className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 underline">
              Fill credentials →
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default GarageLogin;
