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
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard" className="rounded-full bg-white p-2 shadow-sm hover:bg-dark-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-dark-900">Nearby Garages</h1>
            <p className="text-sm text-dark-600">Find verified garages near your location</p>
          </div>
        </div>

        {locationError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {locationError}
          </div>
        )}

        {/* Search State Banner */}
        <AnimatePresence>
          {searchState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 flex items-center gap-3"
            >
              {searchState === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-primary-600" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              )}
              <span className="text-sm font-medium text-primary-900">
                {searchStateMessages[searchState]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="rounded-2xl border border-dark-200 bg-white p-4 md:p-6 shadow-sm mb-6">
          {!savedLocation ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Enable Location</h3>
              <p className="text-sm text-dark-600 mb-4">We need your location to find nearby garages</p>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading || searchState === 'locating'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locationLoading || searchState === 'locating' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Detecting location…
                  </>
                ) : (
                  <>
                    <Navigation className="h-5 w-5" />
                    Use My Current Location
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-4 pb-4 border-b border-dark-200">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-900">
                    {savedLocation.locality || savedLocation.city || 'Your location'}
                  </p>
                  <p className="text-xs text-dark-600 truncate">{savedLocation.address}</p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading || loading}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  Refresh
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-dark-700">Radius</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
                  >
                    {radiusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} km
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-700">Service</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
                  >
                    <option value="">Any service</option>
                    {serviceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-700">Vehicle</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
                  >
                    <option value="">Any vehicle</option>
                    {vehicleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-700">Minimum rating</label>
                  <select
                    value={minimumRating}
                    onChange={(e) => setMinimumRating(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
                  >
                    <option value="0">Any</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpenNow(!openNow)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    openNow
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-600 hover:border-dark-300'
                  }`}
                >
                  Open now
                </button>
                <button
                  type="button"
                  onClick={() => setAvailableNow(!availableNow)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    availableNow
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-600 hover:border-dark-300'
                  }`}
                >
                  Available now
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="px-4 py-2 rounded-lg border border-dark-200 text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2"
                >
                  {showMap ? <List className="w-4 h-4" /> : <MapIconLucide className="w-4 h-4" />}
                  {showMap ? 'List view' : 'Map view'}
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'fee')}
                  className="px-3 py-2 rounded-lg border border-dark-200 text-sm"
                >
                  <option value="distance">Sort by distance</option>
                  <option value="rating">Sort by rating</option>
                  <option value="fee">Sort by visit fee</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Map and Results */}
        {savedLocation && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Map */}
            <div className="rounded-2xl border border-dark-200 bg-white overflow-hidden shadow-sm">
              {showMap ? (
                <div className="relative">
                  <NearbyGaragesMap
                    latitude={savedLocation.latitude}
                    longitude={savedLocation.longitude}
                    garages={sortedGarages}
                    onSelectGarage={(garage) => setSelectedGarageId(garage._id)}
                    selectedGarageId={selectedGarageId}
                    searchRadius={radius}
                    searchState={searchState}
                  />
                  {savedLocation && (
                    <button
                      onClick={handleRecenter}
                      className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-md hover:bg-dark-50 transition-colors flex items-center gap-2 text-sm font-medium text-dark-700"
                    >
                      <Target className="w-4 h-4" />
                      Recenter
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-[500px] items-center justify-center bg-dark-50 text-sm text-dark-600">
                  <div className="text-center">
                    <MapIconLucide className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p>Switch to map view to see garages</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {loading && searchState !== 'idle' ? (
                <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-dark-600">Loading nearby garages…</p>
                </div>
              ) : sortedGarages.length === 0 ? (
                <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                  <p className="font-semibold text-dark-900 mb-2">No garages found</p>
                  <p className="text-sm text-dark-600 mb-4">Try widening the search radius or removing filters</p>
                  <button
                    type="button"
                    onClick={() => setRadius(20)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Expand to 20 km
                  </button>
                </div>
              ) : (
                sortedGarages.map((garage) => {
                  const coords = garage.location?.coordinates;
                  const lat = coords?.[1];
                  const lng = coords?.[0];

                  return (
                    <motion.div
                      key={garage._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-4 shadow-sm transition-all ${
                        selectedGarageId === garage._id
                          ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-dark-200 bg-white hover:border-dark-300'
                      }`}
                      onClick={() => setSelectedGarageId(garage._id)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-16 h-16 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0">
                          {garage.images && garage.images[0] ? (
                            <img
                              src={garage.images[0].url}
                              alt={garage.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Truck className="w-8 h-8 text-dark-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-semibold text-dark-900 flex-1">{garage.name}</h3>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 whitespace-nowrap">
                              Verified
                            </span>
                            {isDev && garage.name.toLowerCase().includes('demo') && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 whitespace-nowrap">
                                Demo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dark-600 mb-2 line-clamp-1">{garage.address}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-dark-700">
                              <MapPin className="w-3 h-3" />
                              {garage.distance?.toFixed(1)} km
                            </span>
                            <span className="text-dark-400">•</span>
                            <span className="text-dark-600">{estimateArrival(garage.distance)}</span>
                            <span className="text-dark-400">•</span>
                            <span className="inline-flex items-center gap-1 text-dark-700">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {garage.rating?.toFixed(1) || '4.5'}
                              <span className="text-dark-500">({garage.reviewCount || 0})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                            garage.isOpen
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {garage.isOpen ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {garage.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 ${
                            garage.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {garage.isAvailable ? 'Available' : 'Busy'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-dark-700 ml-auto">
                          <Truck className="w-3 h-3" />
                          Visit ₹{garage.visitingCharge || 200}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(garage.services || []).slice(0, 3).map((service) => (
                          <span key={service} className="text-[10px] bg-dark-100 text-dark-600 px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                        {(garage.services?.length || 0) > 3 && (
                          <span className="text-[10px] text-dark-500 px-2 py-1">
                            +{(garage.services?.length || 0) - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/user/garages/${garage._id}`)}
                          className="flex-1 px-3 py-2 border border-dark-200 rounded-lg text-xs font-medium text-dark-700 hover:bg-dark-50 transition-colors"
                        >
                          View Garage
                        </button>
                        <button
                          onClick={() =>
                            navigate('/user/emergency', {
                              state: {
                                selectedGarageId: garage._id,
                                selectedGarageName: garage.name,
                                latitude: savedLocation.latitude,
                                longitude: savedLocation.longitude,
                                address: savedLocation.address,
                              },
                            })
                          }
                          className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors"
                        >
                          Request Help
                        </button>
                        {garage.phone && (
                          <a
                            href={`tel:${garage.phone}`}
                            className="px-3 py-2 border border-dark-200 rounded-lg text-xs font-medium text-dark-700 hover:bg-dark-50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {lat && lng && (
                          <a
                            href={getDirectionsUrl(lat, lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border border-dark-200 rounded-lg text-xs font-medium text-dark-700 hover:bg-dark-50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
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
