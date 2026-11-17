/**
 * Step 6 — Booking confirmed.
 * Shows success animation, booking ID, garage details, timeline.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, MapPin, Car, Wrench, Store, IndianRupee,
  Navigation, ArrowRight, Clock,
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';

const TIMELINE = [
  { label: 'Payment Confirmed', done: true },
  { label: 'Request Sent to Garage', done: true },
  { label: 'Garage Confirmation', done: false },
  { label: 'Mechanic Assigned', done: false },
  { label: 'Mechanic On The Way', done: false },
  { label: 'Assistance Completed', done: false },
];

const StepConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { confirmation, reset } = useBooking();

  if (!confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1a' }}>
        <div className="text-center">
          <p className="text-slate-400">No confirmation data.</p>
          <button onClick={() => navigate('/user/dashboard')} className="text-orange-400 mt-3 text-sm underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleTrack = () => {
    reset();
    navigate(`/user/requests/${confirmation.requestId}`);
  };

  const handleDashboard = () => {
    reset();
    navigate('/user/dashboard');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1a' }}>
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              style={{ background: 'rgba(249,115,22,0.3)' }}
            />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 8px 32px rgba(249,115,22,0.45)' }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-display font-black text-white mb-3">
            Your Assistance Request Has Been Sent!
          </h1>
          <p className="text-slate-400 leading-relaxed mb-2">
            The selected garage has received your request. Please stay at your location and keep your phone available.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <Navigation className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-sm font-bold text-orange-300">Mechanic is arriving at your spot soon. Be ready!</span>
          </div>
        </motion.div>

        {/* Booking details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl mb-5" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Booking Confirmed</p>
              {confirmation.isDemoPayment && (
                <span className="text-2xs font-bold text-yellow-300 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.25)' }}>
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-mono mt-1">ID: {confirmation.requestId.slice(-10).toUpperCase()}</p>
          </div>

          <div className="px-5 py-2">
            {[
              { icon: <Store className="w-4 h-4 text-orange-400" />, label: 'Garage', value: confirmation.garageName },
              ...(confirmation.garagePhone ? [{ icon: <Clock className="w-4 h-4 text-orange-400" />, label: 'Contact', value: confirmation.garagePhone }] : []),
              { icon: <Car className="w-4 h-4 text-orange-400" />, label: 'Vehicle', value: confirmation.vehicleName },
              { icon: <Wrench className="w-4 h-4 text-orange-400" />, label: 'Issue', value: confirmation.issueCategory },
              { icon: <MapPin className="w-4 h-4 text-orange-400" />, label: 'Location', value: confirmation.address || 'As provided' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.10)' }}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-white break-words">{value}</p>
                </div>
              </div>
            ))}
            {/* Payment */}
            <div className="flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <IndianRupee className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-black text-white">₹{confirmation.amount}</span>
                  <span className="text-xs font-bold text-green-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }}>
                    {confirmation.isDemoPayment ? 'DEMO PAID' : 'PAID'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono mt-0.5">Ref: {confirmation.paymentRef.slice(-12)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 mb-7" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Request Timeline</p>
          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={item.done
                      ? { background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.4)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {item.done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: item.done ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)', minHeight: '20px' }} />
                  )}
                </div>
                <p className={`text-sm pb-4 leading-tight ${item.done ? 'text-white font-semibold' : 'text-slate-600'}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="space-y-3">
          <button onClick={handleTrack}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white"
            style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
            Track My Assistance <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={handleDashboard}
            className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default StepConfirmation;
