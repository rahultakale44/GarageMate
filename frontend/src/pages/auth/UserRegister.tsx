import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';

const UserRegister = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.phone.trim()) e.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) e.phone = 'Must be 10 digits';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Minimum 8 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    setSubmitError('');
    try {
      const result = await registerUser({ name: formData.name, email: formData.email, mobile: formData.phone, password: formData.password });
      navigate('/auth/user/login', { state: { message: result.message, email: formData.email } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Unable to create account';
      setSubmitError(msg);
      setFormData((p) => ({ ...p, password: '', confirmPassword: '' }));
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className="space-y-6 text-white">
      <div>
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Driver Registration</p>
        <h2 className="text-3xl font-display font-bold leading-tight">
          Join thousands of<br />
          <span className="text-orange-400">drivers across India.</span>
        </h2>
      </div>
      <p className="text-slate-400 leading-relaxed max-w-sm">
        Get instant roadside assistance, find nearby garages, and manage all your vehicles from a single dashboard.
      </p>
      <ul className="space-y-2.5 text-sm text-slate-300">
        {['Free account, no credit card needed', 'Real-time mechanic tracking', 'Transparent pricing always', 'Secure OTP-verified service'].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );

  const field = (id: string, label: string, type: string, placeholder: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
        <input id={id} name={id} type={type} value={(formData as Record<string,string>)[id]}
          onChange={handleChange}
          className={`input-field pl-10 ${extra ? 'pr-10' : ''} ${errors[id] ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
          placeholder={placeholder} />
        {extra && <span className="absolute right-3 top-1/2 -translate-y-1/2">{extra}</span>}
      </div>
      {errors[id] && <p className="text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  return (
    <AuthLayout panel={panel} backTo="/auth/user/login" backLabel="Back to login">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-7">
          <h1 className="text-2xl font-display font-bold text-slate-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Already have one?{' '}
            <Link to="/auth/user/login" className="text-orange-500 hover:text-orange-600 font-medium">Sign in</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {field('name', 'Full name', 'text', 'Your full name', <UserIcon className="w-4 h-4" />)}
          {field('email', 'Email address', 'email', 'you@example.com', <Mail className="w-4 h-4" />)}
          {field('phone', 'Mobile number', 'tel', '10-digit number', <Phone className="w-4 h-4" />)}
          {field('password', 'Password', showPassword ? 'text' : 'password', 'Minimum 8 characters', <Lock className="w-4 h-4" />,
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Toggle password">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {field('confirmPassword', 'Confirm password', showConfirmPassword ? 'text' : 'password', 'Re-enter password', <Lock className="w-4 h-4" />,
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Toggle confirm password">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default UserRegister;
