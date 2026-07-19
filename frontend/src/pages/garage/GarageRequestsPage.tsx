import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Clock3, MapPin, UserCheck } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

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

  useEffect(() => {
    void loadRequests();
    void loadMechanics();
  }, [id]);

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
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/garage/dashboard" className="rounded-full bg-white p-2 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Incoming Requests</h1>
            <p className="text-sm text-dark-600">Accept, reject, assign mechanics, and advance service status.</p>
          </div>
        </div>

        {errorMessage && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
        {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {loading ? <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">Loading incoming requests...</div> : requests.map((request) => (
              <button key={request._id} onClick={() => void openRequest(request)} className="w-full rounded-2xl border border-dark-200 bg-white p-5 text-left shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{request.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm text-dark-600">{request.issueDescription}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{request.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-dark-500">
                  <span className="flex items-center gap-1"><Car className="h-4 w-4" />{request.userId?.name || 'Customer'}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{request.address}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
            {loadingDetails ? <div className="text-sm text-dark-600">Loading details...</div> : selectedRequest ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-primary-600">Request Overview</p>
                  <h2 className="mt-1 text-xl font-semibold text-dark-900">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
                  <p className="mt-2 text-sm text-dark-600">{selectedRequest.issueDescription}</p>
                </div>
                <div className="rounded-xl bg-dark-50 p-4 text-sm text-dark-600">
                  <div className="flex items-center justify-between"><span>Status</span><span className="font-semibold text-dark-900">{selectedRequest.status}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>Urgency</span><span className="font-semibold text-dark-900">{selectedRequest.urgency}</span></div>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><UserCheck className="h-4 w-4" />Customer</div>
                  <p>{selectedRequest.userId?.name || 'Customer'}</p>
                  <p>{selectedRequest.userId?.phone || 'No phone'}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><Car className="h-4 w-4" />Vehicle</div>
                  <p>{selectedRequest.vehicleId?.brand} {selectedRequest.vehicleId?.vehicleModel}</p>
                  <p>{selectedRequest.vehicleId?.registrationNumber}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><MapPin className="h-4 w-4" />Location</div>
                  <p>{selectedRequest.address}</p>
                </div>

                {selectedRequest.status === 'SEARCHING_GARAGE' || selectedRequest.status === 'REQUEST_SENT' ? (
                  <div className="flex gap-2">
                    <button disabled={submitting} onClick={() => void acceptRequest(selectedRequest._id)} className="flex-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Accept</button>
                    <button disabled={submitting} onClick={() => void rejectRequest(selectedRequest._id)} className="flex-1 rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">Reject</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'GARAGE_ACCEPTED' ? (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-700">Assign mechanic</label>
                    <select value={selectedMechanicId} onChange={(event) => setSelectedMechanicId(event.target.value)} className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900">
                      {availableMechanics.map((mechanic) => <option key={mechanic._id} value={mechanic._id}>{mechanic.name} • {mechanic.status}</option>)}
                    </select>
                    <button disabled={submitting || !selectedMechanicId} onClick={() => void assignMechanic(selectedRequest._id)} className="w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Assign Mechanic</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'MECHANIC_ASSIGNED' ? (
                  <div className="flex gap-2">
                    <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ON_THE_WAY')} className="flex-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Mechanic on the way</button>
                    <button onClick={() => void updateStatus(selectedRequest._id, 'MECHANIC_ARRIVED')} className="flex-1 rounded-lg bg-dark-700 px-3 py-2 text-sm font-medium text-white">Mechanic arrived</button>
                  </div>
                ) : null}

                {selectedRequest.status === 'MECHANIC_ARRIVED' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'INSPECTION_STARTED')} className="w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Start inspection</button>
                ) : null}

                {selectedRequest.status === 'QUOTATION_APPROVED' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_IN_PROGRESS')} className="w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Start service</button>
                ) : null}

                {selectedRequest.status === 'SERVICE_IN_PROGRESS' ? (
                  <button onClick={() => void updateStatus(selectedRequest._id, 'SERVICE_COMPLETED')} className="w-full rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white">Mark completed</button>
                ) : null}
              </div>
            ) : <div className="text-sm text-dark-600">Select a request.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarageRequestsPage;
