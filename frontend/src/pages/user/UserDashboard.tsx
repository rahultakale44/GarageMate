import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Car, MapPin, Clock, Star, Plus,
  Pencil, Trash2, Loader2, Navigation, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import NotificationBell from '@/components/shared/NotificationBell';
import UserSubscriptionCard from '@/components/subscription/UserSubscriptionCard';
import { getMySubscription } from '@/services/subscriptionService';
import type { MySubscriptionResponse } from '@/types/subscription';

interface VehicleRecord {
  _id: string; vehicleType: string; brand: string; vehicleModel: string;
  registrationNumber: string; fuelType: string; manufacturingYear: number; notes?: string;
}

interface RequestRecord {
  _id: string; issueCategory: string; status: string; createdAt: string;
  garageId?: { name?: string };
}

interface DashboardStats {
  nearbyGarages: number; activeRequests: number; completedRequests: number; vehicles: number;
}

interface UserLocation {
  latitude: number; longitude: number; locality?: string; city?: string; address?: string;
}

interface VehicleFormState {
  vehicleType: string; brand: string; vehicleModel: string; registrationNumber: string;
  fuelType: string; manufacturingYear: string; notes: string;
}

const defaultVehicleForm = (): VehicleFormState => ({
  vehicleType: 'CAR', brand: '', vehicleModel: '', registrationNumber: '',
  fuelType: '', manufacturingYear: new Date().getFullYear().toString(), notes: '',
});

