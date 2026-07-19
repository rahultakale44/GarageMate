import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md p-8 mx-4"
      >
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-dark-700 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-white text-center mb-2">
            Admin Portal
          </h2>
          <p className="text-dark-300 text-center mb-8">
            Secure access for administrators only
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700 border-2 border-dark-600 text-white rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="admin@garagemate.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-dark-700 border-2 border-dark-600 text-white rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</span>
              ) : (
                'Sign In as Admin'
              )}
            </button>

            <Link
              to="/get-started"
              className="block text-center text-sm text-dark-400 hover:text-dark-300 transition-colors"
            >
              Back to role selection
            </Link>
          </form>
        </div>

        <p className="text-center text-xs text-dark-500 mt-6">
          This area is restricted to authorized administrators only
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
