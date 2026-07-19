import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Wrench, Car, MapPin, Clock3 } from 'lucide-react';
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
  userId?: { name?: string; email?: string };
  garageId?: { name?: string };
  mechanicId?: { name?: string };
}

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.REQUESTS, { params: statusFilter === 'ALL' ? {} : { status: statusFilter } });
      setRequests(response.data?.data || []);
      if ((response.data?.data || []).length) {
        setSelectedRequest(response.data.data[0]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-dark-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/admin/dashboard" className="rounded-full bg-white p-2 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-dark-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">Request Monitoring</h1>
            <p className="text-sm text-dark-600">Monitor active assistance requests across the platform.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {['ALL', 'PAYMENT_PENDING', 'SEARCHING_GARAGE', 'GARAGE_ACCEPTED', 'MECHANIC_ASSIGNED', 'SERVICE_IN_PROGRESS', 'PAID', 'CANCELLED'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-full px-3 py-2 text-sm ${statusFilter === status ? 'bg-primary-500 text-white' : 'bg-white text-dark-700 border border-dark-200'}`}>{status}</button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {loading ? <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center text-sm text-dark-600">Loading requests...</div> : requests.map((request) => (
              <button key={request._id} onClick={() => setSelectedRequest(request)} className="w-full rounded-2xl border border-dark-200 bg-white p-5 text-left shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{request.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm text-dark-600">{request.issueDescription}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">{request.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-dark-500">
                  <span className="flex items-center gap-1"><User className="h-4 w-4" />{request.userId?.name || 'User'}</span>
                  <span className="flex items-center gap-1"><Wrench className="h-4 w-4" />{request.garageId?.name || 'Garage pending'}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{new Date(request.createdAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm">
            {selectedRequest ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-primary-600">Request Details</p>
                  <h2 className="mt-1 text-xl font-semibold text-dark-900">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
                  <p className="mt-2 text-sm text-dark-600">{selectedRequest.issueDescription}</p>
                </div>
                <div className="rounded-xl bg-dark-50 p-4 text-sm text-dark-600">
                  <div className="flex items-center justify-between"><span>Status</span><span className="font-semibold text-dark-900">{selectedRequest.status}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>Urgency</span><span className="font-semibold text-dark-900">{selectedRequest.urgency}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>Booking Fee</span><span className="font-semibold text-dark-900">₹{selectedRequest.bookingFee}</span></div>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><User className="h-4 w-4" />Customer</div>
                  <p>{selectedRequest.userId?.name || 'User'}</p>
                  <p>{selectedRequest.userId?.email || 'No email'}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><Wrench className="h-4 w-4" />Garage</div>
                  <p>{selectedRequest.garageId?.name || 'Pending assignment'}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><Car className="h-4 w-4" />Mechanic</div>
                  <p>{selectedRequest.mechanicId?.name || 'Pending assignment'}</p>
                </div>
                <div className="space-y-2 text-sm text-dark-600">
                  <div className="flex items-center gap-2 font-semibold text-dark-900"><MapPin className="h-4 w-4" />Address</div>
                  <p>{selectedRequest.address || 'Address unavailable'}</p>
                </div>
              </div>
            ) : <div className="text-sm text-dark-600">Select a request to inspect it.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
