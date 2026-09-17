import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Truck,
  Wrench,
  Shield,
  Loader2,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { useLocation } from '@/hooks/useLocation';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GarageDetail {
  _id: string;
  name: string;
  businessName?: string;
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
  supportedVehicleTypes?: string[];
  openingTime?: string;
  closingTime?: string;
  is24x7?: boolean;
  weeklyOff?: string;
  verificationStatus?: string;
}

// Fix Leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const GarageDetailPage = () => {
  const { garageId } = useParams<{ garageId: string }>();
  const navigate = useNavigate();
  const { location: userLocation } = useLocation();
  const [garage, setGarage] = useState<GarageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    const fetchGarage = async () => {
      if (!garageId) {
        setError('Invalid garage ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = userLocation
          ? `${API_ENDPOINTS.GARAGES.DETAIL(garageId)}?userLatitude=${userLocation.latitude}&userLongitude=${userLocation.longitude}`
          : API_ENDPOINTS.GARAGES.DETAIL(garageId);

        const response = await axiosInstance.get(url);
        setGarage(response.data?.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load garage details');
      } finally {
        setLoading(false);
      }
    };

    void fetchGarage();
  }, [garageId, userLocation]);

  const estimateArrival = (distanceKm: number | undefined): string => {
    if (!distanceKm) return '15-30 min';
    const minTime = Math.ceil(distanceKm * 3);
    const maxTime = Math.ceil(distanceKm * 5);
    return `${minTime}-${maxTime} min`;
  };

  const getDirectionsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const formatTime = (time?: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-dark-600">Loading garage details…</p>
        </div>
      </div>
    );
  }

  if (error || !garage) {
    return (
      <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-dark-900 mb-2">Unable to load garage</h2>
            <p className="text-sm text-dark-600 mb-6">{error || 'Garage not found'}</p>
            <Link
              to="/user/nearby-garages"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coords = garage.location?.coordinates;
  const lat = coords?.[1];
  const lng = coords?.[0];

  return (
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-white p-2 shadow-sm hover:bg-dark-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-dark-900">Garage Details</h1>
            <p className="text-sm text-dark-600">Complete information about this garage</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dark-200 bg-white overflow-hidden shadow-sm"
            >
              {garage.images && garage.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-2">
                  {garage.images.slice(0, 4).map((image, idx) => (
                    <img
                      key={idx}
                      src={image.url}
                      alt={`${garage.name} ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Truck className="w-24 h-24 text-primary-400" />
                </div>
              )}
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-dark-900">{garage.name}</h2>
                    {garage.verificationStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <Shield className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {isDev && garage.name.toLowerCase().includes('demo') && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        Demo
                      </span>
                    )}
                  </div>
                  {garage.businessName && garage.businessName !== garage.name && (
                    <p className="text-sm text-dark-600 mb-2">Business: {garage.businessName}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1 text-dark-700">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{garage.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-dark-500">({garage.reviewCount || 0} reviews)</span>
                    </span>
                    {garage.distance !== undefined && (
                      <>
                        <span className="text-dark-400">•</span>
                        <span className="inline-flex items-center gap-1 text-dark-700">
                          <MapPin className="w-4 h-4" />
                          {garage.distance.toFixed(1)} km away
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isDev && garage.name.toLowerCase().includes('demo') && (
                <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Demo Listing</p>
                  <p className="text-xs text-yellow-700">
                    This is a demonstration garage. No real mechanic will be dispatched. Use for testing purposes only.
                  </p>
                </div>
              )}

              <div className="space-y-3 border-t border-dark-200 pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-dark-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-dark-900">{garage.address}</p>
                    {(garage.city || garage.pincode) && (
                      <p className="text-dark-600">
                        {garage.city}
                        {garage.state && `, ${garage.state}`} {garage.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {garage.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-dark-500 flex-shrink-0" />
                    <a
                      href={`tel:${garage.phone}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {garage.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-dark-500 flex-shrink-0" />
                  <div className="text-sm">
                    {garage.is24x7 ? (
                      <span className="text-green-600 font-medium">Open 24/7</span>
                    ) : (
                      <div>
                        <p className="text-dark-900">
                          {formatTime(garage.openingTime)} - {formatTime(garage.closingTime)}
                        </p>
                        {garage.weeklyOff && (
                          <p className="text-dark-600">Closed on {garage.weeklyOff}</p>
                        )}
                      </div>
                    )}
                    <div className="mt-1">
                      {garage.isOpen ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Open now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="w-3 h-3" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-dark-900">Services Offered</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(garage.services || []).map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-50 rounded-lg text-sm text-dark-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Supported Vehicles */}
            {garage.supportedVehicleTypes && garage.supportedVehicleTypes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-dark-900">Supported Vehicles</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {garage.supportedVehicleTypes.map((vehicle) => (
                    <span
                      key={vehicle}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {vehicle}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Map */}
            {lat && lng && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-dark-200 bg-white overflow-hidden shadow-sm"
              >
                <MapContainer
                  center={[lat, lng]}
                  zoom={15}
                  className="h-64 w-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]} />
                </MapContainer>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm sticky top-6"
            >
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    navigate('/user/emergency', {
                      state: {
                        selectedGarageId: garage._id,
                        selectedGarageName: garage.name,
                        latitude: userLocation?.latitude,
                        longitude: userLocation?.longitude,
                        address: userLocation?.address,
                      },
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                  Request Help
                </button>

                {garage.phone && (
                  <a
                    href={`tel:${garage.phone}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dark-200 text-dark-700 rounded-lg font-medium hover:bg-dark-50 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call Garage
                  </a>
                )}

                {lat && lng && (
                  <a
                    href={getDirectionsUrl(lat, lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dark-200 text-dark-700 rounded-lg font-medium hover:bg-dark-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Get Directions
                  </a>
                )}

                <button
                  onClick={() => navigate('/user/nearby-garages')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dark-200 text-dark-700 rounded-lg font-medium hover:bg-dark-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Search
                </button>
              </div>

              {/* Pricing & Info */}
              <div className="mt-6 pt-6 border-t border-dark-200 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Visit Fee</span>
                  <span className="font-semibold text-dark-900">₹{garage.visitingCharge || 200}</span>
                </div>

                {garage.distance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-dark-600">Distance</span>
                    <span className="font-semibold text-dark-900">{garage.distance.toFixed(1)} km</span>
                  </div>
                )}

                {garage.distance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-dark-600">Est. Arrival</span>
                    <span className="font-semibold text-dark-900">{estimateArrival(garage.distance)}</span>
                  </div>
                )}

                {garage.serviceRadius && (
                  <div className="flex items-center justify-between">
                    <span className="text-dark-600">Service Radius</span>
                    <span className="font-semibold text-dark-900">{garage.serviceRadius} km</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Availability</span>
                  <span
                    className={`font-semibold ${
                      garage.isAvailable ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {garage.isAvailable ? 'Available Now' : 'Busy'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Roadside Assistance</span>
                  <span className="font-semibold text-green-600">Yes</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarageDetailPage;
