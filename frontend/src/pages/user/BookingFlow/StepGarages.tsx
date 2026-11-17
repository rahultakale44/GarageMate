/**
 * Step 2 — Nearby garage discovery and selection.
 * Fetches real garages from backend based on detected coordinates.
 * User must explicitly select a garage before continuing.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Loader2, AlertCircle, CheckCircle, ArrowRight, Clock, Wrench, RefreshCw } from 'lucide-react';
import { useBooking, BookingGarage } from '@/context/BookingContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import BookingShell from './BookingShell';

const StepGarages: React.FC = () => {
  const { location, garage: selectedGarage, setGarage, setStep } = useBooking();
  const [garages, setGarages] = useState<BookingGarage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGarages = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.GARAGES.NEARBY, {
        params: { latitude: location.latitude, longitude: location.longitude, radius: 20 },
      });
      setGarages(res.data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch nearby garages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchGarages(); }, [location?.latitude, location?.longitude]);

  const selectGarage = (g: BookingGarage) => setGarage(g);

  const handleContinue = () => {
    if (!selectedGarage) return;
    setStep('details');
  };

  const estimateETA = (dist?: number) => {
    if (!dist) return '10-20 min';
    return `${Math.ceil(dist * 3)}-${Math.ceil(dist * 5)} min`;
  };

  return (
    <BookingShell>
      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-black text-white mb-2">Garages Near You</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="truncate">{location?.locality || location?.city || location?.address}</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Finding verified garages nearby…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 rounded-xl flex items-start gap-3 mb-5"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={fetchGarages} className="text-xs text-red-400 underline mt-1">Retry</button>
            </div>
          </div>
        )}

        {/* Garage list */}
        {!loading && !error && garages.length === 0 && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No garages found nearby</p>
            <p className="text-sm text-slate-500 mb-4">Try searching in a wider area</p>
            <button onClick={fetchGarages}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-orange-400 rounded-lg"
              style={{ border: '1px solid rgba(249,115,22,0.30)' }}>
              <RefreshCw className="w-4 h-4" /> Search Again
            </button>
          </div>
        )}

        {!loading && garages.length > 0 && (
          <div className="space-y-3 mb-6">
            {garages.map((g, i) => {
              const isSelected = selectedGarage?._id === g._id;
              return (
                <motion.div key={g._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                  style={isSelected ? {
                    background: 'rgba(249,115,22,0.10)',
                    border: '2px solid rgba(249,115,22,0.50)',
                    boxShadow: '0 0 0 3px rgba(249,115,22,0.10)',
                  } : {
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onClick={() => selectGarage(g)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? 'rgba(249,115,22,0.20)' : 'rgba(255,255,255,0.06)' }}>
                      <Wrench className="w-6 h-6 text-orange-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white leading-tight truncate">{g.name}</h3>
                        {isSelected && (
                          <span className="text-2xs font-bold text-orange-300 px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(249,115,22,0.20)', border: '1px solid rgba(249,115,22,0.30)' }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-2">{g.address}</p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {g.distance !== undefined && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3" /> {g.distance.toFixed(1)} km
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" /> ETA {estimateETA(g.distance)}
                        </span>
                        {g.rating !== undefined && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-amber-300 font-semibold">{g.rating.toFixed(1)}</span>
                            <span className="text-slate-500">({g.reviewCount || 0})</span>
                          </span>
                        )}
                        {g.visitingCharge !== undefined && (
                          <span className="text-slate-400">Visit ₹{g.visitingCharge}</span>
                        )}
                        <span className="flex items-center gap-1"
                          style={{ color: g.isAvailable ? '#4ade80' : '#64748b' }}>
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: g.isAvailable ? '#4ade80' : '#475569', boxShadow: g.isAvailable ? '0 0 6px #4ade80' : 'none' }} />
                          {g.isAvailable ? 'Available' : 'Busy'}
                        </span>
                      </div>

                      {/* Service tags */}
                      {g.services && g.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {g.services.slice(0, 3).map(s => (
                            <span key={s} className="text-2xs px-2 py-0.5 rounded-full text-slate-400"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              {s}
                            </span>
                          ))}
                          {g.services.length > 3 && (
                            <span className="text-2xs text-slate-600 px-2 py-0.5">+{g.services.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Select indicator */}
                    <div className="flex-shrink-0">
                      {isSelected
                        ? <CheckCircle className="w-5 h-5 text-orange-400" />
                        : <div className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.15)' }} />
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        {selectedGarage && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: '#f97316', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              Continue with {selectedGarage.name} <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </BookingShell>
  );
};

export default StepGarages;
