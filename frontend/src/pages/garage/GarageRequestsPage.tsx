/**
 * GarageRequestsPage — complete incoming request management.
 * Handles: GARAGE_SELECTED accept, ETA setting, mechanic progress,
 * service completion, real-time Socket.IO updates.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Clock, MapPin, UserCheck, Send, AlertCircle, Loader2,
  CheckCircle, XCircle, Bell, Zap, Navigation,
  Store, Wrench, Users, ShieldCheck, Timer,
  PhoneCall, Flag,
} from 'lucide-react';
import { io } from 'socket.io-client';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS, SOCKET_URL } from '@/config/api';
import SubmitOfferModal from '@/components/garage/SubmitOfferModal';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/context/AuthContext';

interface RequestRecord {
  _id: string;
  issueCategory: string;
  issueDescription: string;
  status: string;
  urgency: string;
  address: string;
  bookingFee: number;
  createdAt: string;
  estimatedArrivalMinutes?: number;
  etaSetAt?: string;
  statusHistory?: Array<{ status: string; updatedAt: string; notes?: string }>;
  vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string; vehicleType?: string };
  userId?: { _id?: string; name?: string; phone?: string; email?: string };
  garageId?: { _id?: string; name?: string };
  mechanicId?: { _id?: string; name?: string; phone?: string; status?: string };
}

interface MechanicRecord { _id: string; name: string; phone: string; status: string; }

const navItems: NavItem[] = [
  { icon: Store,       label: 'Dashboard',    path: '/garage/dashboard' },
  { icon: AlertCircle, label: 'Requests',     path: '/garage/requests' },
  { icon: Wrench,      label: 'Services',     path: '/garage/dashboard' },
  { icon: Users,       label: 'Mechanics',    path: '/garage/dashboard' },
  { icon: ShieldCheck, label: 'Verification', path: '/garage/dashboard' },
];

const ISSUE_LABELS: Record<string, string> = {
  TYRE_PUNCTURE: 'Tyre Puncture', DEAD_BATTERY: 'Battery Jump-Start',
  VEHICLE_NOT_STARTING: 'Vehicle Not Starting', FUEL_SHORTAGE: 'Fuel Delivery',
  ENGINE_OVERHEATING: 'Engine Overheating', BRAKE_ISSUE: 'Brake Repair',
  ELECTRICAL_ISSUE: 'Electrical Repair', TOWING_REQUIRED: 'Towing Service',
  MINOR_MECHANICAL: 'Minor Mechanical', OTHER: 'Other Emergency',
};

const ETA_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

// Statuses where the garage can act on this request
const INCOMING_STATUSES = ['GARAGE_SELECTED', 'SEARCHING_GARAGE', 'REQUEST_SENT'];
const ACTIVE_STATUSES   = ['GARAGE_ACCEPTED', 'MECHANIC_ASSIGNED', 'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION_STARTED', 'QUOTATION_SENT', 'QUOTATION_APPROVED', 'SERVICE_IN_PROGRESS'];
const PAID_STATUSES     = new Set(['GARAGE_SELECTED','GARAGE_ACCEPTED','MECHANIC_ASSIGNED','MECHANIC_ON_THE_WAY','MECHANIC_ARRIVED','INSPECTION_STARTED','QUOTATION_SENT','QUOTATION_APPROVED','SERVICE_IN_PROGRESS','SERVICE_COMPLETED','PAID','CLOSED']);

const GarageRequestsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [mechanics, setMechanics] = useState<MechanicRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [myOffers, setMyOffers] = useState<Record<string, Record<string, unknown>>>({});

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showETAModal, setShowETAModal] = useState(false);
  const [selectedETA, setSelectedETA] = useState(20);
  const [newRequestAlert, setNewRequestAlert] = useState<RequestRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'completed'>('incoming');

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GARAGE);
      const data: RequestRecord[] = res.data?.data || [];
      setRequests(data);
      if (id) {
        const match = data.find(r => r._id === id);
        if (match) setSelectedRequest(match);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMechanics = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.MECHANICS.LIST);
      const list: MechanicRecord[] = res.data?.data || [];
      setMechanics(list);
      if (list[0]) setSelectedMechanicId(list[0]._id);
    } catch { /* silent */ }
  };

  const loadMyOffers = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.OFFERS.MY_OFFERS);
      const offerMap: Record<string, Record<string, unknown>> = {};
      (res.data?.data || []).forEach((offer: Record<string, unknown>) => {
        const reqId = offer.requestId && typeof offer.requestId === 'object'
          ? (offer.requestId as { _id: string })._id
          : offer.requestId as string;
        if (reqId) offerMap[reqId] = offer;
      });
      setMyOffers(offerMap);
    } catch { /* silent */ }
  };

  useEffect(() => {
    void loadRequests();
    void loadMechanics();
    void loadMyOffers();
  }, [id]);

  // ── Socket.IO real-time updates ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

    // New request arrives for this garage
    socket.on('request:new', (data: { requestId: string }) => {
      void loadRequests().then(() => {
        // Find and show alert for new request
        axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(data.requestId))
          .then(res => setNewRequestAlert(res.data?.data))
          .catch(() => { /* silent */ });
      });
    });

    // Status changed — refresh selected request if it's the one being tracked
    socket.on('request:status-changed', (data: { requestId: string }) => {
      void loadRequests();
      if (selectedRequest?._id === data.requestId) {
        axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(data.requestId))
          .then(res => setSelectedRequest(res.data?.data))
          .catch(() => { /* silent */ });
      }
    });

    return () => { socket.disconnect(); };
  }, [user?._id, selectedRequest?._id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const openRequest = async (request: RequestRecord) => {
    setLoadingDetails(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(request._id));
      const full: RequestRecord = res.data?.data || request;
      setSelectedRequest(full);
      navigate(`/garage/requests/${request._id}`);
    } catch {
      setSelectedRequest(request);
      navigate(`/garage/requests/${request._id}`);
    } finally { setLoadingDetails(false); }
  };

  const acceptRequest = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ACCEPT(selectedRequest._id));
      setShowAcceptModal(false);
      showSuccess('Request accepted! Customer has been notified.');
      await loadRequests();
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
      setSelectedRequest(res.data?.data);
      setActiveTab('active');
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to accept'); }
    finally { setSubmitting(false); }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.REJECT(selectedRequest._id));
      setShowRejectModal(false);
      showSuccess('Request rejected.');
      setSelectedRequest(null);
      await loadRequests();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to reject'); }
    finally { setSubmitting(false); }
  };

  const setETA = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(API_ENDPOINTS.REQUESTS.UPDATE_ETA(selectedRequest._id), {
        estimatedArrivalMinutes: selectedETA,
      });
      setShowETAModal(false);
      showSuccess(`ETA set to ${selectedETA} minutes. Customer notified!`);
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
      setSelectedRequest(res.data?.data);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to set ETA'); }
    finally { setSubmitting(false); }
  };

  const assignMechanic = async () => {
    if (!selectedRequest || !selectedMechanicId) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ASSIGN_MECHANIC(selectedRequest._id), {
        mechanicId: selectedMechanicId,
      });
      showSuccess('Mechanic assigned!');
      await loadRequests();
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
      setSelectedRequest(res.data?.data);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to assign mechanic'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (status: string, notes?: string) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(selectedRequest._id), {
        status, notes: notes || `Status updated to ${status}`,
      });
      showSuccess(`Status updated to ${status.replace(/_/g, ' ')}`);
      await loadRequests();
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
      setSelectedRequest(res.data?.data);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to update status'); }
    finally { setSubmitting(false); }
  };

  const completeService = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(selectedRequest._id), {
        status: 'SERVICE_COMPLETED',
        notes: 'Service completed by garage owner',
      });
      setShowCompleteModal(false);
      showSuccess('Service marked as completed! Customer has been notified.');
      await loadRequests();
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
      setSelectedRequest(res.data?.data);
      setActiveTab('completed');
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to complete service'); }
    finally { setSubmitting(false); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ── Derived lists ──────────────────────────────────────────────────────────
  const incomingRequests  = useMemo(() => requests.filter(r => INCOMING_STATUSES.includes(r.status)), [requests]);
  const activeRequests    = useMemo(() => requests.filter(r => ACTIVE_STATUSES.includes(r.status)), [requests]);
  const completedRequests = useMemo(() => requests.filter(r => ['SERVICE_COMPLETED','PAID','CLOSED'].includes(r.status)), [requests]);
  const availableMechanics = useMemo(() => mechanics.filter(m => m.status === 'AVAILABLE'), [mechanics]);

  const tabRequests = activeTab === 'incoming' ? incomingRequests
    : activeTab === 'active' ? activeRequests
    : completedRequests;

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const infoRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
        <p className="text-xs text-slate-300 whitespace-pre-line">{value}</p>
      </div>
    </div>
  );

  const darkCard = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' };
  const orangeCard = { background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.30)' };

  const headerActions = (
    <div className="flex items-center gap-2">
      <NotificationBell />
    </div>
  );

  return (
    <DashboardShell navItems={navItems} headerActions={headerActions}>

      {/* ── New request alert banner ── */}
      <AnimatePresence>
        {newRequestAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-5 p-4 rounded-xl flex items-start justify-between gap-4"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.35)', boxShadow: '0 0 20px rgba(249,115,22,0.15)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#f97316' }}>
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-0.5">🔔 New Assistance Request!</p>
                <p className="text-xs text-orange-300">
                  {newRequestAlert.userId?.name || 'A customer'} needs help —{' '}
                  {ISSUE_LABELS[newRequestAlert.issueCategory] || newRequestAlert.issueCategory}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setSelectedRequest(newRequestAlert); setActiveTab('incoming'); setNewRequestAlert(null); }}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors">
                View Now
              </button>
              <button onClick={() => setNewRequestAlert(null)}
                className="px-2 py-1.5 text-slate-400 hover:text-white transition-colors text-xs">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Incoming Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {incomingRequests.length > 0
              ? `${incomingRequests.length} new request${incomingRequests.length > 1 ? 's' : ''} waiting`
              : 'No new requests'}
          </p>
        </div>
      </div>

      {/* ── Alert messages ── */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-lg text-sm text-red-400 flex items-center justify-between gap-3"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3.5 rounded-lg text-sm text-green-400 flex items-center gap-2"
          style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMessage}
        </motion.div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {[
          { key: 'incoming', label: 'New Requests', count: incomingRequests.length, color: 'orange' },
          { key: 'active',   label: 'Active Jobs',  count: activeRequests.length,   color: 'blue' },
          { key: 'completed',label: 'Completed',    count: completedRequests.length, color: 'green' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === tab.key
              ? { background: '#1e293b', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
              : { color: '#64748b' }}>
            {tab.label}
            {tab.count > 0 && (
              <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab.color === 'orange' ? 'rgba(249,115,22,0.20)' : tab.color === 'blue' ? 'rgba(59,130,246,0.20)' : 'rgba(34,197,94,0.20)',
                  color: tab.color === 'orange' ? '#fb923c' : tab.color === 'blue' ? '#60a5fa' : '#4ade80',
                }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading requests…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ── Request list ── */}
          <div className="lg:col-span-3 space-y-3">
            {tabRequests.length === 0 ? (
              <EmptyState
                icon={activeTab === 'incoming' ? <Zap className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                title={activeTab === 'incoming' ? 'No new requests' : activeTab === 'active' ? 'No active jobs' : 'No completed requests'}
                description={activeTab === 'incoming' ? 'New assistance requests will appear here when customers book your garage.' : ''}
              />
            ) : tabRequests.map(req => {
              const isSelected = selectedRequest?._id === req._id;
              const isPaid = PAID_STATUSES.has(req.status);
              const isNew = INCOMING_STATUSES.includes(req.status);
              return (
                <motion.div key={req._id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => void openRequest(req)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-150"
                  style={isSelected ? orangeCard : darkCard}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isNew && (
                          <span className="text-2xs font-bold text-orange-300 px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse"
                            style={{ background: 'rgba(249,115,22,0.15)' }}>NEW</span>
                        )}
                        <p className="text-sm font-bold text-white truncate">
                          {ISSUE_LABELS[req.issueCategory] || req.issueCategory}
                        </p>
                      </div>
                      {req.issueDescription && (
                        <p className="text-xs text-slate-500 truncate">{req.issueDescription}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={req.status} />
                      {isPaid && (
                        <span className="text-2xs font-bold text-green-400 px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.12)' }}>
                          ₹{req.bookingFee} PAID
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />{req.userId?.name || 'Customer'}
                    </span>
                    <span className="flex items-center gap-1 max-w-[160px] truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{req.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                    {req.estimatedArrivalMinutes && (
                      <span className="flex items-center gap-1 text-orange-400">
                        <Timer className="w-3 h-3" />ETA {req.estimatedArrivalMinutes} min
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Detail panel ── */}
          <div className="lg:col-span-2 self-start sticky top-20 rounded-xl p-5"
            style={darkCard}>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : selectedRequest ? (
              <div className="space-y-5">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <StatusBadge status={selectedRequest.status} />
                    {PAID_STATUSES.has(selectedRequest.status) && (
                      <span className="text-2xs font-bold text-green-400 px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        ₹{selectedRequest.bookingFee} PAID
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">
                    {ISSUE_LABELS[selectedRequest.issueCategory] || selectedRequest.issueCategory}
                  </h2>
                  {selectedRequest.issueDescription && (
                    <p className="text-xs text-slate-500 mt-1">{selectedRequest.issueDescription}</p>
                  )}
                </div>

                {/* Key info */}
                <div className="space-y-3">
                  {infoRow(<UserCheck className="w-4 h-4" />, 'Customer',
                    `${selectedRequest.userId?.name || '—'}${selectedRequest.userId?.phone ? '\n' + selectedRequest.userId.phone : ''}`)}
                  {selectedRequest.vehicleId && infoRow(<Car className="w-4 h-4" />, 'Vehicle',
                    `${selectedRequest.vehicleId.brand} ${selectedRequest.vehicleId.vehicleModel} · ${selectedRequest.vehicleId.registrationNumber}`)}
                  {infoRow(<MapPin className="w-4 h-4" />, 'Location', selectedRequest.address)}
                  {selectedRequest.userId?.phone && infoRow(<PhoneCall className="w-4 h-4" />, 'Contact', selectedRequest.userId.phone)}
                </div>

                {/* ETA badge */}
                {selectedRequest.estimatedArrivalMinutes && (
                  <div className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)' }}>
                    <Timer className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-xs font-bold text-orange-300">ETA: {selectedRequest.estimatedArrivalMinutes} minutes</p>
                      {selectedRequest.etaSetAt && (
                        <p className="text-2xs text-slate-500">Set at {new Date(selectedRequest.etaSetAt).toLocaleTimeString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Urgency */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Urgency:</span>
                  <span className={`font-bold ${selectedRequest.urgency === 'HIGH' ? 'text-red-400' : selectedRequest.urgency === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {selectedRequest.urgency}
                  </span>
                </div>

                {/* ── Action buttons by status ── */}
                <div className="space-y-2.5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                  {/* ACCEPT / REJECT for new direct bookings */}
                  {INCOMING_STATUSES.includes(selectedRequest.status) && (
                    <div className="space-y-2">
                      <button onClick={() => setShowAcceptModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                        style={{ background: '#16a34a', boxShadow: '0 4px 14px rgba(22,163,74,0.30)' }}>
                        <CheckCircle className="w-4 h-4" /> Accept Request
                      </button>
                      <button onClick={() => setShowRejectModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-colors"
                        style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
                        <XCircle className="w-4 h-4" /> Decline Request
                      </button>
                    </div>
                  )}

                  {/* After acceptance — ETA + Assign Mechanic */}
                  {selectedRequest.status === 'GARAGE_ACCEPTED' && (
                    <div className="space-y-2">
                      <button onClick={() => setShowETAModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                        style={{ background: '#f97316', boxShadow: '0 4px 14px rgba(249,115,22,0.30)' }}>
                        <Timer className="w-4 h-4" /> Set ETA
                      </button>
                      {availableMechanics.length > 0 ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Assign Mechanic</label>
                          <select value={selectedMechanicId}
                            onChange={e => setSelectedMechanicId(e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm text-white"
                            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}>
                            {availableMechanics.map(m => (
                              <option key={m._id} value={m._id}>{m.name} · {m.phone}</option>
                            ))}
                          </select>
                          <button disabled={submitting || !selectedMechanicId}
                            onClick={() => void assignMechanic()}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                            style={{ background: '#1d4ed8' }}>
                            Assign Mechanic
                          </button>
                        </div>
                      ) : (
                        // No mechanics — allow advancing to MECHANIC_ASSIGNED with demo mechanic
                        <button onClick={() => void updateStatus('MECHANIC_ASSIGNED', 'Demo mechanic assigned')}
                          disabled={submitting}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-300 disabled:opacity-40 transition-colors"
                          style={{ background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(29,78,216,0.25)' }}>
                          Mark Mechanic Assigned (Demo)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mechanic progress buttons */}
                  {selectedRequest.status === 'MECHANIC_ASSIGNED' && (
                    <div className="space-y-2">
                      <button onClick={() => setShowETAModal(true)}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-orange-400 transition-colors"
                        style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
                        <Timer className="w-3.5 h-3.5 inline mr-1" /> Update ETA
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => void updateStatus('MECHANIC_ON_THE_WAY')} disabled={submitting}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-colors"
                          style={{ background: '#f97316' }}>
                          <Navigation className="w-3.5 h-3.5 inline mr-1" /> On The Way
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'MECHANIC_ON_THE_WAY' && (
                    <button onClick={() => void updateStatus('MECHANIC_ARRIVED')} disabled={submitting}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                      style={{ background: '#1d4ed8' }}>
                      Mechanic Arrived
                    </button>
                  )}

                  {selectedRequest.status === 'MECHANIC_ARRIVED' && (
                    <button onClick={() => void updateStatus('INSPECTION_STARTED')} disabled={submitting}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                      style={{ background: '#7c3aed' }}>
                      Start Inspection
                    </button>
                  )}

                  {selectedRequest.status === 'INSPECTION_STARTED' && (
                    <button onClick={() => void updateStatus('SERVICE_IN_PROGRESS')} disabled={submitting}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                      style={{ background: '#ea580c' }}>
                      Start Service
                    </button>
                  )}

                  {selectedRequest.status === 'QUOTATION_APPROVED' && (
                    <button onClick={() => void updateStatus('SERVICE_IN_PROGRESS')} disabled={submitting}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-colors"
                      style={{ background: '#ea580c' }}>
                      Start Service
                    </button>
                  )}

                  {selectedRequest.status === 'SERVICE_IN_PROGRESS' && (
                    <button onClick={() => setShowCompleteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                      style={{ background: '#16a34a', boxShadow: '0 4px 14px rgba(22,163,74,0.30)' }}>
                      <Flag className="w-4 h-4" /> Mark Service Completed
                    </button>
                  )}

                  {/* Offer submit for broadcast requests */}
                  {(selectedRequest.status === 'BROADCASTED' || selectedRequest.status === 'OFFERS_RECEIVED') &&
                    !myOffers[selectedRequest._id] && (
                      <button onClick={() => setShowOfferModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                        style={{ background: '#f97316' }}>
                        <Send className="w-4 h-4" /> Submit Your Offer
                      </button>
                    )}
                </div>

                {/* Status timeline */}
                {(selectedRequest.statusHistory?.length ?? 0) > 0 && (
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Timeline</p>
                    <div className="space-y-0">
                      {selectedRequest.statusHistory!.slice().reverse().slice(0, 6).map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={i === 0
                                ? { background: '#f97316' }
                                : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                              {i === 0 ? <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                : <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                            </div>
                            {i < (selectedRequest.statusHistory!.length > 6 ? 5 : selectedRequest.statusHistory!.length - 1) && (
                              <div className="w-px h-5 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className={`text-xs font-semibold ${i === 0 ? 'text-orange-300' : 'text-slate-400'}`}>
                              {item.status.replace(/_/g, ' ')}
                            </p>
                            <p className="text-2xs text-slate-600">
                              {new Date(item.updatedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState title="Select a request" description="Click a request from the list to manage it." />
            )}
          </div>
        </div>
      )}

      {/* ── Accept Confirmation Modal ── */}
      <Modal open={showAcceptModal} onClose={() => setShowAcceptModal(false)}
        title="Accept Assistance Request" size="sm">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2 text-sm"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer</span>
                <span className="font-semibold text-white">{selectedRequest.userId?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue</span>
                <span className="font-semibold text-white">{ISSUE_LABELS[selectedRequest.issueCategory] || selectedRequest.issueCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle</span>
                <span className="font-semibold text-white">
                  {selectedRequest.vehicleId ? `${selectedRequest.vehicleId.brand} ${selectedRequest.vehicleId.vehicleModel}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Fee</span>
                <span className="font-bold text-green-400">₹{selectedRequest.bookingFee} PAID</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              The customer will be notified immediately. You will then be able to assign a mechanic and set an ETA.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowAcceptModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                Cancel
              </button>
              <button onClick={() => void acceptRequest()} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors"
                style={{ background: '#16a34a' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accept Request
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Confirmation Modal ── */}
      <ConfirmDialog
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={() => void rejectRequest()}
        title="Decline this request?"
        description="The customer will be notified that you are unable to accept this request at this time."
        confirmLabel="Decline Request"
        cancelLabel="Keep Request"
        loading={submitting}
        variant="danger"
      />

      {/* ── ETA Modal ── */}
      <Modal open={showETAModal} onClose={() => setShowETAModal(false)}
        title="Set Estimated Arrival Time" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">How long will it take for your mechanic to reach the customer?</p>
          <div className="grid grid-cols-4 gap-2">
            {ETA_OPTIONS.map(eta => (
              <button key={eta} onClick={() => setSelectedETA(eta)}
                className="py-2.5 rounded-lg text-sm font-bold transition-all"
                style={selectedETA === eta
                  ? { background: '#f97316', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.30)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                {eta} min
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="number" min={1} max={180} value={selectedETA}
              onChange={e => setSelectedETA(Number(e.target.value))}
              className="w-24 rounded-lg px-3 py-2.5 text-sm text-white text-center"
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }} />
            <span className="text-sm text-slate-400">minutes (custom)</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowETAModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
              Cancel
            </button>
            <button onClick={() => void setETA()} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#f97316' }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
              Set {selectedETA} min ETA
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Service Completion Modal ── */}
      <Modal open={showCompleteModal} onClose={() => setShowCompleteModal(false)}
        title="Mark Service as Completed" size="sm">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2 text-sm"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer</span>
                <span className="font-semibold text-white">{selectedRequest.userId?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Fixed</span>
                <span className="font-semibold text-white">{ISSUE_LABELS[selectedRequest.issueCategory] || selectedRequest.issueCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking ID</span>
                <span className="font-mono text-xs text-slate-300">{selectedRequest._id.slice(-10).toUpperCase()}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Confirm that the roadside assistance service has been completed. The customer will be notified.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                Cancel
              </button>
              <button onClick={() => void completeService()} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#16a34a' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Confirm Completion
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Offer Modal ── */}
      {showOfferModal && selectedRequest && (
        <SubmitOfferModal
          requestId={selectedRequest._id}
          requestDetails={{ issueCategory: selectedRequest.issueCategory, address: selectedRequest.address }}
          onClose={() => setShowOfferModal(false)}
          onSuccess={async () => {
            showSuccess('Offer submitted!');
            await loadRequests();
            await loadMyOffers();
          }}
        />
      )}
    </DashboardShell>
  );
};

export default GarageRequestsPage;