const vehicleTypeOptions = ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'VAN', 'OTHER'];
const fuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const navItems: NavItem[] = [
  { icon: AlertCircle, label: 'Dashboard',     path: '/user/dashboard' },
  { icon: MapPin,      label: 'Find Garages',  path: '/user/nearby-garages' },
  { icon: Zap,         label: 'Emergency',     path: '/user/book' },
  { icon: Clock,       label: 'My Requests',   path: '/user/requests' },
  { icon: Car,         label: 'My Vehicles',   path: '/user/vehicles' },
  { icon: Star,        label: 'My Reviews',    path: '/user/reviews' },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(defaultVehicleForm());
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ nearbyGarages: 0, activeRequests: 0, completedRequests: 0, vehicles: 0 });
  const [nearbyGarages, setNearbyGarages] = useState<Array<{ _id: string; name: string; address: string; distance?: number; rating?: number; reviewCount?: number; isAvailable?: boolean; }>>([]);
  const [loadingNearbyGarages, setLoadingNearbyGarages] = useState(false);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<MySubscriptionResponse | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('userLocation');
    if (saved) {
      try { setUserLocation(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported'); return; }
    setRequestingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axiosInstance.get(API_ENDPOINTS.GARAGES.REVERSE_GEOCODE, { params: { latitude, longitude } });
          const loc: UserLocation = { latitude, longitude, address: res.data?.data?.displayName || res.data?.data?.address, locality: res.data?.data?.locality, city: res.data?.data?.city };
          setUserLocation(loc);
          sessionStorage.setItem('userLocation', JSON.stringify(loc));
          await fetchNearbyGaragesCount(latitude, longitude);
        } catch {
          const loc: UserLocation = { latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
          setUserLocation(loc);
          sessionStorage.setItem('userLocation', JSON.stringify(loc));
        } finally { setRequestingLocation(false); }
      },
      (err) => {
        setRequestingLocation(false);
        setLocationError(err.code === 1 ? 'Location permission denied.' : err.code === 2 ? 'Location unavailable.' : 'Location request timed out.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const fetchNearbyGaragesCount = async (lat: number, lng: number) => {
    setLoadingNearbyGarages(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.GARAGES.NEARBY, { params: { latitude: lat, longitude: lng, radius: 10 } });
      const garages = res.data?.data || [];
      setStats((p) => ({ ...p, nearbyGarages: garages.length }));
      setNearbyGarages(garages.slice(0, 3));
    } catch { setNearbyGarages([]); } finally { setLoadingNearbyGarages(false); }
  };

  const fetchVehicles = async () => {
    if (!user) return;
    setLoadingVehicles(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.VEHICLES.LIST);
      setVehicles(res.data?.data || []);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load vehicles'); }
    finally { setLoadingVehicles(false); }
  };

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.MY);
      const all = res.data?.data || [];
      setRequests(all.slice(0, 4));
      const active = all.filter((r: RequestRecord) => !['CANCELLED', 'CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(r.status)).length;
      const completed = all.filter((r: RequestRecord) => ['CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(r.status)).length;
      setStats((p) => ({ ...p, activeRequests: active, completedRequests: completed }));
    } catch { setRequests([]); } finally { setLoadingRequests(false); }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    setLoadingSubscription(true);
    setSubscriptionError(null);
    try { const data = await getMySubscription(); setSubscriptionData(data); }
    catch (err) { setSubscriptionError(err instanceof Error ? err.message : 'Unable to load subscription'); }
    finally { setLoadingSubscription(false); }
  };

  useEffect(() => {
    void fetchVehicles();
    void fetchRequests();
    void fetchSubscription();
    if (userLocation) void fetchNearbyGaragesCount(userLocation.latitude, userLocation.longitude);
  }, [user?._id]);

  useEffect(() => { setStats((p) => ({ ...p, vehicles: vehicles.length })); }, [vehicles.length]);

  const openCreateModal = () => { setEditingVehicle(null); setVehicleForm(defaultVehicleForm()); setErrorMessage(null); setIsVehicleModalOpen(true); };
  const openEditModal = (v: VehicleRecord) => { setEditingVehicle(v); setVehicleForm({ vehicleType: v.vehicleType, brand: v.brand, vehicleModel: v.vehicleModel, registrationNumber: v.registrationNumber, fuelType: v.fuelType, manufacturingYear: String(v.manufacturingYear), notes: v.notes || '' }); setErrorMessage(null); setIsVehicleModalOpen(true); };
  const closeVehicleModal = () => { setIsVehicleModalOpen(false); setEditingVehicle(null); setVehicleForm(defaultVehicleForm()); setErrorMessage(null); };

  const handleVehicleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingVehicle(true);
    setErrorMessage(null);
    try {
      const payload = { ...vehicleForm, manufacturingYear: Number(vehicleForm.manufacturingYear) };
      if (editingVehicle) {
        const res = await axiosInstance.patch(API_ENDPOINTS.VEHICLES.UPDATE(editingVehicle._id), payload);
        setVehicles((p) => p.map((v) => v._id === editingVehicle._id ? res.data.data : v));
      } else {
        const res = await axiosInstance.post(API_ENDPOINTS.VEHICLES.CREATE, payload);
        setVehicles((p) => [res.data.data, ...p]);
      }
      closeVehicleModal();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to save vehicle'); }
    finally { setSubmittingVehicle(false); }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Remove this vehicle from your profile?')) return;
    try {
      await axiosInstance.delete(API_ENDPOINTS.VEHICLES.DELETE(vehicleId));
      setVehicles((p) => p.filter((v) => v._id !== vehicleId));
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to delete vehicle'); }
  };

  const headerActions = <NotificationBell />;

  return (
    <DashboardShell navItems={navItems} headerActions={headerActions}>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          Good day, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your vehicles.</p>
      </div>

      {/* Emergency CTA */}
      <div
        className="mb-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,#b91c1c,#dc2626)', boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}
      >
        <div>
          <p className="text-xs font-bold text-red-200 uppercase tracking-widest mb-1">Need immediate help?</p>
          <h2 className="text-lg font-bold text-white">Get emergency roadside assistance</h2>
        </div>
        <Link
          to={vehicles.length === 0 ? '#' : '/user/book'}
          onClick={(e) => { if (vehicles.length === 0) { e.preventDefault(); openCreateModal(); } }}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
        >
          <Zap className="w-4 h-4" />
          {vehicles.length === 0 ? 'Add Vehicle First' : 'Get Help Now'}
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Nearby Garages', value: stats.nearbyGarages, icon: <MapPin className="w-5 h-5 text-blue-400" />, iconBg: 'rgba(59,130,246,0.15)', note: !userLocation ? 'Enable location' : undefined },
          { label: 'Active Requests', value: stats.activeRequests, icon: <Clock className="w-5 h-5 text-orange-400" />, iconBg: 'rgba(249,115,22,0.15)' },
          { label: 'Completed', value: stats.completedRequests, icon: <Star className="w-5 h-5 text-green-400" />, iconBg: 'rgba(34,197,94,0.15)' },
          { label: 'My Vehicles', value: stats.vehicles, icon: <Car className="w-5 h-5 text-orange-400" />, iconBg: 'rgba(249,115,22,0.15)' },
        ].map(({ label, value, icon, iconBg, note }) => (
          <div key={label} className="dark-stat-card">
            <div>
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              {note && <p className="text-2xs text-slate-600 mt-0.5">{note}</p>}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* Location card */}
      <div className="dark-card p-5 mb-6">
        {!userLocation ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Navigation className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Enable location services</p>
                <p className="text-xs text-slate-500">We'll find garages near you instantly</p>
              </div>
            </div>
            {locationError && <p className="text-xs text-red-400">{locationError}</p>}
            <button onClick={handleUseCurrentLocation} disabled={requestingLocation}
              className="btn-primary text-sm flex-shrink-0">
              {requestingLocation ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting…</> : 'Use My Location'}
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userLocation.locality || userLocation.city || 'Your location'}</p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{userLocation.address}</p>
                <Link to="/user/nearby-garages" className="text-xs font-medium text-orange-400 hover:text-orange-300 mt-1.5 inline-block">
                  Find nearby garages →
                </Link>
              </div>
            </div>
            <button onClick={handleUseCurrentLocation} disabled={requestingLocation}
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
              {requestingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      {/* Subscription card */}
      <div className="mb-6">
        <UserSubscriptionCard subscriptionData={subscriptionData} loading={loadingSubscription} error={subscriptionError} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent requests */}
        <div className="dark-card">
          <div className="dark-card-header">
            <h3 className="text-sm font-semibold text-white">Recent Requests</h3>
            <Link to="/user/requests" className="text-xs font-medium text-orange-400 hover:text-orange-300">View all</Link>
          </div>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<Clock className="w-6 h-6" />} title="No requests yet"
              description="Create your first emergency request using the button above." />
          ) : (
            <div>
              {requests.map((req) => (
                <Link key={req._id} to={`/user/requests/${req._id}`}
                  className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{req.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{req.garageId?.name ?? 'Searching garage…'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={req.status} className="flex-shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My vehicles */}
        <div className="dark-card">
          <div className="dark-card-header">
            <h3 className="text-sm font-semibold text-white">My Vehicles</h3>
            <button onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Vehicle
            </button>
          </div>

          {errorMessage && (
            <div className="mx-5 mt-4 p-3 rounded-lg text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
              {errorMessage}
            </div>
          )}

          {loadingVehicles ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState icon={<Car className="w-6 h-6" />} title="No vehicles added"
              description="Add a vehicle to start requesting assistance."
              action={<button onClick={openCreateModal} className="btn-primary text-sm">Add Vehicle</button>} />
          ) : (
            <div>
              {vehicles.map((v) => (
                <div key={v._id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.15)' }}>
                    <Car className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{v.brand} {v.vehicleModel}</p>
                    <p className="text-xs text-slate-500">{v.registrationNumber} · {v.fuelType}</p>
                  </div>
                  <span className="text-2xs font-medium text-slate-400 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {v.vehicleType}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditModal(v)}
                      className="p-1.5 rounded transition-colors text-slate-500 hover:text-white" aria-label="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void handleDeleteVehicle(v._id)}
                      className="p-1.5 rounded transition-colors text-slate-500 hover:text-red-400" aria-label="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nearby garages preview */}
      {userLocation && (
        <div className="dark-card mt-6">
          <div className="dark-card-header">
            <h3 className="text-sm font-semibold text-white">Nearby Garages</h3>
            <Link to="/user/nearby-garages" className="text-xs font-medium text-orange-400 hover:text-orange-300">View all</Link>
          </div>
          {loadingNearbyGarages ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching…
            </div>
          ) : nearbyGarages.length === 0 ? (
            <EmptyState icon={<MapPin className="w-6 h-6" />} title="No garages found nearby"
              description="Try extending the search radius." />
          ) : (
            <div>
              {nearbyGarages.map((g) => (
                <div key={g._id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  onClick={() => navigate(`/user/garages/${g._id}`)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{g.name}</p>
                    <p className="text-xs text-slate-500 truncate">{g.address}</p>
                    {g.distance !== undefined && <p className="text-xs text-slate-600">{g.distance.toFixed(1)} km away</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {g.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium text-slate-300">{g.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <span className="text-2xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: g.isAvailable ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)', color: g.isAvailable ? '#4ade80' : '#64748b' }}>
                      {g.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicle modal */}
      <Modal open={isVehicleModalOpen} onClose={closeVehicleModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        description={editingVehicle ? 'Update your vehicle details.' : 'Add a vehicle to your profile.'}>
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{errorMessage}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Vehicle Type</label>
              <select value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm((p) => ({ ...p, vehicleType: e.target.value }))}
                className="input-field text-sm">
                {vehicleTypeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Fuel Type</label>
              <select value={vehicleForm.fuelType} onChange={(e) => setVehicleForm((p) => ({ ...p, fuelType: e.target.value }))}
                className="input-field text-sm">
                <option value="">Select fuel</option>
                {fuelTypeOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Brand</label>
              <input value={vehicleForm.brand} onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))}
                className="input-field text-sm" placeholder="e.g. Honda" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Model</label>
              <input value={vehicleForm.vehicleModel} onChange={(e) => setVehicleForm((p) => ({ ...p, vehicleModel: e.target.value }))}
                className="input-field text-sm" placeholder="e.g. City" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Registration No.</label>
              <input value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((p) => ({ ...p, registrationNumber: e.target.value }))}
                className="input-field text-sm" placeholder="MH12AB1234" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Year</label>
              <input type="number" value={vehicleForm.manufacturingYear} onChange={(e) => setVehicleForm((p) => ({ ...p, manufacturingYear: e.target.value }))}
                className="input-field text-sm" min={1990} max={new Date().getFullYear()} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Notes (optional)</label>
            <textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm((p) => ({ ...p, notes: e.target.value }))}
              className="input-field text-sm resize-none" rows={2} placeholder="Any specific notes about the vehicle" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeVehicleModal} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button type="submit" disabled={submittingVehicle} className="btn-primary flex-1 text-sm">
              {submittingVehicle ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
};

export default UserDashboard;
