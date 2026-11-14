import { useEffect, useState } from 'react';
import { User, Wrench, Car, MapPin, Clock3, AlertCircle, TrendingUp, Users, Store, CheckCircle, DollarSign, FileText, CreditCard } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface RequestRecord {
  _id: string; issueCategory: string; issueDescription: string; status: string;
  urgency: string; address: string; bookingFee: number; createdAt: string;
  userId?: { name?: string; email?: string };
  garageId?: { name?: string };
  mechanicId?: { name?: string };
}

const navItems: NavItem[] = [
  { icon: TrendingUp,  label: 'Overview',      path: '/admin/dashboard' },
  { icon: Users,       label: 'Users',          path: '/admin/dashboard' },
  { icon: Store,       label: 'Garages',        path: '/admin/dashboard' },
  { icon: CheckCircle, label: 'Verifications',  path: '/admin/dashboard' },
  { icon: AlertCircle, label: 'Requests',       path: '/admin/requests' },
  { icon: CreditCard,  label: 'Subscriptions',  path: '/admin/subscriptions' },
  { icon: DollarSign,  label: 'Payments',       path: '/admin/dashboard' },
  { icon: FileText,    label: 'Complaints',     path: '/admin/dashboard' },
];

const STATUS_FILTERS = ['ALL', 'PAYMENT_PENDING', 'SEARCHING_GARAGE', 'GARAGE_ACCEPTED', 'MECHANIC_ASSIGNED', 'SERVICE_IN_PROGRESS', 'PAID', 'CANCELLED'];

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.ADMIN.REQUESTS, {
        params: statusFilter === 'ALL' ? {} : { status: statusFilter },
      });
      const data = res.data?.data || [];
      setRequests(data);
      if (data.length > 0 && !selectedRequest) setSelectedRequest(data[0]);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadRequests(); }, [statusFilter]);

  return (
    <DashboardShell navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Request Monitoring</h1>
        <p className="text-sm text-slate-500 mt-0.5">Monitor all assistance requests across the platform.</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((status) => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === status ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
            }`}>
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-400">Loading requests…</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No requests found"
          description={`No requests matching status: ${statusFilter}`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Request list */}
          <div className="lg:col-span-3 space-y-3">
            {requests.map((req) => (
              <div key={req._id}
                onClick={() => setSelectedRequest(req)}
                className={`card p-4 cursor-pointer transition-all ${selectedRequest?._id === req._id ? 'border-orange-300 shadow-brand' : 'hover:border-slate-300 hover:shadow-card-hover'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{req.issueCategory.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{req.issueDescription || 'No description'}</p>
                  </div>
                  <StatusBadge status={req.status} className="flex-shrink-0" />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.userId?.name || 'User'}</span>
                  <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{req.garageId?.name || 'Pending'}</span>
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 card p-5 self-start sticky top-20">
            {selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-base font-semibold text-slate-900 mt-2">{selectedRequest.issueCategory.replace(/_/g, ' ')}</h2>
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
                    { icon: <User className="w-4 h-4 text-slate-400" />, label: 'Customer', value: `${selectedRequest.userId?.name || '—'}\n${selectedRequest.userId?.email || ''}` },
                    { icon: <Wrench className="w-4 h-4 text-slate-400" />, label: 'Garage', value: selectedRequest.garageId?.name || 'Pending assignment' },
                    { icon: <Car className="w-4 h-4 text-slate-400" />, label: 'Mechanic', value: selectedRequest.mechanicId?.name || 'Pending assignment' },
                    { icon: <MapPin className="w-4 h-4 text-slate-400" />, label: 'Location', value: selectedRequest.address || 'Address unavailable' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">{icon}</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
                        <p className="text-slate-700 whitespace-pre-line">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Select a request" description="Click a request from the list to view its details." />
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AdminRequestsPage;
