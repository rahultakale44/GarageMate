/**
 * Step 4 — Booking summary + create draft request + proceed to pay.
 * Creates the AssistanceRequest in PAYMENT_PENDING status.
 * Never marks it as paid here — payment step does that.
 */
import React, { useState } from 'react';
import { MapPin, Car, Wrench, Store, IndianRupee, Loader2, ArrowRight, Info } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import BookingShell from './BookingShell';

const ISSUE_LABELS: Record<string, string> = {
  TYRE_PUNCTURE: 'Tyre Puncture', DEAD_BATTERY: 'Battery Jump-Start',
  VEHICLE_NOT_STARTING: 'Vehicle Not Starting', FUEL_SHORTAGE: 'Fuel Delivery',
  ENGINE_OVERHEATING: 'Engine Overheating', BRAKE_ISSUE: 'Brake Repair',
  ELECTRICAL_ISSUE: 'Electrical Repair', TOWING_REQUIRED: 'Towing Service',
  MINOR_MECHANICAL: 'Minor Mechanical', OTHER: 'Other Emergency',
};

const StepSummary: React.FC = () => {
  const { location, garage, details, setDraftRequestId, setStep } = useBooking();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceed = async () => {
    if (!confirmed) { setError('Please confirm the booking details'); return; }
    if (!location || !garage || !details) return;

    setLoading(true);
    setError(null);
    try {
      // Create the assistance request with DRAFT status (payment not yet done)
      const res = await axiosInstance.post(API_ENDPOINTS.REQUESTS.CREATE, {
        vehicleId: details.vehicleId,
        issueCategory: details.issueCategory,
        issueDescription: details.issueDescription,
        issueImages: details.issueImages,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        garageId: garage._id,
        urgency: details.urgency,
      });

      const requestId = res.data?.data?._id;
      if (!requestId) throw new Error('Failed to create request');

      setDraftRequestId(requestId);
      setStep('payment');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Failed to create request');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const row = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(249,115,22,0.10)' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <BookingShell>
      <div className="max-w-lg mx-auto px-5 py-8">
        <h1 className="text-2xl font-display font-black text-white mb-6">Booking Summary</h1>

        {/* Summary card */}
        <div className="rounded-2xl mb-5" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Review your request</p>
          </div>
          <div className="px-5 py-1">
            {garage && row(<Store className="w-4 h-4 text-orange-400" />, 'Selected Garage', garage.name)}
            {location && row(<MapPin className="w-4 h-4 text-orange-400" />, 'Your Location', location.address)}
            {details && row(<Car className="w-4 h-4 text-orange-400" />, 'Vehicle', details.vehicleName)}
            {details && row(<Wrench className="w-4 h-4 text-orange-400" />, 'Issue', ISSUE_LABELS[details.issueCategory] || details.issueCategory)}
            {details && (
              <div className="py-3.5">
                <p className="text-xs text-slate-500 mb-0.5">Description</p>
                <p className="text-sm text-slate-300 leading-relaxed">{details.issueDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl mb-5" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
                <IndianRupee className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assistance Booking Fee</p>
                <p className="text-xs text-slate-600">Platform + dispatch fee</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">₹99</p>
              <p className="text-xs text-slate-600">excl. repair charges</p>
            </div>
          </div>
          <div className="px-5 py-3 mx-5 mb-4 rounded-lg flex items-start gap-2.5"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300 leading-relaxed">
              ₹99 is the platform booking fee only. Any additional repair charges will be communicated by the garage before work begins.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            {error}
          </div>
        )}

        {/* Confirm checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <div className="pt-0.5">
            <input type="checkbox" checked={confirmed} onChange={e => { setConfirmed(e.target.checked); setError(null); }}
              className="w-4 h-4 rounded accent-orange-500" />
          </div>
          <span className="text-sm text-slate-400 leading-relaxed">
            I confirm the garage and assistance details above and understand that ₹99 is the booking fee only.
          </span>
        </label>

        {/* CTA */}
        <button onClick={handleProceed} disabled={!confirmed || loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white transition-all disabled:opacity-40"
          style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating request…</>
            : <>Proceed to Pay ₹99 <ArrowRight className="w-5 h-5" /></>}
        </button>

        <button onClick={() => setStep('details')}
          className="w-full mt-3 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">
          ← Edit Details
        </button>
      </div>
    </BookingShell>
  );
};

export default StepSummary;
