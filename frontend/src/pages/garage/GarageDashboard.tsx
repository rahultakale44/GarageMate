import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store,
  Bell,
  LogOut,
  Menu,
  X,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Users,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  ShieldCheck,
  Wrench,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface GarageProfile {
  _id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  serviceRadius: number;
  services: string[];
  openingTime?: string;
  closingTime?: string;
  weeklyOff?: string;
  is24x7: boolean;
  isAvailable: boolean;
  verificationStatus: string;
  verificationNotes?: string;
  visitingCharge?: number;
  servicePricing?: Record<string, number>;
  location?: { coordinates?: [number, number] };
}

interface MechanicRecord {
  _id: string;
  name: string;
  phone: string;
  skills: string[];
  vehicleExpertise: string[];
  experience: number;
  status: string;
}

const GarageDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [requests, setRequests] = useState<Array<{ _id: string; issueCategory: string; status: string; address: string; createdAt: string; userId?: { name?: string } }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const navItems = [
    { icon: Store, label: 'Dashboard', active: true },
    { icon: Wrench, label: 'Services' },
    { icon: Users, label: 'Mechanics' },
    { icon: ShieldCheck, label: 'Verification' },
  ];

  const fetchGarage = async () => {
    setLoadingProfile(true);
    setErrorMessage(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GARAGES.MY);
      setProfile(response.data?.data || null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load garage profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchMechanics = async () => {
    setLoadingMechanics(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MECHANICS.LIST);
      setMechanics(response.data?.data || []);
    } catch {
      setErrorMessage('Unable to load mechanics');
    } finally {
      setLoadingMechanics(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GARAGE);
      setRequests(response.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void fetchGarage();
    void fetchMechanics();
    void fetchRequests();
  }, []);

  const handleAvailabilityToggle = async () => {
    if (!profile) {
      return;
    }

    setSavingAvailability(true);
    try {
      const response = await axiosInstance.patch(API_ENDPOINTS.GARAGES.TOGGLE_AVAILABILITY, { isAvailable: !profile.isAvailable });
      setProfile((prev) => prev ? { ...prev, isAvailable: response.data?.data?.isAvailable ?? !prev.isAvailable } : prev);
      setSuccessMessage('Availability updated');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleAddService = async () => {
    if (!profile || !serviceForm.trim()) {
      return;
    }

    try {
      const nextServices = Array.from(new Set([...(profile.services || []), serviceForm.trim()]));
      const response = await axiosInstance.patch(API_ENDPOINTS.GARAGES.UPDATE, { services: nextServices });
      setProfile((prev) => prev ? { ...prev, services: response.data?.data?.services || nextServices } : prev);
      setServiceForm('');
      setSuccessMessage('Service added');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add service');
    }
  };

  const handleAddPrice = async () => {
    if (!profile || !priceForm.trim()) {
      return;
    }

    const [serviceName, priceValue] = priceForm.split(':').map((part) => part.trim());
    if (!serviceName || Number.isNaN(Number(priceValue))) {
      return;
    }

    try {
      const nextPricing = {
        ...(profile.servicePricing || {}),
        [serviceName]: Number(priceValue),
      };
      const response = await axiosInstance.patch(API_ENDPOINTS.GARAGES.UPDATE, { servicePricing: nextPricing });
      setProfile((prev) => prev ? { ...prev, servicePricing: response.data?.data?.servicePricing || nextPricing } : prev);
      setPriceForm('');
      setSuccessMessage('Pricing updated');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update pricing');
    }
  };

  const handleSubmitMechanic = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: mechanicForm.name,
        phone: mechanicForm.phone,
        skills: mechanicForm.skills.split(',').map((item) => item.trim()).filter(Boolean),
        experience: Number(mechanicForm.experience || 0),
      };

      if (editingMechanicId) {
        const response = await axiosInstance.patch(API_ENDPOINTS.MECHANICS.UPDATE(editingMechanicId), payload);
        setMechanics((prev) => prev.map((mechanic) => mechanic._id === editingMechanicId ? response.data.data : mechanic));
      } else {
        const response = await axiosInstance.post(API_ENDPOINTS.MECHANICS.CREATE, payload);
        setMechanics((prev) => [response.data.data, ...prev]);
      }

      setMechanicForm({ name: '', phone: '', skills: '', experience: '0' });
      setEditingMechanicId(null);
      setSuccessMessage(editingMechanicId ? 'Mechanic updated' : 'Mechanic added');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save mechanic');
    }
  };

  const handleDeleteMechanic = async (mechanicId: string) => {
    const confirmed = window.confirm('Delete this mechanic?');
    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(API_ENDPOINTS.MECHANICS.DELETE(mechanicId));
      setMechanics((prev) => prev.filter((mechanic) => mechanic._id !== mechanicId));
      setSuccessMessage('Mechanic removed');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete mechanic');
    }
  };

  const pricingEntries = useMemo(() => Object.entries(profile?.servicePricing || {}), [profile?.servicePricing]);

  return (
    <div className="min-h-screen bg-dark-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-dark-800 border-r border-dark-700 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">G</span>
            </div>
            <span className="text-xl font-display font-bold text-white">GarageMate</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500 text-white">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg mb-2">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Garage Owner'}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email || 'Garage owner'}</p>
            </div>
          </div>
          <button onClick={() => void logout().then(() => navigate('/'))} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-dark-700 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white">Garage Operations</h1>
            <div className="flex items-center gap-4">
              <button onClick={handleAvailabilityToggle} disabled={savingAvailability} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${profile?.isAvailable ? 'bg-green-500 text-white' : 'bg-dark-700 text-dark-300'}`}>
                {savingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : profile?.isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {profile?.isAvailable ? 'Available' : 'Offline'}
              </button>
              <button className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-dark-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {errorMessage && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>}
          {successMessage && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{successMessage}</div>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-primary-500" /></div>
                <span className="text-2xl font-bold text-white">{requests.filter((request) => !['CANCELLED', 'CLOSED', 'PAID'].includes(request.status)).length}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-400">Incoming Requests</h3>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                <span className="text-2xl font-bold text-white">{requests.filter((request) => ['MECHANIC_ASSIGNED', 'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION_STARTED', 'SERVICE_IN_PROGRESS'].includes(request.status)).length}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-400">Active Services</h3>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-500" /></div>
                <span className="text-2xl font-bold text-white">₹{profile?.visitingCharge || 99}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-400">Visiting Charge</h3>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg"><ShieldCheck className="w-6 h-6 text-blue-500" /></div>
                <span className="text-2xl font-bold text-white">{profile?.verificationStatus || 'PENDING'}</span>
              </div>
              <h3 className="text-sm font-medium text-dark-400">Verification</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6 xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Garage Profile</h3>
                {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin text-dark-400" /> : <span className="text-sm text-dark-400">{profile?.name || 'Loading...'}</span>}
              </div>
              {profile ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Garage Name</p><p className="mt-2 text-white">{profile.name}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Contact</p><p className="mt-2 text-white">{profile.phone}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Address</p><p className="mt-2 text-white">{profile.address}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">City / State</p><p className="mt-2 text-white">{profile.city}, {profile.state}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Pincode</p><p className="mt-2 text-white">{profile.pincode}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Service Radius</p><p className="mt-2 text-white">{profile.serviceRadius} km</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Working Hours</p><p className="mt-2 text-white">{profile.is24x7 ? '24x7' : `${profile.openingTime || '—'} - ${profile.closingTime || '—'}`}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Admin Feedback</p><p className="mt-2 text-white">{profile.verificationNotes || 'No feedback yet'}</p></div>
                </div>
              ) : (
                <div className="text-sm text-dark-400">No profile found yet.</div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-white">Services & Pricing</h3>
              <div className="mt-4 space-y-3">
                <input value={serviceForm} onChange={(event) => setServiceForm(event.target.value)} placeholder="Add service" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" />
                <button onClick={() => void handleAddService()} className="w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Add Service</button>
                <div className="flex flex-wrap gap-2">
                  {(profile?.services || []).map((service) => <span key={service} className="rounded-full bg-primary-500/10 px-3 py-1 text-sm text-primary-300">{service}</span>)}
                </div>
                <input value={priceForm} onChange={(event) => setPriceForm(event.target.value)} placeholder="Tyre Change:350" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" />
                <button onClick={() => void handleAddPrice()} className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">Save Pricing</button>
                <div className="space-y-2">
                  {pricingEntries.map(([service, price]) => <div key={service} className="flex items-center justify-between rounded-lg border border-dark-700 px-3 py-2 text-sm text-dark-300"><span>{service}</span><span>₹{price}</span></div>)}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
                <Link to="/garage/requests" className="text-sm text-primary-400">View all</Link>
              </div>
              <div className="mt-4 space-y-3">
                {loadingRequests ? <div className="text-sm text-dark-400">Loading requests...</div> : requests.length === 0 ? <div className="text-sm text-dark-400">No incoming requests right now.</div> : requests.slice(0, 4).map((request) => (
                  <div key={request._id} className="rounded-lg border border-dark-700 p-3 text-sm text-dark-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-white">{request.issueCategory.replace(/_/g, ' ')}</span>
                      <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-primary-300">{request.status}</span>
                    </div>
                    <p className="mt-1 text-dark-400">{request.address}</p>
                    <p className="mt-1 text-xs text-dark-500">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Mechanics</h3>
                <button onClick={() => setEditingMechanicId(null)} className="rounded-lg bg-primary-500 p-2 text-white"><Plus className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleSubmitMechanic} className="mt-4 space-y-3">
                <input value={mechanicForm.name} onChange={(event) => setMechanicForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Mechanic name" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" required />
                <input value={mechanicForm.phone} onChange={(event) => setMechanicForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" required />
                <input value={mechanicForm.skills} onChange={(event) => setMechanicForm((prev) => ({ ...prev, skills: event.target.value }))} placeholder="Skills (comma separated)" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" />
                <input type="number" value={mechanicForm.experience} onChange={(event) => setMechanicForm((prev) => ({ ...prev, experience: event.target.value }))} placeholder="Experience in years" className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white" />
                <button className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">{editingMechanicId ? 'Save Mechanic' : 'Add Mechanic'}</button>
              </form>
              <div className="mt-6 space-y-3">
                {loadingMechanics ? <div className="text-sm text-dark-400">Loading mechanics...</div> : mechanics.map((mechanic) => (
                  <div key={mechanic._id} className="rounded-lg border border-dark-700 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{mechanic.name}</p>
                        <p className="text-sm text-dark-400">{mechanic.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingMechanicId(mechanic._id); setMechanicForm({ name: mechanic.name, phone: mechanic.phone, skills: mechanic.skills.join(', '), experience: String(mechanic.experience) }); }} className="rounded-lg p-2 text-dark-300 hover:bg-dark-700"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => void handleDeleteMechanic(mechanic._id)} className="rounded-lg p-2 text-red-400 hover:bg-dark-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-white">Verification Status</h3>
              <div className="mt-4 rounded-lg border border-dark-700 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Current status</span>
                  <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm text-primary-300">{profile?.verificationStatus || 'PENDING'}</span>
                </div>
                <p className="mt-4 text-sm text-dark-300">{profile?.verificationNotes || 'Your garage is being reviewed by the admin team.'}</p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-dark-700 p-3 text-sm text-dark-300"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-400" />Location and service radius are ready for admin review.</div></div>
                <div className="rounded-lg border border-dark-700 p-3 text-sm text-dark-300"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary-400" />Working hours and 24x7 availability are visible to admins.</div></div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GarageDashboard;
