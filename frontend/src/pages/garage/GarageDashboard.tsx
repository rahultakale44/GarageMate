import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Store, Bell, Clock, DollarSign, CheckCircle, AlertCircle, Users, Loader2,
  Plus, Trash2, Pencil, ShieldCheck, Wrench, ToggleLeft, ToggleRight, Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS, SOCKET_URL } from '@/config/api';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import GarageSubscriptionCard from '@/components/subscription/GarageSubscriptionCard';
import { getMySubscription } from '@/services/subscriptionService';
import type { MySubscriptionResponse } from '@/types/subscription';

interface GarageProfile {
  _id: string; name: string; phone: string; address: string; city: string; state: string;
  pincode: string; serviceRadius: number; services: string[]; openingTime?: string;
  closingTime?: string; weeklyOff?: string; is24x7: boolean; isAvailable: boolean;
  verificationStatus: string; verificationNotes?: string; visitingCharge?: number;
  servicePricing?: Record<string, number>; location?: { coordinates?: [number, number] };
}

interface MechanicRecord {
  _id: string; name: string; phone: string; skills: string[]; vehicleExpertise: string[];
  experience: number; status: string;
}

type Section = 'dashboard' | 'requests' | 'services' | 'mechanics' | 'verification';

const navItems: NavItem[] = [
  { icon: Store,       label: 'Dashboard',    path: '/garage/dashboard' },
  { icon: AlertCircle, label: 'Requests',     path: '/garage/requests' },
  { icon: Wrench,      label: 'Services',     path: '/garage/dashboard' },
  { icon: Users,       label: 'Mechanics',    path: '/garage/dashboard' },
  { icon: ShieldCheck, label: 'Verification', path: '/garage/dashboard' },
];

const GarageDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<GarageProfile | null>(null);
  const [mechanics, setMechanics] = useState<MechanicRecord[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState('');
  const [priceForm, setPriceForm] = useState('');
  const [mechanicForm, setMechanicForm] = useState({ name: '', phone: '', skills: '', experience: '0' });
  const [editingMechanicId, setEditingMechanicId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Array<{
    _id: string; issueCategory: string; status: string; address: string; createdAt: string;
    userId?: { name?: string; phone?: string };
    vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string; vehicleType?: string };
    mechanicId?: { _id?: string; name?: string; phone?: string; status?: string };
  }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<MySubscriptionResponse | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [mechanicModalOpen, setMechanicModalOpen] = useState(false);

  const fetchGarage = async () => {
    setLoadingProfile(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.GARAGES.MY);
      setProfile(res.data?.data || null);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load garage profile'); }
    finally { setLoadingProfile(false); }
  };

  const fetchMechanics = async () => {
    setLoadingMechanics(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.MECHANICS.LIST);
      setMechanics(res.data?.data || []);
    } catch { /* silent */ } finally { setLoadingMechanics(false); }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GARAGE);
      setRequests(res.data?.data || []);
    } catch { setRequests([]); } finally { setLoadingRequests(false); }
  };

  const fetchSubscription = async () => {
    setLoadingSubscription(true);
    try { const data = await getMySubscription(); setSubscriptionData(data); }
    catch (err) { setSubscriptionError(err instanceof Error ? err.message : 'Unable to load subscription'); }
    finally { setLoadingSubscription(false); }
  };

  useEffect(() => {
    void fetchGarage();
    void fetchMechanics();
    void fetchRequests();
    void fetchSubscription();

    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
      socket.on('request:new', () => {
        setNewRequestAlert(true);
        void fetchRequests();
        setTimeout(() => setNewRequestAlert(false), 5000);
      });
      socket.on('request:status-changed', () => void fetchRequests());
      return () => { socket.disconnect(); };
    }
  }, []);

  const handleAvailabilityToggle = async () => {
    if (!profile) return;
    setSavingAvailability(true);
    try {
      const res = await axiosInstance.patch(API_ENDPOINTS.GARAGES.TOGGLE_AVAILABILITY, { isAvailable: !profile.isAvailable });
      setProfile((p) => p ? { ...p, isAvailable: res.data?.data?.isAvailable ?? !p.isAvailable } : p);
      setSuccessMessage('Availability updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to update availability'); }
    finally { setSavingAvailability(false); }
  };

  const handleAddService = async () => {
    if (!profile || !serviceForm.trim()) return;
    try {
      const nextServices = Array.from(new Set([...(profile.services || []), serviceForm.trim()]));
      const res = await axiosInstance.patch(API_ENDPOINTS.GARAGES.UPDATE, { services: nextServices });
      setProfile((p) => p ? { ...p, services: res.data?.data?.services || nextServices } : p);
      setServiceForm('');
      setSuccessMessage('Service added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to add service'); }
  };

  const handleAddPrice = async () => {
    if (!profile || !priceForm.trim()) return;
    const [sName, sPrice] = priceForm.split(':').map((p) => p.trim());
    if (!sName || isNaN(Number(sPrice))) { setErrorMessage('Format: ServiceName: Price'); return; }
    try {
      const nextPricing = { ...(profile.servicePricing || {}), [sName]: Number(sPrice) };
      const res = await axiosInstance.patch(API_ENDPOINTS.GARAGES.UPDATE, { servicePricing: nextPricing });
      setProfile((p) => p ? { ...p, servicePricing: res.data?.data?.servicePricing || nextPricing } : p);
      setPriceForm('');
      setSuccessMessage('Pricing updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to update pricing'); }
  };

  const handleSubmitMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: mechanicForm.name, phone: mechanicForm.phone, skills: mechanicForm.skills.split(',').map((s) => s.trim()).filter(Boolean), experience: Number(mechanicForm.experience || 0) };
      if (editingMechanicId) {
        const res = await axiosInstance.patch(API_ENDPOINTS.MECHANICS.UPDATE(editingMechanicId), payload);
        setMechanics((p) => p.map((m) => m._id === editingMechanicId ? res.data.data : m));
      } else {
        const res = await axiosInstance.post(API_ENDPOINTS.MECHANICS.CREATE, payload);
        setMechanics((p) => [res.data.data, ...p]);
      }
      setMechanicForm({ name: '', phone: '', skills: '', experience: '0' });
      setEditingMechanicId(null);
      setMechanicModalOpen(false);
      setSuccessMessage(editingMechanicId ? 'Mechanic updated' : 'Mechanic added');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to save mechanic'); }
  };

  const handleDeleteMechanic = async (id: string) => {
    if (!window.confirm('Remove this mechanic?')) return;
    try {
      await axiosInstance.delete(API_ENDPOINTS.MECHANICS.DELETE(id));
      setMechanics((p) => p.filter((m) => m._id !== id));
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to delete mechanic'); }
  };

  const pricingEntries = useMemo(() => Object.entries(profile?.servicePricing || {}), [profile?.servicePricing]);

  const activeRequests = requests.filter((r) => !['CANCELLED', 'CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(r.status));
  const activeJobs = requests.filter((r) => ['MECHANIC_ASSIGNED', 'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION_STARTED', 'SERVICE_IN_PROGRESS'].includes(r.status));

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Availability toggle */}
      <button onClick={handleAvailabilityToggle} disabled={savingAvailability}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          profile?.isAvailable ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
        }`}>
        {savingAvailability ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : profile?.isAvailable ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
        {profile?.isAvailable ? 'Available' : 'Offline'}
      </button>
      <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        <Bell className="w-5 h-5" />
        {newRequestAlert && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
      </button>
    </div>
  );

  return (
    <DashboardShell navItems={navItems} headerActions={headerActions}>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          {profile ? profile.name : `Welcome, ${user?.name?.split(' ')[0] ?? 'Owner'}`}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {profile ? `${profile.city}, ${profile.state}` : 'Loading your garage…'}
        </p>
      </div>

      {/* Alerts */}
      {newRequestAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <span className="flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <p className="text-sm font-semibold text-red-700">New service request received!</p>
          <Link to="/garage/requests" className="ml-auto text-sm font-semibold text-red-600 hover:text-red-700">
            View now →
          </Link>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between gap-3">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Requests" value={activeRequests.length} icon={<AlertCircle className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" />
        <StatCard label="Active Jobs" value={activeJobs.length} icon={<CheckCircle className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" />
        <StatCard label="Visiting Charge" value={`₹${profile?.visitingCharge ?? '—'}`} icon={<DollarSign className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" />
        <StatCard label="Mechanics" value={mechanics.length} icon={<Users className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" />
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
        {(['dashboard', 'requests', 'services', 'mechanics', 'verification'] as Section[]).map((section) => (
          <button key={section} onClick={() => setActiveSection(section)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeSection === section ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {section === 'dashboard' ? 'Overview' : section === 'requests' ? `Requests${activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}` : section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      {activeSection === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Garage profile */}
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Garage Profile</h3>
              {loadingProfile && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {profile ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Garage Name', profile.name],
                  ['Contact', profile.phone],
                  ['Address', profile.address],
                  ['City / State', `${profile.city}, ${profile.state}`],
                  ['Pincode', profile.pincode],
                  ['Service Radius', `${profile.serviceRadius} km`],
                  ['Working Hours', profile.is24x7 ? '24×7' : `${profile.openingTime ?? '—'} – ${profile.closingTime ?? '—'}`],
                  ['Admin Notes', profile.verificationNotes || 'None'],
                ].map(([label, value]) => (
                  <div key={label} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-slate-800 font-medium">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Profile not found" description="Contact support if this persists." />
            )}
          </div>

          {/* Subscription + recent requests */}
          <div className="space-y-6">
            <GarageSubscriptionCard subscriptionData={subscriptionData} loading={loadingSubscription} error={subscriptionError} />

            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Recent Requests</h3>
                <Link to="/garage/requests" className="text-xs font-medium text-orange-500 hover:text-orange-600">View all</Link>
              </div>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
              ) : requests.length === 0 ? (
                <EmptyState icon={<Clock className="w-5 h-5" />} title="No requests yet" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {requests.slice(0, 4).map((r) => (
                    <div key={r._id} className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/garage/requests')}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">{r.issueCategory.replace(/_/g, ' ')}</p>
                        <StatusBadge status={r.status} className="flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Requests ─────────────────────────────────────────────── */}
      {activeSection === 'requests' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">All Requests</h3>
            <Link to="/garage/requests" className="btn-primary text-xs py-1.5 px-3">
              Manage Requests
            </Link>
          </div>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No requests yet" description="Incoming requests will appear here when customers need assistance." />
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r._id} className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/garage/requests/${r._id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{r.issueCategory.replace(/_/g, ' ')}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{r.address}</p>
                      {r.userId?.name && <p className="text-xs text-slate-400 mt-0.5">Customer: {r.userId.name}</p>}
                      {r.vehicleId && <p className="text-xs text-slate-400">{r.vehicleId.brand} {r.vehicleId.vehicleModel} · {r.vehicleId.registrationNumber}</p>}
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Services ─────────────────────────────────────────────── */}
      {activeSection === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services list */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Service Catalogue</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input value={serviceForm} onChange={(e) => setServiceForm(e.target.value)}
                  className="input-field text-sm flex-1" placeholder="e.g. AC Repair" />
                <button onClick={handleAddService} className="btn-primary text-sm px-3 py-2">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile?.services || []).map((service) => (
                  <span key={service} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                    {service}
                  </span>
                ))}
                {(profile?.services || []).length === 0 && (
                  <p className="text-sm text-slate-400">No services added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Service Pricing</h3>
              <p className="text-xs text-slate-400 mt-0.5">Format: Service Name: Price</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input value={priceForm} onChange={(e) => setPriceForm(e.target.value)}
                  className="input-field text-sm flex-1" placeholder="e.g. Tyre Puncture: 150" />
                <button onClick={handleAddPrice} className="btn-primary text-sm px-3 py-2">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {pricingEntries.length === 0 ? (
                <p className="text-sm text-slate-400">No pricing set yet.</p>
              ) : (
                <div className="space-y-2">
                  {pricingEntries.map(([name, price]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-700">{name}</span>
                      <span className="text-sm font-semibold text-slate-900">₹{price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mechanics ────────────────────────────────────────────── */}
      {activeSection === 'mechanics' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Your Mechanics</h3>
            <button onClick={() => { setEditingMechanicId(null); setMechanicForm({ name: '', phone: '', skills: '', experience: '0' }); setMechanicModalOpen(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600">
              <Plus className="w-3.5 h-3.5" /> Add Mechanic
            </button>
          </div>
          {loadingMechanics ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : mechanics.length === 0 ? (
            <EmptyState icon={<Users className="w-6 h-6" />} title="No mechanics added"
              action={<button onClick={() => setMechanicModalOpen(true)} className="btn-primary text-sm">Add First Mechanic</button>} />
          ) : (
            <div className="divide-y divide-slate-100">
              {mechanics.map((m) => (
                <div key={m._id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.phone} · {m.experience} yr exp</p>
                    {m.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-2xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${m.status === 'AVAILABLE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingMechanicId(m._id); setMechanicForm({ name: m.name, phone: m.phone, skills: m.skills.join(', '), experience: String(m.experience) }); setMechanicModalOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void handleDeleteMechanic(m._id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Verification ─────────────────────────────────────────── */}
      {activeSection === 'verification' && (
        <div className="card max-w-xl">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Verification Status</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                profile?.verificationStatus === 'APPROVED' ? 'bg-green-100' : profile?.verificationStatus === 'REJECTED' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <ShieldCheck className={`w-6 h-6 ${
                  profile?.verificationStatus === 'APPROVED' ? 'text-green-600' : profile?.verificationStatus === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {profile?.verificationStatus ?? 'Loading…'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile?.verificationStatus === 'APPROVED'
                    ? 'Your garage is verified and visible to customers.'
                    : profile?.verificationStatus === 'PENDING'
                    ? 'Your application is under review.'
                    : profile?.verificationStatus === 'REJECTED'
                    ? 'Your application was rejected. See admin notes below.'
                    : 'Status unknown.'}
                </p>
              </div>
            </div>

            {profile?.verificationNotes && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1">Admin Feedback</p>
                <p className="text-sm text-blue-700">{profile.verificationNotes}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 space-y-1">
              <p>• Approval typically takes 1–3 business days.</p>
              <p>• Ensure your profile information is complete and accurate.</p>
              <p>• You can receive requests once your garage is approved.</p>
            </div>
          </div>
        </div>
      )}

      {/* Mechanic modal */}
      <Modal open={mechanicModalOpen} onClose={() => setMechanicModalOpen(false)}
        title={editingMechanicId ? 'Edit Mechanic' : 'Add Mechanic'}>
        <form onSubmit={handleSubmitMechanic} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Name</label>
            <input value={mechanicForm.name} onChange={(e) => setMechanicForm((p) => ({ ...p, name: e.target.value }))}
              className="input-field text-sm" placeholder="Mechanic full name" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Phone</label>
            <input value={mechanicForm.phone} onChange={(e) => setMechanicForm((p) => ({ ...p, phone: e.target.value }))}
              className="input-field text-sm" placeholder="10-digit number" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Skills (comma-separated)</label>
            <input value={mechanicForm.skills} onChange={(e) => setMechanicForm((p) => ({ ...p, skills: e.target.value }))}
              className="input-field text-sm" placeholder="e.g. Tyre Repair, Engine" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Years of Experience</label>
            <input type="number" min={0} value={mechanicForm.experience}
              onChange={(e) => setMechanicForm((p) => ({ ...p, experience: e.target.value }))}
              className="input-field text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setMechanicModalOpen(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button type="submit" className="btn-primary flex-1 text-sm">
              <Send className="w-4 h-4" />
              {editingMechanicId ? 'Update' : 'Add Mechanic'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
};

export default GarageDashboard;
