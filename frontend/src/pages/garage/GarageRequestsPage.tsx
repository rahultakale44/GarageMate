import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Car, Clock3, MapPin, UserCheck, Send, Home } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import SubmitOfferModal from '@/components/garage/SubmitOfferModal';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

interface RequestRecord {
  _id: string;
  issueCategory: string;
  issueDescription: string;
  status: string;
  urgency: string;
  address: string;
  bookingFee: number;
  createdAt: string;
  vehicleId?: { brand?: string; vehicleModel?: string; registrationNumber?: string; vehicleType?: string };
  userId?: { name?: string; phone?: string };
  mechanicId?: { _id?: string; name?: string; phone?: string; status?: string };
}

interface MechanicRecord {
  _id: string;
  name: string;
  phone: string;
  status: string;
}

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
  const [myOffers, setMyOffers] = useState<Record<string, any>>({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GARAGE);
      setRequests(response.data?.data || []);
      if (id) {
        const match = (response.data?.data || []).find((item: RequestRecord) => item._id === id);
        setSelectedRequest(match || null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadMechanics = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.MECHANICS.LIST);
      const mechanicList = response.data?.data || [];
      setMechanics(mechanicList);
      if (mechanicList[0]) {
        setSelectedMechanicId(mechanicList[0]._id);
      }
    } catch {
      setErrorMessage('Unable to load mechanics');
    }
  };

  const loadMyOffers = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.OFFERS.MY_OFFERS);
      const offers = response.data?.data || [];
      // Create a map of requestId -> offer
      const offerMap: Record<string, any> = {};
      offers.forEach((offer: any) => {
        if (offer.requestId && typeof offer.requestId === 'object' && offer.requestId._id) {
          offerMap[offer.requestId._id] = offer;
        } else if (typeof offer.requestId === 'string') {
          offerMap[offer.requestId] = offer;
        }
      });
      setMyOffers(offerMap);
    } catch (error) {
      console.error('Failed to load offers:', error);
    }
  };

  useEffect(() => {
    void loadRequests();
    void loadMechanics();
    void loadMyOffers();
  }, [id]);

  const handleOfferSuccess = async () => {
    setSuccessMessage('Offer submitted successfully');
    await loadRequests();
    await loadMyOffers();
    if (selectedRequest) {
      // Reload the selected request details
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
        setSelectedRequest(response.data?.data || selectedRequest);
      } catch {
        // Silently fail
      }
    }
  };

  const openRequest = async (request: RequestRecord) => {
    setLoadingDetails(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(request._id));
      setSelectedRequest(response.data?.data || request);
      navigate(`/garage/requests/${request._id}`);
    } catch {
      setSelectedRequest(request);
      navigate(`/garage/requests/${request._id}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ACCEPT(requestId));
      setSuccessMessage('Request accepted');
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to accept request');
    } finally {
      setSubmitting(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.REJECT(requestId));
      setSuccessMessage('Request rejected');
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const assignMechanic = async (requestId: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.ASSIGN_MECHANIC(requestId), { mechanicId: selectedMechanicId });
      setSuccessMessage('Mechanic assigned');
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to assign mechanic');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (requestId: string, status: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await axiosInstance.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), { status, notes: `Status updated to ${status}` });
      setSuccessMessage('Status updated');
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const availableMechanics = useMemo(() => mechanics.filter((mechanic) => mechanic.status === 'AVAILABLE'), [mechanics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-dark-900 to-dark-800 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="hover:scale-105 transition-transform"
              title="Go to Home"
            >
              <GarageMateLogoIcon size={45} showText={false} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">Incoming Requests</h1>
              <p className="text-sm text-dark-400">Accept, reject, assign mechanics, and advance service status.</p>
            </div>
          </div>
          <Link 
            to="/garage/dashboard" 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
        </div>

        {errorMessage && <div className="mb-4 rounded-lg border-2 border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-md">{errorMessage}</div>}
        {successMessage && <div className="mb-4 rounded-lg border-2 border-green-400 bg-green-500/10 px-4 py-3 text-sm text-green-300 shadow-md">{successMessage}</div>}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {loading ? <div className="rounded-2xl border-2 border-orange-300 bg-dark-800 p-8 text-center text-sm text-dark-400 shadow-lg">Loading incoming requests...</div> : requests.map((request) => (
              <button key={request._id} onClick={() => void openRequest(request)} className="w-full rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-dark-800 to-dark-900 p-5 text-left shadow-lg hover:border-orange-500 hover:shadow-xl hover:scale-[1.02] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{request.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm text-dark-400">{request.issueDescription}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-medium text-white shadow-md">{request.status}</span>
                    {myOffers[request._id] && (
                      <span className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 text-xs font-medium text-white shadow-md">
                        {myOffers[request._id].status === 'PENDING' ? '✓ Offer Sent' : myOffers[request._id].status === 'ACCEPTED' ? '✓ Accepted' : '✗ ' + myOffers[request._id].status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-dark-400">
                  <span className="flex items-center gap-1"><Car className="h-4 w-4 text-orange-500" />{request.userId?.name || 'Customer'}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-orange-500" />{request.address}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4 text-orange-500" />{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-dark-800 to-dark-900 p-6 shadow-lg">
            {loadingDetails ? <div className="text-sm text-dark-400">Loading details...</div> : selectedRequest ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-orange-500">Request Overview</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
                  <p className="mt-2 text-sm text-dark-400">{selectedRequest.issueDescription}</p>
                </div>
                <div className="rounded-xl bg-dark-900 border-2 border-orange-500/20 p-4 text-sm text-dark-400">
                  <div className="flex items-center justify-between"><span>Status</span><span className="font-semibold text-orange-400">{selectedRequest.status}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>Urgency</span><span className="font-semibold text-orange-400">{selectedRequest.urgency}</span></div>
                </div>
                <div className="space-y-2 text-sm text-dark-400">
                  <div className="flex items-center gap-2 font-semibold text-white"><UserCheck className="h-4 w-4 text-orange-500" />Customer</div>
                  <p className="text-white">{selectedRequest.userId?.name || 'Customer'}</p>
                  <p>{selectedRequest.userId?.phone || 'No phone'}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-400">
                  <div className="flex items-center gap-2 font-semibold text-white"><Car className="h-4 w-4 text-orange-500" />Vehicle</div>
                  <p className="text-white">{selectedRequest.vehicleId?.brand} {selectedRequest.vehicleId?.vehicleModel}</p>
                  <p>{selectedRequest.vehicleId?.registrationNumber}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-400">
                  <div className="flex items-center gap-2 font-semibold text-white"><MapPin className="h-4 w-4 text-orange-500" />Location</div>
                  <p className="text-white">{selectedRequest.address}</p>
                </div>

                {/* Show offer status if exists */}
                {myOffers[selectedRequest._id] && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Your Offer</p>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div className="flex justify-between">
                        <span>ETA:</span>
                        <span className="font-medium">{myOffers[selectedRequest._id].estimatedArrivalMinutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Visit Fee:</span>
                        <span className="font-medium">₹{myOffers[selectedRequest._id].visitFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-semibold">{myOffers[selectedRequest._id].status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit offer button for BROADCASTED/OFFERS_RECEIVED requests */}
                {(selectedRequest.status === 'BROADCASTED' || selectedRequest.status === 'OFFERS_RECEIVED') && !myOffers[selectedRequest._id] && (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                    Submit Your Offer
                  </button>
                )}

                {selectedRequest.status === 'SEARCHING_GARAGE' || selectedRequest.status === 'REQUEST_SENT' ? (
                  <div className="flex gap-2">
                    <button disabled={submitting} onClick={() => void acceptRequest(selectedRequest._id)} className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Accept</button>
                    <button disabled={submitting} onClick={() => void rejectRequest(selectedRequest._id)} className="flex-1 rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">Reject</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'GARAGE_ACCEPTED' ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-700">Assign mechanic</label>
                    <select value={selectedMechanicId} onChange={(event) => setSelectedMechanicId(event.target.value)} className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900">
                      {availableMechanics.map((mechanic) => <option key={mechanic._id} value={mechanic._id}>{mechanic.name} • {mechanic.status}</option>)}
                    </select>
                    <button disabled={submitting || !selectedMechanicId} onClick={() => void assignMechanic(selectedRequest._id)} className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Assign Mechanic</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'MECHANIC_ASSIGNED' ? (
                  <div className="flex gap-2">
                    <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ON_THE_WAY')} className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Mechanic on the way</button>
                    <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ARRIVED')} className="flex-1 rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">Mechanic arrived</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'MECHANIC_ARRIVED' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'INSPECTION_STARTED')} className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Start inspection</button>
                ) : null}

                {selectedRequest.status === 'QUOTATION_APPROVED' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_IN_PROGRESS')} className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Start service</button>
                ) : null}

                {selectedRequest.status === 'SERVICE_IN_PROGRESS' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_COMPLETED')} className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg">Mark completed</button>
                ) : null}
              </div>
            ) : <div className="text-sm text-dark-600">Select a request.</div>}
          </div>
        </div>
      </div>

      {/* Offer Submission Modal */}
      {showOfferModal && selectedRequest && (
        <SubmitOfferModal
          requestId={selectedRequest._id}
          requestDetails={{
            issueCategory: selectedRequest.issueCategory,
            address: selectedRequest.address,
          }}
          onClose={() => setShowOfferModal(false)}
          onSuccess={handleOfferSuccess}
        />
      )}
    </div>
  );
};

export default GarageRequestsPage;

