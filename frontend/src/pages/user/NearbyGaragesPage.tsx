import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Navigation,
  Star,
  Truck,
  CheckCircle,
  AlertCircle,
  Phone,
  Map as MapIconLucide,
  List,
  Target,
  ExternalLink,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import NearbyGaragesMap from '@/components/maps/NearbyGaragesMap';
import { useLocation } from '@/hooks/useLocation';

interface GarageRecord {
  _id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  location?: { coordinates?: [number, number] };
  services?: string[];
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  visitingCharge?: number;
  serviceRadius?: number;
  images?: Array<{ url: string }>;
  isOpen?: boolean;
  distance?: number;
  distanceInMeters?: number;
  supportedVehicleTypes?: string[];
  openingTime?: string;
  closingTime?: string;
  is24x7?: boolean;
}

const radiusOptions = [2, 5, 10, 20];
const serviceOptions = [
  'Tyre Puncture',
  'Battery Jump-Start',
  'Car Repair',
  'Bike Repair',
  'Engine Repair',
  'Towing',
  'Emergency Roadside Help',
  'Oil Change',
  'AC Repair',
];
const vehicleOptions = ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'];

type SearchState = 'idle' | 'locating' | 'searching' | 'matching' | 'complete';

const NearbyGaragesPage = () => {
  const navigate = useNavigate();
  const { location: savedLocation, requestLocation, loading: locationLoading, error: locationError, setError } = useLocation();

  const [radius, setRadius] = useState(10);
  const [serviceType, setServiceType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [minimumRating, setMinimumRating] = useState('0');
  const [garages, setGarages] = useState<GarageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'fee'>('distance');

  const isDev = import.meta.env.DEV;

  const fetchNearbyGarages = async (lat: number, lng: number) => {
    setLoading(true);
    setSearchState('searching');
    setError(null);

    // Simulate search states for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSearchState('matching');

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.NEARBY, {
        params: {
          latitude: lat,
          longitude: lng,
          radius,
          serviceType: serviceType || undefined,
          vehicleType: vehicleType || undefined,
          openNow: openNow ? 'true' : undefined,
          availableNow: availableNow ? 'true' : undefined,
          minimumRating: minimumRating !== '0' ? minimumRating : undefined,
        },
      });
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      setGarages(response.data?.data || []);
      setSearchState('complete');
      
      // Reset to idle after animation
      setTimeout(() => setSearchState('idle'), 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to find nearby garages');
      setGarages([]);
      setSearchState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setSearchState('locating');
    const success = await requestLocation();
    if (success && savedLocation) {
      await fetchNearbyGarages(savedLocation.latitude, savedLocation.longitude);
    } else {
      setSearchState('idle');
    }
  };

  const handleRecenter = () => {
    if (savedLocation) {
      // Trigger map recenter via state change
      setSelectedGarageId(null);
    }
  };

  const sortedGarages = useMemo(() => {
    const list = [...garages];
    return list.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'fee') {
        return (a.visitingCharge || 0) - (b.visitingCharge || 0);
      }
      return (a.distance || 0) - (b.distance || 0);
    });
  }, [garages, sortBy]);

  const estimateArrival = (distanceKm: number | undefined): string => {
    if (!distanceKm) return '15-30 min';
    const minTime = Math.ceil(distanceKm * 3); // ~20 km/h in traffic
    const maxTime = Math.ceil(distanceKm * 5); // slower estimates
    return `${minTime}-${maxTime} min`;
  };

  const getDirectionsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  useEffect(() => {
    if (savedLocation) {
      void fetchNearbyGarages(savedLocation.latitude, savedLocation.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, serviceType, vehicleType, openNow, availableNow, minimumRating]);

  const searchStateMessages = {
    locating: 'Detecting your location…',
    searching: 'Finding highly rated garages near you…',
    matching: vehicleType ? 'Matching garages for your vehicle…' : 'Checking roadside assistance availability…',
    complete: 'Nearby garages found',
    idle: '',
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ background: '#0a0f1a' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <ArrowLeft className="h-4 w-4 text-slate-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Nearby Garages</h1>
            <p className="text-sm text-slate-500">Find verified garages near your location</p>
          </div>
        </div>

        {locationError && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
            {locationError}
          </div>
        )}

        {/* Search State Banner */}
        <AnimatePresence>
          {searchState !== 'idle' && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)' }}>
              {searchState === 'complete'
                ? <CheckCircle className="h-5 w-5 text-orange-400" />
                : <Loader2 className="h-5 w-5 text-orange-400 animate-spin" />}
              <span className="text-sm font-medium text-orange-300">{searchStateMessages[searchState]}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters panel */}
        <div className="rounded-2xl p-4 md:p-5 mb-6"
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {!savedLocation ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.20)' }}>
                <Target className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Enable Location</h3>
              <p className="text-sm text-slate-500 mb-6">We need your location to find nearby garages</p>
              <button type="button" onClick={handleUseCurrentLocation}
                disabled={locationLoading || searchState === 'locating'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                {locationLoading || searchState === 'locating'
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Detecting location…</>
                  : <><Navigation className="h-5 w-5" /> Use My Current Location</>}
              </button>
            </div>
          ) : (
            <>
              {/* Location row */}
              <div className="flex items-start gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{savedLocation.locality || savedLocation.city || 'Your location'}</p>
                  <p className="text-xs text-slate-500 truncate">{savedLocation.address}</p>
                </div>
                <button type="button" onClick={handleUseCurrentLocation} disabled={locationLoading || loading}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap">
                  Refresh
                </button>
              </div>

              {/* Filter dropdowns */}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
                {[
                  { label: 'Radius', value: radius, onChange: (v: string) => setRadius(Number(v)),
                    options: radiusOptions.map((o) => ({ value: String(o), label: `${o} km` })) },
                  { label: 'Service', value: serviceType, onChange: (v: string) => setServiceType(v),
                    options: [{ value: '', label: 'Any service' }, ...serviceOptions.map((o) => ({ value: o, label: o }))] },
                  { label: 'Vehicle', value: vehicleType, onChange: (v: string) => setVehicleType(v),
                    options: [{ value: '', label: 'Any vehicle' }, ...vehicleOptions.map((o) => ({ value: o, label: o }))] },
                  { label: 'Min. Rating', value: minimumRating, onChange: (v: string) => setMinimumRating(v),
                    options: [{ value: '0', label: 'Any' }, { value: '3', label: '3+' }, { value: '4', label: '4+' }, { value: '4.5', label: '4.5+' }] },
                ].map(({ label, value, onChange, options }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">{label}</label>
                    <select value={value} onChange={(e) => onChange(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                      style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}>
                      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Filter toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Open now', active: openNow, toggle: () => setOpenNow(!openNow) },
                  { label: 'Available now', active: availableNow, toggle: () => setAvailableNow(!availableNow) },
                ].map(({ label, active, toggle }) => (
                  <button key={label} type="button" onClick={toggle}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={active
                      ? { background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.30)', color: '#fb923c' }
                      : { background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8' }}>
                    {label}
                  </button>
                ))}
                <div className="flex-1" />
                <button type="button" onClick={() => setShowMap(!showMap)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8' }}>
                  {showMap ? <List className="w-4 h-4" /> : <MapIconLucide className="w-4 h-4" />}
                  {showMap ? 'List view' : 'Map view'}
                </button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'fee')}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <option value="distance">Sort by distance</option>
                  <option value="rating">Sort by rating</option>
                  <option value="fee">Sort by visit fee</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Map + Results */}
        {savedLocation && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {showMap ? (
                <div className="relative">
                  <NearbyGaragesMap
                    latitude={savedLocation.latitude} longitude={savedLocation.longitude}
                    garages={sortedGarages} onSelectGarage={(garage) => setSelectedGarageId(garage._id)}
                    selectedGarageId={selectedGarageId} searchRadius={radius} searchState={searchState}
                  />
                  <button onClick={handleRecenter}
                    className="absolute top-4 right-4 rounded-lg px-3 py-2 shadow-md flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <Target className="w-4 h-4" /> Recenter
                  </button>
                </div>
              ) : (
                <div className="flex h-[500px] items-center justify-center text-sm text-slate-500"
                  style={{ background: '#1e293b' }}>
                  <div className="text-center">
                    <MapIconLucide className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p>Switch to map view to see garages</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loading && searchState !== 'idle' ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading nearby garages…</p>
                </div>
              ) : sortedGarages.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-bold text-white mb-1">No garages found</p>
                  <p className="text-sm text-slate-500 mb-4">Try widening the search radius or removing filters</p>
                  <button type="button" onClick={() => setRadius(20)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
                    style={{ boxShadow: '0 2px 10px rgba(249,115,22,0.30)' }}>
                    Expand to 20 km
                  </button>
                </div>
              ) : (
                sortedGarages.map((garage) => {
                  const coords = garage.location?.coordinates;
                  const lat = coords?.[1];
                  const lng = coords?.[0];
                  const isSelected = selectedGarageId === garage._id;

                  return (
                    <motion.div key={garage._id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-4 cursor-pointer transition-all"
                      style={isSelected ? {
                        background: 'rgba(249,115,22,0.10)',
                        border: '1px solid rgba(249,115,22,0.30)',
                        boxShadow: '0 0 0 2px rgba(249,115,22,0.15)',
                      } : {
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onClick={() => setSelectedGarageId(garage._id)}
                    >
                      {/* Header row */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          {garage.images && garage.images[0] ? (
                            <img src={garage.images[0].url} alt={garage.name} className="w-full h-full object-cover" />
                          ) : (
                            <Truck className="w-7 h-7 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-white flex-1 leading-tight">{garage.name}</h3>
                            <span className="text-2xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.20)' }}>
                              Verified
                            </span>
                            {isDev && garage.name.toLowerCase().includes('demo') && (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Demo</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{garage.address}</p>
                          {isDev && garage.name.toLowerCase().includes('demo') && (
                            <div className="mb-2 px-2 py-1 rounded text-xs"
                              style={{ background: 'rgba(234,179,8,0.10)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.15)' }}>
                              ⚠️ Demo listing — No real mechanic
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{garage.distance?.toFixed(1)} km</span>
                            <span className="text-slate-700">•</span>
                            <span>{estimateArrival(garage.distance)}</span>
                            <span className="text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {garage.rating?.toFixed(1) || '4.5'}
                              <span className="text-slate-600">({garage.reviewCount || 0})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status row */}
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
                          style={garage.isOpen
                            ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80' }
                            : { background: 'rgba(234,179,8,0.12)', color: '#fbbf24' }}>
                          {garage.isOpen ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {garage.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 font-semibold"
                          style={garage.isAvailable
                            ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80' }
                            : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          {garage.isAvailable ? 'Available' : 'Busy'}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Visit ₹{garage.visitingCharge || 200}
                        </span>
                      </div>

                      {/* Service tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(garage.services || []).slice(0, 3).map((service) => (
                          <span key={service} className="text-xs px-2.5 py-0.5 rounded-full text-slate-400"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {service}
                          </span>
                        ))}
                        {(garage.services?.length || 0) > 3 && (
                          <span className="text-xs text-slate-600 px-2 py-0.5">+{(garage.services?.length || 0) - 3} more</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/user/garages/${garage._id}`)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          View Garage
                        </button>
                        <button
                          onClick={() => navigate('/user/emergency', {
                            state: { selectedGarageId: garage._id, selectedGarageName: garage.name,
                              latitude: savedLocation.latitude, longitude: savedLocation.longitude, address: savedLocation.address },
                          })}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors"
                          style={{ boxShadow: '0 2px 8px rgba(249,115,22,0.30)' }}>
                          Request Help
                        </button>
                        {garage.phone && (
                          <a href={`tel:${garage.phone}`} onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {lat && lng && (
                          <a href={getDirectionsUrl(lat, lng)} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyGaragesPage;
