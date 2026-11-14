import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, Clock3, MapPin, UserCheck, Send, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import SubmitOfferModal from '@/components/garage/SubmitOfferModal';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Store, Wrench, Users, ShieldCheck } from 'lucide-react';

interface RequestRecord {
  _id: string; issueCategory: string; issueDescription: string; status: string;
  urgency: string; address: string; bookingFee: number; createdAt: string;
  vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string; vehicleType?: string };
  userId?: { name?: string; phone?: string };
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

const GarageRequestsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GARAGE);
      const data = res.data?.data || [];
      setRequests(data);
      if (id) {
        const match = data.find((r: RequestRecord) => r._id === id);
        setSelectedRequest(match || null);
      }
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load requests'); }
    finally { setLoading(false); }
  };

  const loadMechanics = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.MECHANICS.LIST);
      const list = res.data?.data || [];
      setMechanics(list);
      if (list[0]) setSelectedMechanicId(list[0]._id);
    } catch { /* silent */ }
  };

  const loadMyOffers = async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.OFFERS.MY_OFFERS);
      const offerMap: Record<string, Record<string, unknown>> = {};
      (res.data?.data || []).forEach((offer: Record<string, unknown>) => {
        const reqId = offer.requestId && typeof offer.requestId === 'object' ? (offer.requestId as { _id: string })._id : offer.requestId as string;
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

  const handleOfferSuccess = async () => {
    setSuccessMessage('Offer submitted successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    await loadRequests();
    await loadMyOffers();
    if (selectedRequest) {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
        setSelectedRequest(res.data?.data || selectedRequest);
      } catch { /* silent */ }
    }
  };

  const openRequest = async (request: RequestRecord) => {
    setLoadingDetails(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(request._id));
      setSelectedRequest(res.data?.data || request);
      navigate(`/garage/requests/${request._id}`);
    } catch { setSelectedRequest(request); navigate(`/garage/requests/${request._id}`); }
    finally { setLoadingDetails(false); }
  };

  const acceptRequest = async (requestId: string) => {
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ACCEPT(requestId));
      setSuccessMessage('Request accepted');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to accept'); }
    finally { setSubmitting(false); }
  };

  const rejectRequest = async (requestId: string) => {
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.REJECT(requestId));
      setSuccessMessage('Request rejected');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to reject'); }
    finally { setSubmitting(false); }
  };

  const assignMechanic = async (requestId: string) => {
    setSubmitting(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ASSIGN_MECHANIC(requestId), { mechanicId: selectedMechanicId });
      setSuccessMessage('Mechanic assigned');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to assign mechanic'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (requestId: string, status: string) => {
    setSubmitting(true);
    try {
      await axiosInstance.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), { status, notes: `Status updated to ${status}` });
      setSuccessMessage('Status updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadRequests();
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to update status'); }
    finally { setSubmitting(false); }
  };

  const availableMechanics = useMemo(() => mechanics.filter((m) => m.status === 'AVAILABLE'), [mechanics]);

  return (
    <DashboardShell navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Incoming Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">Accept, reject, assign mechanics, and advance service status.</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between gap-3">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading requests…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Request list */}
          <div className="lg:col-span-3 space-y-3">
            {requests.length === 0 ? (
              <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No requests yet"
                description="Incoming service requests will appear here when customers need assistance." />
            ) : requests.map((req) => (
              <div key={req._id}
                onClick={() => void openRequest(req)}
                className={`card p-4 cursor-pointer transition-all ${selectedRequest?._id === req._id ? 'border-orange-300' : 'hover:border-slate-300'}`}
                style={selectedRequest?._id === req._id ? { boxShadow: '0 4px 14px 0 rgba(249,115,22,0.15)' } : undefined}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{req.issueCategory.replace(/_/g, ' ')}</p>
                    {req.issueDescription && <p className="text-xs text-slate-500 mt-0.5 truncate">{req.issueDescription}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={req.status} />
                    {myOffers[req._id] && (
                      <span className="badge badge-blue text-2xs">
                        {(myOffers[req._id].status as string) === 'ACCEPTED' ? '✓ Offer Accepted' : '✓ Offer Sent'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{req.userId?.name || 'Customer'}</span>
                  <span className="flex items-center gap-1 max-w-[160px] truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{req.address}</span>
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 card p-5 self-start sticky top-20">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-base font-semibold text-slate-900 mt-2">
                    {selectedRequest.issueCategory.replace(/_/g, ' ')}
                  </h2>
                  {selectedRequest.issueDescription && (
                    <p className="text-sm text-slate-500 mt-1">{selectedRequest.issueDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Urgency', selectedRequest.urgency],
                    ['Booking Fee', `₹${selectedRequest.bookingFee}`],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm">
                  {[
                    { icon: <UserCheck className="w-4 h-4 text-slate-400" />, label: 'Customer', value: `${selectedRequest.userId?.name || '—'}\n${selectedRequest.userId?.phone || ''}` },
                    { icon: <Car className="w-4 h-4 text-slate-400" />, label: 'Vehicle', value: selectedRequest.vehicleId ? `${selectedRequest.vehicleId.brand} ${selectedRequest.vehicleId.vehicleModel} · ${selectedRequest.vehicleId.registrationNumber}` : 'Not specified' },
                    { icon: <MapPin className="w-4 h-4 text-slate-400" />, label: 'Location', value: selectedRequest.address },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">{icon}</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
                        <p className="text-xs text-slate-700 whitespace-pre-line">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Existing offer summary */}
                {myOffers[selectedRequest._id] && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-2">Your Submitted Offer</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div className="flex justify-between"><span>ETA</span><span className="font-semibold">{String(myOffers[selectedRequest._id].estimatedArrivalMinutes)} min</span></div>
                      <div className="flex justify-between"><span>Visit Fee</span><span className="font-semibold">₹{String(myOffers[selectedRequest._id].visitFee)}</span></div>
                      <div className="flex justify-between"><span>Status</span><span className="font-semibold">{String(myOffers[selectedRequest._id].status)}</span></div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {/* Submit offer */}
                  {(selectedRequest.status === 'BROADCASTED' || selectedRequest.status === 'OFFERS_RECEIVED') && !myOffers[selectedRequest._id] && (
                    <button onClick={() => setShowOfferModal(true)}
                      className="btn-primary w-full text-sm">
                      <Send className="w-4 h-4" /> Submit Your Offer
                    </button>
                  )}

                  {/* Accept / Reject */}
                  {(selectedRequest.status === 'SEARCHING_GARAGE' || selectedRequest.status === 'REQUEST_SENT') && (
                    <div className="flex gap-2">
                      <button disabled={submitting} onClick={() => void acceptRequest(selectedRequest._id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button disabled={submitting} onClick={() => void rejectRequest(selectedRequest._id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {/* Assign mechanic */}
                  {selectedRequest.status === 'GARAGE_ACCEPTED' && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700">Assign Mechanic</label>
                      <select value={selectedMechanicId} onChange={(e) => setSelectedMechanicId(e.target.value)}
                        className="input-field text-sm">
                        {availableMechanics.length === 0 ? (
                          <option value="">No available mechanics</option>
                        ) : availableMechanics.map((m) => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                      <button disabled={submitting || !selectedMechanicId} onClick={() => void assignMechanic(selectedRequest._id)}
                        className="btn-primary w-full text-sm disabled:opacity-50">
                        Assign Mechanic
                      </button>
                    </div>
                  )}

                  {/* Status advance buttons */}
                  {selectedRequest.status === 'MECHANIC_ASSIGNED' && (
                    <div className="flex gap-2">
                      <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ON_THE_WAY')}
                        className="flex-1 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        Mechanic on Way
                      </button>
                      <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ARRIVED')}
                        className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        Mechanic Arrived
                      </button>
                    </div>
                  )}

                  {selectedRequest.status === 'MECHANIC_ARRIVED' && (
                    <button onClick={() => void updateStatus(selectedRequest._id, 'INSPECTION_STARTED')}
                      className="btn-primary w-full text-sm">Start Inspection</button>
                  )}

                  {selectedRequest.status === 'QUOTATION_APPROVED' && (
                    <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_IN_PROGRESS')}
                      className="btn-primary w-full text-sm">Start Service</button>
                  )}

                  {selectedRequest.status === 'SERVICE_IN_PROGRESS' && (
                    <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_COMPLETED')}
                      className="btn-primary w-full text-sm">Mark Completed</button>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState title="No request selected" description="Click a request from the list to manage it." />
            )}
          </div>
        </div>
      )}

      {showOfferModal && selectedRequest && (
        <SubmitOfferModal
          requestId={selectedRequest._id}
          requestDetails={{ issueCategory: selectedRequest.issueCategory, address: selectedRequest.address }}
          onClose={() => setShowOfferModal(false)}
          onSuccess={handleOfferSuccess}
        />
      )}
    </DashboardShell>
  );
};

export default GarageRequestsPage;
