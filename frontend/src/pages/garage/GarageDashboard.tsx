import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Store,
  Bell,
  LogOut,
  Menu,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Users,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  Wrench,
  ToggleLeft,
  ToggleRight,
  Phone,
  MapPin,
  Car,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS, SOCKET_URL } from '@/config/api';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

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
  const [requests, setRequests] = useState<Array<{ _id: string; issueCategory: string; status: string; address: string; createdAt: string; userId?: { name?: string; phone?: string }; vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string } }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'services' | 'mechanics' | 'verification' | 'requests'>('dashboard');
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const navItems = [
    { icon: Store, label: 'Dashboard', key: 'dashboard' as const },
    { icon: AlertCircle, label: 'Requests', key: 'requests' as const },
    { icon: Wrench, label: 'Services', key: 'services' as const },
    { icon: Users, label: 'Mechanics', key: 'mechanics' as const },
    { icon: ShieldCheck, label: 'Verification', key: 'verification' as const },
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

    // Initialize Socket.IO connection for real-time updates
    const token = localStorage.getItem('accessToken');
    if (token) {
      const socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected for garage owner');
      });

      // Listen for new requests
      socketInstance.on('request:new', (data: any) => {
        console.log('🔔 New request received:', data);
        setNewRequestAlert(true);
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => console.log('Audio play failed'));
        // Auto-refresh requests
        void fetchRequests();
        // Clear alert after 5 seconds
        setTimeout(() => setNewRequestAlert(false), 5000);
      });

      // Listen for request status updates
      socketInstance.on('request:status-changed', (data: any) => {
        console.log('📝 Request status updated:', data);
        void fetchRequests();
      });

      socketInstance.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        socketInstance.disconnect();
      };
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-dark-900 to-dark-800">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-gradient-to-b from-dark-900 to-dark-800 border-r-2 border-orange-500/20 z-50 transform transition-transform lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-4 border-b-2 border-orange-500/20 flex-shrink-0">
          <h2 className="text-xl font-bold text-orange-500">GarageMate</h2>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.label} 
              onClick={() => {
                setActiveSection(item.key);
                setSidebarOpen(false);
                if (item.key === 'requests') {
                  setNewRequestAlert(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-all relative ${
                activeSection === item.key 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-l-4 border-orange-400' 
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.key === 'requests' && newRequestAlert && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              {item.key === 'requests' && requests.filter(r => r.status === 'BROADCASTED' || r.status === 'OFFERS_RECEIVED' || r.status === 'SEARCHING_GARAGE').length > 0 && !newRequestAlert && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
                  {requests.filter(r => r.status === 'BROADCASTED' || r.status === 'OFFERS_RECEIVED' || r.status === 'SEARCHING_GARAGE').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4 border-t-2 border-orange-500/20">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-dark-700 to-dark-800 rounded-lg mb-2 border border-orange-500/20">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Garage Owner'}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email || 'Garage owner'}</p>
            </div>
          </div>
          <button onClick={() => void logout().then(() => navigate('/'))} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-dark-700 rounded-lg transition-all hover:scale-105">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-gradient-to-r from-dark-900 to-dark-800 border-b-2 border-orange-500/30 sticky top-0 z-30 shadow-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white hover:text-orange-500">
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-white">
                {activeSection === 'dashboard' && 'Garage Operations'}
                {activeSection === 'requests' && 'Incoming Requests'}
                {activeSection === 'services' && 'Services & Pricing'}
                {activeSection === 'mechanics' && 'Mechanics Management'}
                {activeSection === 'verification' && 'Verification Status'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:scale-105 transition-transform">
                <GarageMateLogoIcon size={40} showText={false} />
              </Link>
              <button onClick={handleAvailabilityToggle} disabled={savingAvailability} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105 ${profile?.isAvailable ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'}`}>
                {savingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : profile?.isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {profile?.isAvailable ? 'Available' : 'Offline'}
              </button>
              <button className="relative p-2 hover:bg-dark-700 rounded-lg transition-all hover:scale-110">
                <Bell className="w-6 h-6 text-orange-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {errorMessage && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>}
          {successMessage && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{successMessage}</div>}

          {/* DASHBOARD SECTION */}
          {activeSection === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 border-2 border-orange-400 shadow-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><AlertCircle className="w-6 h-6 text-white" /></div>
                <span className="text-3xl font-bold text-white">{requests.filter((request) => !['CANCELLED', 'CLOSED', 'PAID'].includes(request.status)).length}</span>
              </div>
              <h3 className="text-sm font-medium text-white/90">Incoming Requests</h3>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 border-2 border-green-400 shadow-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><CheckCircle className="w-6 h-6 text-white" /></div>
                <span className="text-3xl font-bold text-white">{requests.filter((request) => ['MECHANIC_ASSIGNED', 'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION_STARTED', 'SERVICE_IN_PROGRESS'].includes(request.status)).length}</span>
              </div>
              <h3 className="text-sm font-medium text-white/90">Active Services</h3>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl p-6 border-2 border-yellow-400 shadow-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><DollarSign className="w-6 h-6 text-white" /></div>
                <span className="text-3xl font-bold text-white">₹{profile?.visitingCharge || 99}</span>
              </div>
              <h3 className="text-sm font-medium text-white/90">Visiting Charge</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 border-2 border-blue-400 shadow-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><ShieldCheck className="w-6 h-6 text-white" /></div>
                <span className="text-xl font-bold text-white">{profile?.verificationStatus || 'PENDING'}</span>
              </div>
              <h3 className="text-sm font-medium text-white/90">Verification</h3>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-dark-700 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wide text-dark-500">Total Services</span>
                        <span className="text-2xl font-bold text-white">{profile?.services?.length || 0}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-dark-700 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wide text-dark-500">Mechanics</span>
                        <span className="text-2xl font-bold text-white">{mechanics.length}</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-dark-700 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wide text-dark-500">Visiting Charge</span>
                        <span className="text-2xl font-bold text-white">₹{profile?.visitingCharge || 99}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
                    <Link to="/garage/requests" className="text-sm text-primary-400 hover:text-primary-300">View all</Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {loadingRequests ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-dark-400" />
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-dark-600 mx-auto mb-3" />
                        <p className="text-sm text-dark-400">No requests yet</p>
                      </div>
                    ) : (
                      requests.slice(0, 5).map((request) => (
                        <div key={request._id} className="rounded-lg border border-dark-700 p-3 text-sm text-dark-300 hover:border-primary-500/30 transition-colors cursor-pointer" onClick={() => navigate('/garage/requests')}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-medium text-white">{request.issueCategory.replace(/_/g, ' ')}</span>
                            <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-primary-300">{request.status}</span>
                          </div>
                          <p className="text-dark-400 text-xs mb-1">{request.address}</p>
                          <p className="text-xs text-dark-500">{new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Verification Status</h3>
                  </div>
                  <div className="rounded-lg border border-dark-700 p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-dark-400">Current Status</span>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                        profile?.verificationStatus === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                        profile?.verificationStatus === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {profile?.verificationStatus || 'PENDING'}
                      </span>
                    </div>
                    {profile?.verificationNotes && (
                      <p className="text-sm text-dark-300 mt-2">{profile.verificationNotes}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveSection('verification')}
                      className="w-full rounded-lg bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-2 border-orange-500/30 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/30 transition-all hover:scale-105"
                    >
                      View Full Verification Details
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* SERVICES SECTION */}
          {activeSection === 'services' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Manage Services</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Add New Service</label>
                    <div className="flex gap-2">
                      <input 
                        value={serviceForm} 
                        onChange={(event) => setServiceForm(event.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && void handleAddService()}
                        placeholder="e.g., Tyre Change" 
                        className="flex-1 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                      />
                      <button 
                        onClick={() => void handleAddService()} 
                        className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Visiting Charge</label>
                    <div className="rounded-lg border border-dark-700 p-3 bg-dark-900">
                      <span className="text-2xl font-bold text-white">₹{profile?.visitingCharge || 99}</span>
                      <span className="text-sm text-dark-400 ml-2">per visit</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-md font-semibold text-white mb-4">Available Services ({profile?.services?.length || 0})</h4>
                  {(profile?.services || []).length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-dark-700 rounded-lg">
                      <Wrench className="h-12 w-12 text-dark-600 mx-auto mb-3" />
                      <p className="text-sm text-dark-400">No services added yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {(profile?.services || []).map((service) => (
                        <div key={service} className="rounded-lg bg-primary-500/10 border border-primary-500/20 px-4 py-3 text-sm text-primary-300 flex items-center justify-between">
                          <span>{service}</span>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Service Pricing</h3>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">Add/Update Service Price</label>
                  <div className="flex gap-2">
                    <input 
                      value={priceForm} 
                      onChange={(event) => setPriceForm(event.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && void handleAddPrice()}
                      placeholder="Service Name:Price (e.g., Tyre Change:350)" 
                      className="flex-1 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                    />
                    <button 
                      onClick={() => void handleAddPrice()} 
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-dark-500 mt-2">Format: ServiceName:Price (e.g., "Tyre Change:350")</p>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-white mb-4">Current Pricing ({pricingEntries.length} services)</h4>
                  {pricingEntries.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-dark-700 rounded-lg">
                      <DollarSign className="h-12 w-12 text-dark-600 mx-auto mb-3" />
                      <p className="text-sm text-dark-400">No pricing set yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pricingEntries.map(([service, price]) => (
                        <div key={service} className="flex items-center justify-between rounded-lg border border-dark-700 px-4 py-3 hover:border-primary-500/30 transition-colors">
                          <span className="text-sm text-white font-medium">{service}</span>
                          <span className="text-lg font-bold text-primary-400">₹{price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}

          {/* REQUESTS SECTION */}
          {activeSection === 'requests' && (
            <>
              {newRequestAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 flex items-center gap-3"
                >
                  <div className="flex h-12 w-12">
                    <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-75"></span>
                    <Bell className="relative h-12 w-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg">New Request Received!</p>
                    <p className="text-red-100 text-sm">A user needs assistance right now</p>
                  </div>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
                    <p className="text-sm text-dark-400 mt-1">Real-time assistance requests from users</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-dark-300">Live</span>
                    </div>
                    <button
                      onClick={() => void fetchRequests()}
                      className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <Loader2 className={`h-4 w-4 text-dark-300 ${loadingRequests ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 mb-6 md:grid-cols-3">
                  <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-400 uppercase tracking-wide">New Requests</span>
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {requests.filter(r => r.status === 'BROADCASTED' || r.status === 'OFFERS_RECEIVED' || r.status === 'SEARCHING_GARAGE').length}
                    </p>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-400 uppercase tracking-wide">Active</span>
                      <Clock className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {requests.filter(r => ['MECHANIC_ASSIGNED', 'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'SERVICE_IN_PROGRESS'].includes(r.status)).length}
                    </p>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dark-400 uppercase tracking-wide">Total Today</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{requests.length}</p>
                  </div>
                </div>

                {loadingRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-dark-400" />
                    <span className="ml-3 text-dark-400">Loading requests...</span>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-dark-700 rounded-lg">
                    <AlertCircle className="h-16 w-16 text-dark-600 mx-auto mb-4" />
                    <p className="text-sm text-dark-400 mb-2">No requests yet</p>
                    <p className="text-xs text-dark-500">You'll be notified when users send assistance requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request, index) => (
                      <motion.div
                        key={request._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-lg border ${
                          selectedRequestId === request._id 
                            ? 'border-primary-500 bg-primary-500/5' 
                            : 'border-dark-700 hover:border-dark-600'
                        } p-4 cursor-pointer transition-all`}
                        onClick={() => setSelectedRequestId(request._id === selectedRequestId ? null : request._id)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-white font-semibold">{request.issueCategory.replace(/_/g, ' ')}</h4>
                              {(request.status === 'BROADCASTED' || request.status === 'OFFERS_RECEIVED') && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full animate-pulse">
                                  ● NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-dark-400 mb-3">{request.address}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-dark-400">
                              {request.userId?.name && (
                                <span className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {request.userId.name}
                                </span>
                              )}
                              {request.userId?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {request.userId.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(request.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'BROADCASTED' || request.status === 'OFFERS_RECEIVED' 
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : request.status.includes('MECHANIC') || request.status.includes('SERVICE')
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {request.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {selectedRequestId === request._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-dark-700"
                          >
                            <div className="grid gap-4 md:grid-cols-2 mb-4">
                              {request.vehicleId && (
                                <div className="bg-dark-900 rounded-lg p-3 border border-dark-700">
                                  <p className="text-xs text-dark-400 mb-2">Vehicle Details</p>
                                  <p className="text-sm text-white font-medium">
                                    {request.vehicleId.brand} {request.vehicleId.vehicleModel}
                                  </p>
                                  <p className="text-xs text-dark-400 mt-1">{request.vehicleId.registrationNumber}</p>
                                </div>
                              )}
                              <div className="bg-dark-900 rounded-lg p-3 border border-dark-700">
                                <p className="text-xs text-dark-400 mb-2">Location</p>
                                <p className="text-sm text-white flex items-start gap-2">
                                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <span>{request.address}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(request.status === 'BROADCASTED' || request.status === 'OFFERS_RECEIVED') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/garage/requests/${request._id}`);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg font-medium"
                                >
                                  <Send className="h-4 w-4" />
                                  Submit Offer
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/garage/requests/${request._id}`);
                                }}
                                className="flex-1 px-4 py-2 border border-dark-600 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Real-Time Notifications</h4>
                    <p className="text-sm text-dark-300 leading-relaxed">
                      You'll receive instant notifications when users send assistance requests. 
                      Submit your offers quickly to win more customers!
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-dark-400">Connected & Monitoring</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* MECHANICS SECTION */}
          {activeSection === 'mechanics' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Add/Edit Mechanic</h3>
                  {editingMechanicId && (
                    <button
                      onClick={() => {
                        setEditingMechanicId(null);
                        setMechanicForm({ name: '', phone: '', skills: '', experience: '0' });
                      }}
                      className="text-sm text-dark-400 hover:text-white"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleSubmitMechanic} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Name *</label>
                    <input 
                      value={mechanicForm.name} 
                      onChange={(event) => setMechanicForm((prev) => ({ ...prev, name: event.target.value }))} 
                      placeholder="Mechanic name" 
                      className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Phone *</label>
                    <input 
                      value={mechanicForm.phone} 
                      onChange={(event) => setMechanicForm((prev) => ({ ...prev, phone: event.target.value }))} 
                      placeholder="Phone number" 
                      className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Skills</label>
                    <input 
                      value={mechanicForm.skills} 
                      onChange={(event) => setMechanicForm((prev) => ({ ...prev, skills: event.target.value }))} 
                      placeholder="Skills (comma separated)" 
                      className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Experience (years)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={mechanicForm.experience} 
                      onChange={(event) => setMechanicForm((prev) => ({ ...prev, experience: event.target.value }))} 
                      placeholder="Years of experience" 
                      className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      type="submit"
                      className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                      {editingMechanicId ? 'Update Mechanic' : 'Add Mechanic'}
                    </button>
                  </div>
                </form>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Team Members ({mechanics.length})</h3>
                {loadingMechanics ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-dark-400" />
                  </div>
                ) : mechanics.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-dark-700 rounded-lg">
                    <Users className="h-16 w-16 text-dark-600 mx-auto mb-4" />
                    <p className="text-sm text-dark-400 mb-2">No mechanics added yet</p>
                    <p className="text-xs text-dark-500">Add your first team member above</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mechanics.map((mechanic) => (
                      <div key={mechanic._id} className="rounded-lg border border-dark-700 p-4 hover:border-primary-500/30 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-white">{mechanic.name}</p>
                            <p className="text-sm text-dark-400 mt-1">{mechanic.phone}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { 
                                setEditingMechanicId(mechanic._id); 
                                setMechanicForm({ 
                                  name: mechanic.name, 
                                  phone: mechanic.phone, 
                                  skills: mechanic.skills.join(', '), 
                                  experience: String(mechanic.experience) 
                                }); 
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }} 
                              className="rounded-lg p-2 text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => void handleDeleteMechanic(mechanic._id)} 
                              className="rounded-lg p-2 text-red-400 hover:bg-dark-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {mechanic.skills && mechanic.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {mechanic.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="rounded bg-primary-500/10 px-2 py-1 text-xs text-primary-300">
                                {skill}
                              </span>
                            ))}
                            {mechanic.skills.length > 3 && (
                              <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-400">
                                +{mechanic.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-dark-400 mt-3 pt-3 border-t border-dark-700">
                          <span>{mechanic.experience || 0} yrs exp</span>
                          <span className={`px-2 py-1 rounded ${mechanic.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
                            {mechanic.status || 'AVAILABLE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* VERIFICATION SECTION */}
          {activeSection === 'verification' && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Verification Status</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-dark-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-dark-400">Current Status</span>
                      <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        profile?.verificationStatus === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                        profile?.verificationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                        profile?.verificationStatus === 'CHANGES_REQUESTED' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {profile?.verificationStatus || 'PENDING'}
                      </span>
                    </div>
                    {profile?.verificationStatus === 'APPROVED' && (
                      <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-400">Verified Garage</p>
                          <p className="text-xs text-green-300/70 mt-1">Your garage is approved and visible to users</p>
                        </div>
                      </div>
                    )}
                    {profile?.verificationStatus === 'REJECTED' && (
                      <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-400">Verification Rejected</p>
                          <p className="text-xs text-red-300/70 mt-1">Please check the admin feedback below</p>
                        </div>
                      </div>
                    )}
                    {(!profile?.verificationStatus || profile?.verificationStatus === 'PENDING') && (
                      <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-400">Under Review</p>
                          <p className="text-xs text-blue-300/70 mt-1">Admin is reviewing your garage profile</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-dark-700 p-6">
                    <h4 className="text-sm font-semibold text-white mb-4">Admin Feedback</h4>
                    {profile?.verificationNotes ? (
                      <div className="rounded-lg bg-dark-900 border border-dark-700 p-4">
                        <p className="text-sm text-dark-300 leading-relaxed">{profile.verificationNotes}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-dark-700 rounded-lg">
                        <p className="text-sm text-dark-400">No feedback yet</p>
                        <p className="text-xs text-dark-500 mt-1">Admin will provide feedback after review</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Verification Checklist</h3>
                <div className="space-y-3">
                  <div className="rounded-lg border border-dark-700 p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Basic Information</p>
                      <p className="text-xs text-dark-400 mt-1">Garage name, contact, and address are complete</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dark-700 p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Location Details</p>
                      <p className="text-xs text-dark-400 mt-1">Service radius: {profile?.serviceRadius || 0} km</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dark-700 p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Working Hours</p>
                      <p className="text-xs text-dark-400 mt-1">
                        {profile?.is24x7 ? '24x7 Available' : `${profile?.openingTime || '—'} to ${profile?.closingTime || '—'}`}
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-lg border border-dark-700 p-4 flex items-start gap-3 ${(profile?.services || []).length > 0 ? '' : 'opacity-50'}`}>
                    {(profile?.services || []).length > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Services Offered</p>
                      <p className="text-xs text-dark-400 mt-1">
                        {(profile?.services || []).length > 0 
                          ? `${profile?.services?.length} services added` 
                          : 'No services added yet'}
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-lg border border-dark-700 p-4 flex items-start gap-3 ${mechanics.length > 0 ? '' : 'opacity-50'}`}>
                    {mechanics.length > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Team Members</p>
                      <p className="text-xs text-dark-400 mt-1">
                        {mechanics.length > 0 
                          ? `${mechanics.length} mechanic${mechanics.length > 1 ? 's' : ''} added` 
                          : 'No mechanics added yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default GarageDashboard;
