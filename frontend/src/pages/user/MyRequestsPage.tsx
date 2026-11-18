import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, MapPin, Clock3, Trash2, Wrench, CalendarClock, Loader2, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS, SOCKET_URL } from '@/config/api';
import OffersDisplay from '@/components/user/OffersDisplay';
import UserPageLayout from '@/components/layout/UserPageLayout';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface RequestRecord {
  _id: string; issueCategory: string; issueDescription: string; status: string;
  urgency: string; address: string; bookingFee: number; createdAt: string;
  vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string; vehicleType?: string };
  garageId?: { name?: string; phone?: string };
  mechanicId?: { name?: string; phone?: string };
  statusHistory?: Array<{ status: string; updatedAt: string; notes?: string }>;
}

type FilterType = 'ACTIVE' | 'COMPLETED' | 'ALL';

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ACTIVE');
  const [offers, setOffers] = useState<unknown[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // ── Real-time status updates via Socket.IO ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !selectedRequest) return;

    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.emit('join:request', selectedRequest._id);

    socket.on('request:status-changed', (data: { requestId: string; status: string }) => {
      if (data.requestId === selectedRequest._id) {
        // Reload full request details to get latest statusHistory
        axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id))
          .then(res => setSelectedRequest(res.data?.data || null))
          .catch(() => { /* silent */ });
      }
    });

    return () => {
      socket.emit('leave:request', selectedRequest._id);
      socket.disconnect();
    };
  }, [selectedRequest?._id]);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.MY);
      const data = res.data?.data || [];
      setRequests(data);
      if (id) {
        const match = data.find((r: RequestRecord) => r._id === id);
        setSelectedRequest(match || null);
      }
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadRequests(); }, [id]);

  const openRequest = async (request: RequestRecord) => {
    setLoadingDetails(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(request._id));
      const data = res.data?.data || request;
      setSelectedRequest(data);
      navigate(`/user/requests/${request._id}`);
      if (data.status === 'BROADCASTED' || data.status === 'OFFERS_RECEIVED') {
        await loadOffersForRequest(request._id);
      } else {
        setOffers([]);
      }
    } catch {
      setSelectedRequest(request);
      navigate(`/user/requests/${request._id}`);
      setOffers([]);
    } finally { setLoadingDetails(false); }
  };

  const loadOffersForRequest = async (requestId: string) => {
    setLoadingOffers(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.OFFERS.FOR_REQUEST(requestId));
      setOffers(res.data?.data || []);
    } catch { setOffers([]); }
    finally { setLoadingOffers(false); }
  };

  const handleOfferAccepted = async () => {
    if (selectedRequest) {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
        setSelectedRequest(res.data?.data || selectedRequest);
        await loadOffersForRequest(selectedRequest._id);
        await loadRequests();
      } catch { setErrorMessage('Failed to refresh request details'); }
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.CANCEL(requestId));
      await loadRequests();
      if (selectedRequest?._id === requestId) setSelectedRequest(null);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to cancel request'); }
  };

  const filteredRequests = useMemo(() => requests.filter((r) => {
    if (activeFilter === 'COMPLETED') return ['SERVICE_COMPLETED', 'PAID', 'CLOSED'].includes(r.status);
    if (activeFilter === 'ACTIVE') return !['SERVICE_COMPLETED', 'PAID', 'CLOSED', 'CANCELLED'].includes(r.status);
    return true;
  }), [activeFilter, requests]);

  return (
    <UserPageLayout title="My Requests" subtitle="Track your assistance requests and service history.">
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between gap-3">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {(['ACTIVE', 'COMPLETED', 'ALL'] as FilterType[]).map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeFilter === f ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading requests…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Request list */}
          <div className="lg:col-span-3 space-y-3">
            {filteredRequests.length === 0 ? (
              <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No requests found"
                description={activeFilter === 'ACTIVE' ? 'No active requests. Create one from the emergency page.' : 'No requests match this filter.'} />
            ) : filteredRequests.map((req) => (
              <div key={req._id}
                onClick={() => void openRequest(req)}
                className={`card p-4 cursor-pointer transition-all ${selectedRequest?._id === req._id ? 'border-orange-300' : 'hover:border-slate-300'}`}
                style={selectedRequest?._id === req._id ? { boxShadow: '0 4px 14px 0 rgba(249,115,22,0.15)' } : undefined}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{req.issueCategory.replace(/_/g, ' ')}</p>
                    {req.issueDescription && <p className="text-xs text-slate-500 mt-0.5 truncate">{req.issueDescription}</p>}
                  </div>
                  <StatusBadge status={req.status} className="flex-shrink-0" />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />{req.vehicleId?.brand || 'Vehicle'}</span>
                  <span className="flex items-center gap-1 max-w-[160px] truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{req.address}</span>
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 card p-5 self-start sticky top-20">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
              </div>
            ) : selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-base font-semibold text-white mt-2">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
                  {selectedRequest.issueDescription && (
                    <p className="text-sm text-slate-500 mt-1">{selectedRequest.issueDescription}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Urgency */}
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Urgency</p>
                    <p className="text-sm font-semibold text-white">{selectedRequest.urgency}</p>
                  </div>
                  {/* Booking Fee + payment status */}
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
                    <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Booking Fee</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">₹{selectedRequest.bookingFee}</span>
                      {!['DRAFT', 'PAYMENT_PENDING', 'CANCELLED'].includes(selectedRequest.status) && (
                        <span className="text-2xs font-bold text-green-400 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }}>
                          PAID
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  {[
                    { icon: <Car className="w-4 h-4 text-slate-400" />, label: 'Vehicle', value: selectedRequest.vehicleId ? `${selectedRequest.vehicleId.brand} ${selectedRequest.vehicleId.vehicleModel} · ${selectedRequest.vehicleId.registrationNumber}` : 'Not specified' },
                    { icon: <MapPin className="w-4 h-4 text-slate-400" />, label: 'Location', value: selectedRequest.address },
                    { icon: <Wrench className="w-4 h-4 text-slate-400" />, label: 'Garage', value: selectedRequest.garageId?.name || 'Pending assignment' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">{icon}</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
                        <p className="text-slate-300 text-xs">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Offers */}
                {(selectedRequest.status === 'BROADCASTED' || selectedRequest.status === 'OFFERS_RECEIVED') && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2.5">Available Offers</p>
                    {loadingOffers ? (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading offers…
                      </div>
                    ) : (
                      <OffersDisplay requestId={selectedRequest._id} offers={offers as Parameters<typeof OffersDisplay>[0]['offers']} onOfferAccepted={handleOfferAccepted} />
                    )}
                  </div>
                )}

                {/* Status timeline */}
                {(selectedRequest.statusHistory?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" /> Timeline
                    </p>
                    <div className="space-y-2">
                      {selectedRequest.statusHistory!.map((item) => (
                        <div key={`${item.status}-${item.updatedAt}`}
                          className="flex items-start gap-2.5 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700">{item.status.replace(/_/g, ' ')}</span>
                            <span className="text-slate-400 ml-2">{new Date(item.updatedAt).toLocaleDateString('en-IN')}</span>
                            {item.notes && <p className="text-slate-500 mt-0.5">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancel */}
                {!['CANCELLED', 'CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(selectedRequest.status) && (
                  <button onClick={() => void cancelRequest(selectedRequest._id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 mt-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Cancel this request
                  </button>
                )}
              </div>
            ) : (
              <EmptyState title="No request selected" description="Click a request from the list to see its details." />
            )}
          </div>
        </div>
      )}
    </UserPageLayout>
  );
};

export default MyRequestsPage;
