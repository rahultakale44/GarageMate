/**
 * Step 1 — Location sharing.
 * Uses the browser Geolocation API or falls back to manual entry.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import BookingShell from './BookingShell';

const StepLocation: React.FC = () => {
  const { setLocation, setStep } = useBooking();
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<{ lat: number; lng: number; address: string; locality?: string; city?: string } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualLat, setManualLat] = useState('18.4723');
  const [manualLng, setManualLng] = useState('73.9385');

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter location manually.');
      setManualMode(true);
      return;
    }
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, {
            params: { latitude, longitude },
          });
          const d = res.data?.data;
          const address = d?.displayName || d?.address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setDetected({ lat: latitude, lng: longitude, address, locality: d?.locality, city: d?.city });
        } catch {
          setDetected({ lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) {
          setError('Location permission denied. Please enter your location manually.');
        } else {
          setError('Unable to detect location. Please enter it manually.');
        }
        setManualMode(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  };

  const confirmLocation = () => {
    if (detected) {
      setLocation({ latitude: detected.lat, longitude: detected.lng, address: detected.address, locality: detected.locality, city: detected.city });
      setStep('garages');
    }
  };

  const confirmManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!manualAddress.trim() || isNaN(lat) || isNaN(lng)) {
      setError('Please enter a valid address and coordinates.');
      return;
    }
    setLocation({ latitude: lat, longitude: lng, address: manualAddress.trim() });
    setStep('garages');
  };

  return (
    <BookingShell>
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <MapPin className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-2xl font-display font-black text-white mb-3">
            Where do you need assistance?
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Share your current location to discover nearby verified garages and get roadside help.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Detected location */}
        {detected && !manualMode && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-5 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,0.15)' }}>
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">Location detected</p>
                <p className="text-sm font-semibold text-white">{detected.locality || detected.city || 'Your location'}</p>
                <p className="text-xs text-slate-400 mt-0.5 break-words">{detected.address}</p>
                <p className="text-xs text-slate-600 mt-1 font-mono">{detected.lat.toFixed(5)}, {detected.lng.toFixed(5)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Manual mode */}
        {manualMode && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Enter your location manually</p>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Address</label>
              <input value={manualAddress} onChange={e => setManualAddress(e.target.value)}
                placeholder="e.g. Near Loni Kalbhor Phata, Pune-Solapur Road"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.10)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
                <input value={manualLat} onChange={e => setManualLat(e.target.value)}
                  placeholder="18.4723"
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
                <input value={manualLng} onChange={e => setManualLng(e.target.value)}
                  placeholder="73.9385"
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>
            </div>
            <p className="text-xs text-slate-600">
              For the Loni Kalbhor demo, use: <span className="text-slate-400 font-mono">18.4723, 73.9385</span>
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!detected && !manualMode && (
            <button onClick={detectLocation} disabled={detecting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50"
              style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              {detecting ? <><Loader2 className="w-5 h-5 animate-spin" /> Detecting location…</>
                : <><Navigation className="w-5 h-5" /> Use My Current Location</>}
            </button>
          )}

          {detected && !manualMode && (
            <button onClick={confirmLocation}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              Continue with this location <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {manualMode && (
            <button onClick={confirmManual}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              Confirm Location <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {!manualMode && (
            <button onClick={() => { setManualMode(true); setDetected(null); setError(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-400 transition-colors hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
              <Edit3 className="w-4 h-4" /> Enter Location Manually
            </button>
          )}

          {manualMode && !detected && (
            <button onClick={() => { setManualMode(false); setError(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">
              Try auto-detect instead
            </button>
          )}
        </div>
      </div>
    </BookingShell>
  );
};

export default StepLocation;
