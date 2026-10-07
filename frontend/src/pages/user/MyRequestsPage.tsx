import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarClock, Car, Clock3, MapPin, Trash2, Wrench } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import OffersDisplay from '@/components/user/OffersDisplay';

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
  garageId?: { name?: string; phone?: string };
  mechanicId?: { name?: string; phone?: string };
  statusHistory?: Array<{ status: string; updatedAt: string; notes?: string }>;
}

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.MY);
      setRequests(response.data?.data || []);
      if (id) {
        const matching = (response.data?.data || []).find((item: RequestRecord) => item._id === id);
        setSelectedRequest(matching || null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [id]);

  const openRequest = async (request: RequestRecord) => {
    setLoadingDetails(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(request._id));
      const requestData = response.data?.data || request;
      setSelectedRequest(requestData);
      navigate(`/user/requests/${request._id}`);
      
      // Load offers if status is BROADCASTED or OFFERS_RECEIVED
      if (requestData.status === 'BROADCASTED' || requestData.status === 'OFFERS_RECEIVED') {
        await loadOffersForRequest(request._id);
      } else {
        setOffers([]);
      }
    } catch {
      setSelectedRequest(request);
      navigate(`/user/requests/${request._id}`);
      setOffers([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadOffersForRequest = async (requestId: string) => {
    setLoadingOffers(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.OFFERS.FOR_REQUEST(requestId));
      setOffers(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleOfferAccepted = async () => {
    // Reload request and offers
    if (selectedRequest) {
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.REQUESTS.GET(selectedRequest._id));
        setSelectedRequest(response.data?.data || selectedRequest);
        await loadOffersForRequest(selectedRequest._id);
        await loadRequests();
      } catch (error) {
        setErrorMessage('Failed to refresh request details');
      }
    }
  };

  const cancelRequest = async (requestId: string) => {
    const confirmed = window.confirm('Cancel this request?');
    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.post(API_ENDPOINTS.REQUESTS.CANCEL(requestId));
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to cancel request');
    }
  };

  const filteredRequests = useMemo(() => requests.filter((request) => {
    if (activeFilter === 'COMPLETED') {
      return ['SERVICE_COMPLETED', 'PAID', 'CLOSED'].includes(request.status);
    }
    if (activeFilter === 'ACTIVE') {
      return !['SERVICE_COMPLETED', 'PAID', 'CLOSED', 'CANCELLED'].includes(request.status);
    }
    return true;
  }), [activeFilter, requests]);

  return (
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/user/dashboard" className="rounded-full bg-white p-2 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">My Requests</h1>
            <p className="text-sm text-dark-600">Track your assistance requests and service history.</p>
          </div>
        </div>

        {errorMessage && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

        <div className="mb-6 flex gap-2">
          {['ACTIVE', 'COMPLETED', 'ALL'].map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter as 'ACTIVE' | 'COMPLETED' | 'ALL')} className={`rounded-full px-3 py-2 text-sm ${activeFilter === filter ? 'bg-primary-500 text-white' : 'bg-white text-dark-700 border border-dark-200'}`}>
              {filter}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">Loading your requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">No requests found.</div>
            ) : filteredRequests.map((request) => (
              <motion.button key={request._id} onClick={() => void openRequest(request)} className="w-full rounded-2xl border border-dark-200 bg-white p-5 text-left shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{request.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm text-dark-600">{request.issueDescription}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{request.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-dark-500">
                  <span className="flex items-center gap-1"><Car className="h-4 w-4" />{request.vehicleId?.brand || 'Vehicle'}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{request.address}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
            {loadingDetails ? <div className="text-sm text-dark-600">Loading details...</div> : selectedRequest ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-primary-600">Request Details</p>
                  <h2 className="mt-1 text-xl font-semibold text-dark-900">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
                  <p className="mt-2 text-sm text-dark-600">{selectedRequest.issueDescription}</p>
                </div>

                <div className="rounded-xl bg-dark-50 p-4">
                  <div className="flex items-center justify-between text-sm"><span>Status</span><span className="font-semibold text-dark-900">{selectedRequest.status}</span></div>
                  <div className="mt-2 flex items-center justify-between text-sm"><span>Urgency</span><span className="font-semibold text-dark-900">{selectedRequest.urgency}</span></div>
                  <div className="mt-2 flex items-center justify-between text-sm"><span>Booking Fee</span><span className="font-semibold text-dark-900">₹{selectedRequest.bookingFee}</span></div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark-900"><Car className="h-4 w-4" />Vehicle</div>
                  <p className="text-sm text-dark-600">{selectedRequest.vehicleId?.brand} {selectedRequest.vehicleId?.vehicleModel} • {selectedRequest.vehicleId?.registrationNumber}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark-900"><MapPin className="h-4 w-4" />Location</div>
                  <p className="text-sm text-dark-600">{selectedRequest.address}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark-900"><Wrench className="h-4 w-4" />Garage & Mechanic</div>
                  <p className="text-sm text-dark-600">Garage: {selectedRequest.garageId?.name || 'Pending'}</p>
                  <p className="text-sm text-dark-600">Mechanic: {selectedRequest.mechanicId?.name || 'Pending'}</p>
                </div>

                {/* Display Offers Section */}
                {(selectedRequest.status === 'BROADCASTED' || selectedRequest.status === 'OFFERS_RECEIVED') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dark-900">
                      <Clock3 className="h-4 w-4" />
                      Available Offers
                    </div>
                    {loadingOffers ? (
                      <div className="p-4 text-center text-sm text-dark-600">Loading offers...</div>
                    ) : (
                      <OffersDisplay
                        requestId={selectedRequest._id}
                        offers={offers}
                        onOfferAccepted={handleOfferAccepted}
                      />
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-dark-900"><CalendarClock className="h-4 w-4" />Status Timeline</div>
                  {selectedRequest.statusHistory?.length ? selectedRequest.statusHistory.map((item) => (
                    <div key={`${item.status}-${item.updatedAt}`} className="rounded-lg border border-dark-200 p-3 text-sm text-dark-600">
                      <div className="flex items-center justify-between"><span className="font-semibold text-dark-900">{item.status}</span><span>{new Date(item.updatedAt).toLocaleString()}</span></div>
                      {item.notes ? <p className="mt-1">{item.notes}</p> : null}
                    </div>
                  )) : <p className="text-sm text-dark-600">No history available.</p>}
                </div>

                {!['CANCELLED', 'CLOSED', 'PAID', 'SERVICE_COMPLETED'].includes(selectedRequest.status) && (
                  <button onClick={() => void cancelRequest(selectedRequest._id)} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <Trash2 className="h-4 w-4" />Cancel request
                  </button>
                )}
              </div>
            ) : <div className="text-sm text-dark-600">Select a request to view details.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequestsPage;
