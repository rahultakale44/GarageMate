/**
 * Step 3 — Vehicle selection and issue details.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Loader2, Plus, ArrowRight, Store } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import BookingShell from './BookingShell';

interface VehicleRecord {
  _id: string; vehicleType: string; brand: string; vehicleModel: string; registrationNumber: string;
}

const ISSUE_OPTIONS = [
  { value: 'TYRE_PUNCTURE',      label: 'Tyre Puncture' },
  { value: 'DEAD_BATTERY',       label: 'Battery Jump-Start' },
  { value: 'VEHICLE_NOT_STARTING', label: 'Vehicle Not Starting' },
  { value: 'FUEL_SHORTAGE',      label: 'Fuel Delivery' },
  { value: 'ENGINE_OVERHEATING', label: 'Engine Overheating' },
  { value: 'BRAKE_ISSUE',        label: 'Brake Repair' },
  { value: 'ELECTRICAL_ISSUE',   label: 'Electrical Repair' },
  { value: 'TOWING_REQUIRED',    label: 'Towing Service' },
  { value: 'MINOR_MECHANICAL',   label: 'Minor Mechanical' },
  { value: 'OTHER',              label: 'Other Emergency' },
];

const StepDetails: React.FC = () => {
  const { garage, setDetails, setStep } = useBooking();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [issueCategory, setIssueCategory] = useState('TYRE_PUNCTURE');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingVehicles(true);
    axiosInstance.get(API_ENDPOINTS.VEHICLES.LIST)
      .then(res => {
        const v = res.data?.data || [];
        setVehicles(v);
        if (v.length > 0) setSelectedVehicleId(v[0]._id);
      })
      .catch(() => setError('Unable to load vehicles'))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleContinue = () => {
    if (!selectedVehicleId) { setError('Please select a vehicle'); return; }
    if (!issueDescription.trim()) { setError('Please describe the issue'); return; }
    const vehicle = vehicles.find(v => v._id === selectedVehicleId);
    setDetails({
      vehicleId: selectedVehicleId,
      vehicleName: vehicle ? `${vehicle.brand} ${vehicle.vehicleModel}` : 'Vehicle',
      issueCategory,
      issueDescription: issueDescription.trim(),
      issueImages: [],
      urgency,
    });
    setStep('summary');
  };

  const selectStyle = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' };
  const labelCls = 'text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block';

  return (
    <BookingShell>
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* Selected garage banner */}
        {garage && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)' }}>
            <Store className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Selected Garage</p>
              <p className="text-sm font-bold text-white">{garage.name}</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-display font-black text-white mb-6">Issue Details</h1>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Vehicle */}
          <div>
            <label className={labelCls}>Select Vehicle</label>
            {loadingVehicles ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading vehicles…
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-4 rounded-xl text-sm text-yellow-400 flex items-start gap-3"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.20)' }}>
                <Plus className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>No vehicles found. Please add one from your dashboard first.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicles.map(v => {
                  const sel = selectedVehicleId === v._id;
                  return (
                    <div key={v._id}
                      className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                      style={sel ? {
                        background: 'rgba(249,115,22,0.10)', border: '2px solid rgba(249,115,22,0.40)',
                      } : {
                        background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onClick={() => setSelectedVehicleId(v._id)}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: sel ? 'rgba(249,115,22,0.20)' : 'rgba(255,255,255,0.06)' }}>
                        <Car className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{v.brand} {v.vehicleModel}</p>
                        <p className="text-xs text-slate-500">{v.registrationNumber} · {v.vehicleType}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full flex-shrink-0"
                        style={sel
                          ? { background: '#f97316' }
                          : { border: '2px solid rgba(255,255,255,0.15)' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Issue category */}
          <div>
            <label className={labelCls}>Issue Category</label>
            <select value={issueCategory} onChange={e => setIssueCategory(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={selectStyle}>
              {ISSUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className={labelCls}>Urgency</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(u => (
                <button key={u} type="button" onClick={() => setUrgency(u)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all"
                  style={urgency === u
                    ? { background: u === 'HIGH' ? 'rgba(239,68,68,0.20)' : u === 'MEDIUM' ? 'rgba(234,179,8,0.20)' : 'rgba(34,197,94,0.15)', border: `1px solid ${u === 'HIGH' ? 'rgba(239,68,68,0.40)' : u === 'MEDIUM' ? 'rgba(234,179,8,0.40)' : 'rgba(34,197,94,0.30)'}`, color: u === 'HIGH' ? '#f87171' : u === 'MEDIUM' ? '#fbbf24' : '#4ade80' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }
                  }>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Describe the Issue</label>
            <textarea value={issueDescription} onChange={e => { setIssueDescription(e.target.value); setError(null); }}
              rows={4} placeholder="Describe what happened — e.g. 'Front left tyre punctured near Loni Kalbhor Phata, cannot drive'"
              className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 resize-none focus:outline-none"
              style={selectStyle} />
          </div>
        </div>

        {/* Continue */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <button onClick={handleContinue} disabled={!selectedVehicleId}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white transition-all disabled:opacity-40"
            style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
            Review Booking Summary <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </BookingShell>
  );
};

export default StepDetails;
