import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Navigation, Star, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import NearbyGaragesMap from '@/components/maps/NearbyGaragesMap';

interface GarageRecord {
  _id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
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
}

const radiusOptions = [2, 5, 10, 20];
const serviceOptions = ['Tyre Puncture', 'Battery Jump-Start', 'Car Repair', 'Bike Repair', 'Towing', 'Emergency Roadside Help'];
const vehicleOptions = ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'];

const NearbyGaragesPage = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(10);
  const [serviceType, setServiceType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [minimumRating, setMinimumRating] = useState('0');
  const [garages, setGarages] = useState<GarageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [findingLocation, setFindingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'fee'>('distance');

  const fetchNearbyGarages = async (lat: number, lng: number) => {
    setLoading(true);
    setErrorMessage(null);
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
          minimumRating: minimumRating || undefined,
        },
      });
      setGarages(response.data?.data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to find nearby garages');
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Geolocation is not supported in this browser');
      return;
    }

    setFindingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLatitude(nextLat);
        setLongitude(nextLng);
        setFindingLocation(false);
        try {
          const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, { params: { latitude: nextLat, longitude: nextLng } });
          setAddress(response.data?.data?.address || '');
        } catch {
          setAddress('');
        }
        await fetchNearbyGarages(nextLat, nextLng);
      },
      (error) => {
        setFindingLocation(false);
        if (error.code === 1) {
          setErrorMessage('Location permission denied. You can still enter coordinates manually.');
        } else if (error.code === 2) {
          setErrorMessage('Location is currently unavailable.');
        } else {
          setErrorMessage('Unable to detect your location right now.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (latitude == null || longitude == null) {
      setErrorMessage('Please use your current location or enter coordinates first.');
      return;
    }
    await fetchNearbyGarages(latitude, longitude);
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

  useEffect(() => {
    if (latitude != null && longitude != null) {
      void fetchNearbyGarages(latitude, longitude);
    }
  }, [radius, serviceType, vehicleType, openNow, availableNow, minimumRating]);

  return (
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard" className="rounded-full bg-white p-2 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Nearby Garages</h1>
            <p className="text-sm text-dark-600">Find verified garages near your location.</p>
          </div>
        </div>

        {errorMessage && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

        <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-dark-700">Current location</label>
              <button type="button" onClick={handleUseCurrentLocation} disabled={findingLocation} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700">
                {findingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {findingLocation ? 'Locating you…' : 'Use my current location'}
              </button>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-dark-700">Address</label>
              <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter or confirm your address" className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-dark-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude ?? ''}
                onChange={(event) => setLatitude(event.target.value ? Number(event.target.value) : null)}
                placeholder="e.g. 18.5204"
                className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude ?? ''}
                onChange={(event) => setLongitude(event.target.value ? Number(event.target.value) : null)}
                placeholder="e.g. 73.8567"
                className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="text-sm font-medium text-dark-700">Radius</label>
              <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm">
                {radiusOptions.map((option) => <option key={option} value={option}>{option} km</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700">Service</label>
              <select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm">
                <option value="">Any service</option>
                {serviceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700">Vehicle</label>
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm">
                <option value="">Any vehicle</option>
                {vehicleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700">Minimum rating</label>
              <select value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)} className="mt-2 w-full rounded-lg border border-dark-200 px-3 py-2 text-sm">
                <option value="0">Any</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setOpenNow((prev) => !prev)} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${openNow ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>Open now</button>
              <button type="button" onClick={() => setAvailableNow((prev) => !prev)} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${availableNow ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'}`}>Available</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void handleSearch()} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white">Search nearby garages</button>
            <button type="button" onClick={() => setShowMap((prev) => !prev)} className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700">{showMap ? 'Show list' : 'Show map'}</button>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'distance' | 'rating' | 'fee')} className="rounded-lg border border-dark-200 px-3 py-2 text-sm">
              <option value="distance">Sort by distance</option>
              <option value="rating">Sort by rating</option>
              <option value="fee">Sort by visit fee</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-dark-200 bg-white p-3 shadow-sm">
            {showMap ? (
              <NearbyGaragesMap latitude={latitude} longitude={longitude} garages={sortedGarages} onSelectGarage={(garage) => setSelectedGarageId(garage._id)} />
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-dark-300 bg-dark-50 text-sm text-dark-600">Switch back to the map to view nearby garages.</div>
            )}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">Loading nearby garages…</div>
            ) : sortedGarages.length === 0 ? (
              <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">
                <p className="font-semibold text-dark-900">No nearby garages match your filters.</p>
                <p className="mt-2">Try widening the radius or removing a few filters.</p>
                <button type="button" onClick={() => setRadius(20)} className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white">Expand search radius</button>
              </div>
            ) : (
              sortedGarages.map((garage) => (
                <div key={garage._id} className={`rounded-2xl border p-4 shadow-sm ${selectedGarageId === garage._id ? 'border-primary-300 bg-primary-50' : 'border-dark-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dark-900">{garage.name}</h3>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">Verified</span>
                      </div>
                      <p className="mt-1 text-sm text-dark-600">{garage.address}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-dark-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-2 py-1"><MapPin className="h-3 w-3" />{garage.distance?.toFixed(1)} km</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-2 py-1"><Star className="h-3 w-3" />{garage.rating?.toFixed(1) || '4.5'} ({garage.reviewCount || 0})</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-2 py-1"><Truck className="h-3 w-3" />₹{garage.visitingCharge || 99}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-dark-500">
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${garage.isOpen ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {garage.isOpen ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {garage.isOpen ? 'Open' : 'Closed'}
                      </div>
                      <div className="mt-2 text-[11px]">{garage.isAvailable ? 'Available now' : 'Busy'}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(garage.services || []).slice(0, 4).map((service) => (
                      <span key={service} className="rounded-full bg-dark-100 px-2 py-1 text-xs text-dark-600">{service}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/garage/${garage._id}`} className="rounded-lg border border-dark-200 px-3 py-2 text-sm font-medium text-dark-700">View profile</Link>
                    <Link to="/user/emergency" state={{ selectedGarageId: garage._id }} className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Request help</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyGaragesPage;
