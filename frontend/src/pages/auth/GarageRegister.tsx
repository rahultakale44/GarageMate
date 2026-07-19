import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, MapPin, Store, FileText, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GarageRegister = () => {
  const navigate = useNavigate();
  const { registerGarageOwner } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    garageName: '',
    garagePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    services: [] as string[],
    openingTime: '',
    closingTime: '',
    is24x7: false,
  });

  const steps = [
    { number: 1, title: 'Owner Details', icon: Store },
    { number: 2, title: 'Garage Details', icon: MapPin },
    { number: 3, title: 'Services', icon: FileText },
    { number: 4, title: 'Working Hours', icon: Clock },
  ];

  const availableServices = [
    'Bike Repair', 'Car Repair', 'Tyre Puncture', 'Battery Jump-Start',
    'Fuel Delivery', 'Electrical Repair', 'Engine Repair', 'Brake Repair',
    'Towing', 'Emergency Roadside Help', 'Oil Change', 'AC Repair'
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await registerGarageOwner({
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        password: formData.password,
        garageName: formData.garageName,
        garagePhone: formData.garagePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude || 18.5204,
        longitude: formData.longitude || 73.8567,
        services: formData.services,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        is24x7: formData.is24x7,
        numberOfMechanics: 1,
        supportedVehicleTypes: ['CAR', 'BIKE', 'SUV'],
      });
      navigate('/redirect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create garage account');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12">
      <div className="container-custom max-w-4xl">
        <Link to="/auth/garage/login" className="inline-flex items-center gap-2 text-dark-600 hover:text-primary-500 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </Link>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Register Your Garage</h1>
          <p className="text-dark-600 mb-8">Join GarageMate and grow your business</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex flex-col items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step >= s.number ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-400'}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs mt-2 text-center hidden md:block">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${step > s.number ? 'bg-primary-500' : 'bg-dark-100'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Owner Details */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Full Name</label>
                    <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Email</label>
                    <input type="email" value={formData.ownerEmail} onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Phone Number</label>
                    <input type="tel" value={formData.ownerPhone} onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Password</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Garage Details */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Garage Name</label>
                    <input type="text" value={formData.garageName} onChange={(e) => setFormData({ ...formData, garageName: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Garage Phone</label>
                    <input type="tel" value={formData.garagePhone} onChange={(e) => setFormData({ ...formData, garagePhone: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Full Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">State</label>
                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Pincode</label>
                    <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-sm text-dark-600 mb-4">Select the services your garage provides:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableServices.map((service) => (
                    <button key={service} type="button" onClick={() => toggleService(service)} className={`p-4 rounded-lg border-2 text-left transition-all ${formData.services.includes(service) ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:border-dark-300'}`}>
                      <span className="text-sm font-medium">{service}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Working Hours */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
                  <input type="checkbox" checked={formData.is24x7} onChange={(e) => setFormData({ ...formData, is24x7: e.target.checked })} className="w-5 h-5" />
                  <label className="text-sm font-medium text-dark-900">24/7 Service Available</label>
                </div>
                {!formData.is24x7 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">Opening Time</label>
                      <input type="time" value={formData.openingTime} onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">Closing Time</label>
                      <input type="time" value={formData.closingTime} onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })} className="w-full px-4 py-3 border-2 border-dark-200 rounded-lg focus:border-primary-500 focus:outline-none" required />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-dark-200">
              {step > 1 && (
                <button type="button" onClick={handlePrev} className="px-6 py-3 border-2 border-dark-200 rounded-lg font-medium hover:bg-dark-50 transition-colors">
                  Previous
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={handleNext} className="ml-auto px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="ml-auto px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 inline-flex items-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Complete Registration'}
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
