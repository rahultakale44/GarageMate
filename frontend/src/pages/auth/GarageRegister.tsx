import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Store, FileText, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const availableServices = [
  'Bike Repair', 'Car Repair', 'Tyre Puncture', 'Battery Jump-Start',
  'Fuel Delivery', 'Electrical Repair', 'Engine Repair', 'Brake Repair',
  'Towing', 'Emergency Roadside Help', 'Oil Change', 'AC Repair',
];

const steps = [
  { number: 1, title: 'Owner Info',    icon: Store },
  { number: 2, title: 'Garage Info',   icon: MapPin },
  { number: 3, title: 'Services',      icon: FileText },
  { number: 4, title: 'Working Hours', icon: Clock },
];

const GarageRegister = () => {
  const navigate = useNavigate();
  const { registerGarageOwner } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ownerName: '', ownerEmail: '', ownerPhone: '', password: '',
    garageName: '', garagePhone: '', address: '', city: '', state: '', pincode: '',
    latitude: 0, longitude: 0,
    services: [] as string[],
    openingTime: '', closingTime: '', is24x7: false,
  });

  const set = (key: string, value: unknown) => setFormData((p) => ({ ...p, [key]: value }));

  const toggleService = (service: string) =>
    set('services', formData.services.includes(service)
      ? formData.services.filter((s) => s !== service)
      : [...formData.services, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await registerGarageOwner({
        ownerName: formData.ownerName, ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone, password: formData.password,
        garageName: formData.garageName, garagePhone: formData.garagePhone,
        address: formData.address, city: formData.city, state: formData.state, pincode: formData.pincode,
        latitude: formData.latitude || 18.5204, longitude: formData.longitude || 73.8567,
        services: formData.services, openingTime: formData.openingTime,
        closingTime: formData.closingTime, is24x7: formData.is24x7,
        numberOfMechanics: 1, supportedVehicleTypes: ['CAR', 'BIKE', 'SUV'],
      });
      navigate('/auth/garage/login', { state: { message: result.message, email: formData.ownerEmail } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? 'Unable to register garage';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'input-field';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container-custom flex items-center justify-between py-4">
          <Link to="/"><GarageMateLogoIcon size={42} showText={true} /></Link>
          <Link to="/auth/garage/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </header>

      <div className="container-custom max-w-2xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Register Your Garage</h1>
            <p className="text-sm text-slate-500">Join GarageMate and connect with vehicle owners in your area.</p>
          </div>

          {/* Step progress */}
          <div className="mb-10">
            <div className="flex items-center gap-0">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step > s.number ? 'bg-green-500 text-white' : step === s.number ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step > s.number ? <CheckCircle className="w-5 h-5" /> : <span>{s.number}</span>}
                    </div>
                    <span className={`text-2xs font-medium hidden sm:block ${step >= s.number ? 'text-slate-700' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.number ? 'bg-green-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1 — Owner Info */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className={labelCls}>Full Name</label><input type="text" value={formData.ownerName} onChange={(e) => set('ownerName', e.target.value)} className={inputCls} placeholder="Your full name" required /></div>
                    <div><label className={labelCls}>Email Address</label><input type="email" value={formData.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} className={inputCls} placeholder="you@example.com" required /></div>
                    <div><label className={labelCls}>Phone Number</label><input type="tel" value={formData.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} className={inputCls} placeholder="10-digit number" required /></div>
                    <div><label className={labelCls}>Password</label><input type="password" value={formData.password} onChange={(e) => set('password', e.target.value)} className={inputCls} placeholder="Min 8 characters" required /></div>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Garage Info */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className={labelCls}>Garage Name</label><input type="text" value={formData.garageName} onChange={(e) => set('garageName', e.target.value)} className={inputCls} placeholder="e.g. Patil Auto Care" required /></div>
                    <div><label className={labelCls}>Garage Phone</label><input type="tel" value={formData.garagePhone} onChange={(e) => set('garagePhone', e.target.value)} className={inputCls} placeholder="Garage contact number" required /></div>
                  </div>
                  <div><label className={labelCls}>Full Address</label><textarea value={formData.address} onChange={(e) => set('address', e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 hover:border-slate-300 resize-none transition-all" placeholder="Street, area, landmark" required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className={labelCls}>City</label><input type="text" value={formData.city} onChange={(e) => set('city', e.target.value)} className={inputCls} placeholder="City" required /></div>
                    <div><label className={labelCls}>State</label><input type="text" value={formData.state} onChange={(e) => set('state', e.target.value)} className={inputCls} placeholder="State" required /></div>
                    <div><label className={labelCls}>Pincode</label><input type="text" value={formData.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputCls} placeholder="6-digit" required /></div>
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Services */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                  <p className="text-sm text-slate-500 mb-4">Select the services your garage provides.</p>
                  <div className="flex flex-wrap gap-2">
                    {availableServices.map((service) => {
                      const active = formData.services.includes(service);
                      return (
                        <button key={service} type="button" onClick={() => toggleService(service)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
                            active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                          }`}>
                          {service}
                        </button>
                      );
                    })}
                  </div>
                  {formData.services.length === 0 && (
                    <p className="mt-3 text-xs text-slate-400">Select at least one service to continue.</p>
                  )}
                </motion.div>
              )}

              {/* Step 4 — Working Hours */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                    <input type="checkbox" checked={formData.is24x7} onChange={(e) => set('is24x7', e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Open 24×7</p>
                      <p className="text-xs text-slate-500">Your garage is available around the clock</p>
                    </div>
                  </label>

                  {!formData.is24x7 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Opening Time</label><input type="time" value={formData.openingTime} onChange={(e) => set('openingTime', e.target.value)} className={inputCls} /></div>
                      <div><label className={labelCls}>Closing Time</label><input type="time" value={formData.closingTime} onChange={(e) => set('closingTime', e.target.value)} className={inputCls} /></div>
                    </div>
                  )}

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
                    <p className="font-semibold mb-1">Almost done!</p>
                    <p className="text-xs">Your garage will be reviewed for verification after registration. You can begin receiving requests once approved.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 1}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {step < 4 ? (
                <button type="button" onClick={() => setStep((s) => s + 1)}
                  disabled={step === 3 && formData.services.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : <><CheckCircle className="w-4 h-4" /> Register Garage</>}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default GarageRegister;
