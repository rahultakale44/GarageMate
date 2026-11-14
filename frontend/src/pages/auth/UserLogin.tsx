import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';

const UserLogin = () => {
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
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Driver Portal</p>
        <h2 className="text-3xl font-display font-bold leading-tight">
          Welcome back,<br />
          <span className="text-orange-400">let's get moving.</span>
        </h2>
      </div>
      <p className="text-slate-400 leading-relaxed max-w-sm">
        Access your vehicles, service requests, and roadside assistance history from your dashboard.
      </p>
      <ul className="space-y-3 text-sm text-slate-300">
        {['Track mechanics in real-time', 'Manage multiple vehicles', 'Transparent quotations', 'Service history'].map((f) => (
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
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-slate-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/auth/user/register" className="text-orange-500 hover:text-orange-600 font-medium">
              Create one
            </Link>
          </p>
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

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field pl-10"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <a href="#" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 mb-1.5">Demo Account</p>
            <p className="text-xs text-amber-800">
              <span className="font-medium">Email:</span> demo.user@garagemate.com
            </p>
            <p className="text-xs text-amber-800">
              <span className="font-medium">Password:</span> Demo@12345
            </p>
            <button
              type="button"
              onClick={() => setFormData({ email: 'demo.user@garagemate.com', password: 'Demo@12345' })}
              className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
            >
              Fill credentials →
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default UserLogin;
