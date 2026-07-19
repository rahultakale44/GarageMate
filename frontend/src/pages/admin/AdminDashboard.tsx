import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Users,
  Store,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  FileText,
  Loader2,
  Check,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface GarageReviewItem {
  _id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  verificationStatus: string;
  verificationNotes?: string;
  services?: string[];
  owner?: { name?: string; email?: string; phone?: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifications, setVerifications] = useState<GarageReviewItem[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<GarageReviewItem | null>(null);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');

  const navItems = [
    { icon: TrendingUp, label: 'Overview', active: true },
    { icon: Users, label: 'Users' },
    { icon: Store, label: 'Garages' },
    { icon: CheckCircle, label: 'Verifications' },
    { icon: AlertCircle, label: 'Requests' },
    { icon: DollarSign, label: 'Payments' },
    { icon: FileText, label: 'Complaints' },
  ];

  const fetchQueue = async (status = filter) => {
    setLoadingVerifications(true);
    setErrorMessage(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.VERIFICATIONS, { params: { status } });
      setVerifications(response.data?.data || []);
      if ((response.data?.data || []).length > 0) {
        setSelectedGarage(response.data.data[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load verification queue');
    } finally {
      setLoadingVerifications(false);
    }
  };

  useEffect(() => {
    void fetchQueue(filter);
  }, [filter]);

  const openGarage = async (garage: GarageReviewItem) => {
    setLoadingDetails(true);
    setSelectedGarage(garage);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.GARAGE_DETAILS(garage._id));
      setSelectedGarage(response.data?.data || garage);
    } catch {
      setSelectedGarage(garage);
    } finally {
      setLoadingDetails(false);
    }
  };

  const performAction = async (action: 'approve' | 'reject' | 'changes' | 'suspend' | 'reactivate', reason?: string) => {
    if (!selectedGarage) {
      return;
    }

    try {
      const payload = reason ? { reason } : action === 'changes' ? { notes: reason || 'Please update the profile details.' } : {};
      const endpoint = action === 'approve'
        ? API_ENDPOINTS.ADMIN.APPROVE_GARAGE(selectedGarage._id)
        : action === 'reject'
          ? API_ENDPOINTS.ADMIN.REJECT_GARAGE(selectedGarage._id)
          : action === 'changes'
            ? API_ENDPOINTS.ADMIN.REQUEST_CHANGES(selectedGarage._id)
            : action === 'suspend'
              ? API_ENDPOINTS.ADMIN.SUSPEND_GARAGE(selectedGarage._id)
              : API_ENDPOINTS.ADMIN.REACTIVATE_GARAGE(selectedGarage._id);

      await axiosInstance.patch(endpoint, payload);
      setSuccessMessage(`Garage ${action}d successfully`);
      await fetchQueue(filter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {sidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />)}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-dark-800 border-r border-dark-700 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-display font-bold text-white">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white"><X size={24} /></button>
        </div>
        <nav className="p-4 space-y-2">{navItems.map((item) => <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active ? 'bg-primary-500 text-white' : 'text-dark-300 hover:bg-dark-700'}`}><item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></button>)}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg mb-2">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user?.name || 'Administrator'}</p><p className="text-xs text-dark-400 truncate">{user?.email || 'admin@garagemate.com'}</p></div>
          </div>
          <button onClick={() => void logout().then(() => navigate('/'))} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-dark-700 rounded-lg transition-colors"><LogOut className="w-5 h-5" /><span className="font-medium">Logout</span></button>
        </div>
      </aside>
      <div className="lg:ml-64">
        <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white"><Menu size={24} /></button>
            <h1 className="text-xl font-semibold text-white">Verification Queue</h1>
            <button className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors"><Bell className="w-6 h-6 text-dark-300" /><span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" /></button>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {errorMessage && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>}
          {successMessage && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{successMessage}</div>}
          <div className="flex gap-2">
            {['PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-full px-3 py-2 text-sm ${filter === status ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 border border-dark-700'}`}>{status}</button>)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700">
              <div className="p-6 border-b border-dark-700 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Verification Queue</h3><span className="text-sm text-dark-400">{loadingVerifications ? 'Loading...' : `${verifications.length} items`}</span></div>
              <div className="divide-y divide-dark-700">
                {loadingVerifications ? <div className="p-6 text-sm text-dark-400">Loading queue...</div> : verifications.length === 0 ? <div className="p-6 text-sm text-dark-400">No garage applications match this filter.</div> : verifications.map((garage) => <button key={garage._id} onClick={() => void openGarage(garage)} className="w-full p-6 text-left hover:bg-dark-700/50 transition-colors"><div className="flex items-start justify-between gap-3"><div><h4 className="font-medium text-white">{garage.name}</h4><p className="text-sm text-dark-400">Owner: {garage.owner?.name || 'Unknown'}</p><p className="text-xs text-dark-500 mt-1">{garage.city}, {garage.state}</p></div><span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs text-primary-300">{garage.verificationStatus}</span></div></button>)}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Garage Review</h3>{loadingDetails ? <Loader2 className="h-4 w-4 animate-spin text-dark-400" /> : null}</div>
              {selectedGarage ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Garage</p><p className="mt-2 text-white">{selectedGarage.name}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Owner details</p><p className="mt-2 text-white">{selectedGarage.owner?.name || 'Unknown'}</p><p className="text-sm text-dark-400">{selectedGarage.owner?.email || 'No email'}</p><p className="text-sm text-dark-400">{selectedGarage.owner?.phone || 'No phone'}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Services & location</p><p className="mt-2 text-white">{selectedGarage.services?.join(', ') || 'No services listed'}</p><p className="text-sm text-dark-400">{selectedGarage.city}, {selectedGarage.state}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Admin notes</p><p className="mt-2 text-white">{selectedGarage.verificationNotes || 'No notes yet'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void performAction('approve')} className="rounded-lg bg-green-500 px-3 py-2 text-sm text-white"><Check className="mr-1 inline h-4 w-4" />Approve</button>
                    <button onClick={() => void performAction('reject', 'Documents are incomplete')} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"><XCircle className="mr-1 inline h-4 w-4" />Reject</button>
                    <button onClick={() => void performAction('changes', 'Please update your service details and address.')} className="rounded-lg bg-yellow-500 px-3 py-2 text-sm text-white"><RefreshCw className="mr-1 inline h-4 w-4" />Request changes</button>
                    <button onClick={() => void performAction('suspend')} className="rounded-lg bg-dark-700 px-3 py-2 text-sm text-white">Suspend</button>
                    <button onClick={() => void performAction('reactivate')} className="rounded-lg bg-primary-500 px-3 py-2 text-sm text-white">Reactivate</button>
                  </div>
                </div>
              ) : <div className="mt-4 text-sm text-dark-400">Select a garage from the queue.</div>}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
