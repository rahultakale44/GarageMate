/**
 * Step 5 — Payment.
 * Tries Razorpay checkout first; falls back to labelled DEMO MODE simulation.
 * Backend independently enforces demo mode (NODE_ENV=development check).
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Loader2, Store, Shield, AlertCircle,
  CheckCircle, Zap, Info,
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import BookingShell from './BookingShell';

declare global {
  interface Window { Razorpay: any; }
}

const ISSUE_LABELS: Record<string, string> = {
  TYRE_PUNCTURE: 'Tyre Puncture', DEAD_BATTERY: 'Battery Jump-Start',
  VEHICLE_NOT_STARTING: 'Vehicle Not Starting', FUEL_SHORTAGE: 'Fuel Delivery',
  ENGINE_OVERHEATING: 'Engine Overheating', BRAKE_ISSUE: 'Brake Repair',
  ELECTRICAL_ISSUE: 'Electrical Repair', TOWING_REQUIRED: 'Towing Service',
  MINOR_MECHANICAL: 'Minor Mechanical', OTHER: 'Other Emergency',
};

type PayState = 'idle' | 'creating' | 'awaiting' | 'verifying' | 'success' | 'failed';

const StepPayment: React.FC = () => {
  const { garage, details, draftRequestId, setDemoOrder, setConfirmation, setStep } = useBooking();
  const [payState, setPayState] = useState<PayState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV;

  // Check if Razorpay JS SDK is loaded and key is configured
  useEffect(() => {
    const hasKey = !!(import.meta.env.VITE_RAZORPAY_KEY_ID);
    const hasSDK = typeof window.Razorpay !== 'undefined';
    setRazorpayAvailable(hasKey && hasSDK);
  }, []);

  // ── RAZORPAY FLOW ───────────────────────────────────────────────────────────
  const handleRazorpayPay = async () => {
    if (!draftRequestId) return;
    setPayState('creating');
    setError(null);
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.CREATE_BOOKING_ORDER, { requestId: draftRequestId });
      const { orderId, amount, currency, paymentId: paymentDbId } = res.data.data;
      setPayState('awaiting');

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'GarageMate',
        description: `Assistance Booking — ${garage?.name}`,
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayState('verifying');
          try {
            const verRes = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.VERIFY, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentDbId,
            });
            setPayState('success');
            setConfirmation({
              requestId: draftRequestId,
              paymentId: paymentDbId,
              paymentRef: response.razorpay_payment_id,
              amount: 99,
              isDemoPayment: false,
              garageName: garage?.name || '',
              garagePhone: garage?.phone,
              vehicleName: details?.vehicleName || '',
              issueCategory: ISSUE_LABELS[details?.issueCategory || ''] || '',
              address: verRes.data?.data?.address || '',
            });
            setTimeout(() => setStep('confirmation'), 1200);
          } catch {
            setPayState('failed');
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => { setPayState('idle'); },
        },
        theme: { color: '#f97316' },
      });
      rzp.open();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Failed to initiate payment');
      setError(msg);
      setPayState('failed');
    }
  };

  // ── DEMO PAYMENT FLOW ───────────────────────────────────────────────────────
  const handleDemoPay = async () => {
    if (!draftRequestId) return;
    setPayState('creating');
    setError(null);
    try {
      // 1. Create demo order
      const orderRes = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.DEMO_CREATE_ORDER, { requestId: draftRequestId });
      const { orderId, paymentId: paymentDbId } = orderRes.data.data;
      setDemoOrder(orderId, paymentDbId);
      setPayState('awaiting');

      // Brief simulated "processing" delay
      await new Promise(r => setTimeout(r, 1800));
      setPayState('verifying');
      await new Promise(r => setTimeout(r, 900));

      // 2. Confirm demo payment on backend
      const confirmRes = await axiosInstance.post(API_ENDPOINTS.PAYMENTS.DEMO_CONFIRM, { paymentDbId });
      const reqData = confirmRes.data?.data?.request;

      setPayState('success');
      setConfirmation({
        requestId: draftRequestId,
        paymentId: paymentDbId,
        paymentRef: orderId,
        amount: 99,
        isDemoPayment: true,
        garageName: garage?.name || '',
        garagePhone: garage?.phone,
        vehicleName: details?.vehicleName || '',
        issueCategory: ISSUE_LABELS[details?.issueCategory || ''] || '',
        address: reqData?.address || '',
      });

      setTimeout(() => setStep('confirmation'), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Demo payment failed');
      setError(msg);
      setPayState('failed');
    }
  };

  const stateLabel: Record<PayState, string> = {
    idle: '',
    creating: 'Creating payment order…',
    awaiting: 'Processing payment…',
    verifying: 'Verifying with server…',
    success: 'Payment confirmed!',
    failed: 'Payment failed',
  };

  return (
    <BookingShell>
      <div className="max-w-md mx-auto px-5 py-8">

        {/* Amount header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <IndianRupee className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-3xl font-display font-black text-white mb-1">₹99.00</h1>
          <p className="text-slate-400 text-sm">Assistance Booking Fee</p>
        </motion.div>

        {/* Booking mini-summary */}
        <div className="rounded-2xl p-5 mb-5 space-y-3"
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Store className="w-4 h-4" /> Garage
            </div>
            <span className="font-semibold text-white text-right truncate max-w-[180px]">{garage?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-4 h-4" /> Issue
            </div>
            <span className="font-semibold text-white">{ISSUE_LABELS[details?.issueCategory || ''] || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" /> Payment
            </div>
            <span className="font-semibold text-white">Secure · Encrypted</span>
          </div>
        </div>

        {/* State feedback */}
        {payState !== 'idle' && payState !== 'failed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={payState === 'success'
              ? { background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }
              : { background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)' }}>
            {payState === 'success'
              ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <Loader2 className="w-5 h-5 text-orange-400 animate-spin flex-shrink-0" />}
            <span className={`text-sm font-semibold ${payState === 'success' ? 'text-green-300' : 'text-orange-300'}`}>
              {stateLabel[payState]}
            </span>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => { setError(null); setPayState('idle'); }}
                className="text-xs text-red-400 underline mt-1">Try again</button>
            </div>
          </div>
        )}

        {/* Pay buttons */}
        {(payState === 'idle' || payState === 'failed') && (
          <div className="space-y-3">
            {/* Razorpay button */}
            {razorpayAvailable && (
              <button onClick={handleRazorpayPay}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white"
                style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
                Pay ₹99 with Razorpay
              </button>
            )}

            {/* Demo simulation */}
            {isDemoMode && (
              <>
                {razorpayAvailable && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="text-xs text-slate-600">or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}

                <button onClick={handleDemoPay}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all"
                  style={!razorpayAvailable
                    ? { background: '#f97316', color: '#fff', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {!razorpayAvailable ? '⚡ Simulate Demo Payment — ₹99' : 'Demo Simulation'}
                </button>

                <div className="p-3 rounded-lg flex items-start gap-2"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.18)' }}>
                  <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300 leading-relaxed">
                    <span className="font-bold">Demo Mode — Simulation Only.</span>{' '}
                    No real money is charged. This creates a test booking for showcase purposes.
                  </p>
                </div>
              </>
            )}

            {!razorpayAvailable && !isDemoMode && (
              <div className="p-4 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                Payment is not configured. Please contact the administrator.
              </div>
            )}
          </div>
        )}

        <button onClick={() => setStep('summary')}
          className="w-full mt-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to Summary
        </button>
      </div>
    </BookingShell>
  );
};

export default StepPayment;
