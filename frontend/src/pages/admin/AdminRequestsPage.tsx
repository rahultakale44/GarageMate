import { useEffect, useState } from 'react';
import {
  User, Wrench, MapPin, Clock3, AlertCircle, TrendingUp, Users,
  Store, CheckCircle, DollarSign, FileText, CreditCard, RefreshCw,
  IndianRupee,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import NotificationBell from '@/components/shared/NotificationBell';

interface RequestRecord {
  _id: string; issueCategory: string; issueDescription: string; status: string;
  urgency: string; address: string; bookingFee: number; createdAt: string;
  userId?: { name?: string; email?: string };
  garageId?: { name?: string; phone?: string };
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

const STATUS_FILTERS = [
  'ALL',
  'GARAGE_SELECTED',   // new booking flow — paid, waiting for garage to accept
  'GARAGE_ACCEPTED',
  'MECHANIC_ASSIGNED',
  'MECHANIC_ON_THE_WAY',
  'SERVICE_IN_PROGRESS',
  'SERVICE_COMPLETED',
  'PAID',
  'CANCELLED',
  'BROADCASTED',
];

const PAID_STATUSES = new Set([
  'GARAGE_SELECTED', 'GARAGE_ACCEPTED', 'MECHANIC_ASSIGNED',
  'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION_STARTED',
  'QUOTATION_SENT', 'QUOTATION_APPROVED', 'SERVICE_IN_PROGRESS',
  'SERVICE_COMPLETED', 'FINAL_PAYMENT_PENDING', 'PAID', 'CLOSED',
]);

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

  // Computed stats
  const totalPaid     = requests.filter(r => PAID_STATUSES.has(r.status)).length;
  const totalActive   = requests.filter(r => ['GARAGE_SELECTED','GARAGE_ACCEPTED','MECHANIC_ASSIGNED','MECHANIC_ON_THE_WAY','SERVICE_IN_PROGRESS'].includes(r.status)).length;
  const totalRevenue  = requests.filter(r => PAID_STATUSES.has(r.status)).reduce((s, r) => s + (r.bookingFee || 99), 0);

  return (
    <DashboardShell navItems={navItems} headerActions={<NotificationBell />}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Request Monitoring</h1>
          <p className="text-sm text-slate-500 mt-0.5">All assistance requests across the platform.</p>
        </div>
        <button onClick={loadRequests}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 rounded-lg transition-colors hover:text-white"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Requests" value={requests.length}
          icon={<AlertCircle className="w-5 h-5 text-orange-400" />} iconBg="bg-orange-500/10" />
        <StatCard label="Paid Bookings" value={totalPaid}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />} iconBg="bg-green-500/10" />
        <StatCard label="Active Jobs" value={totalActive}
          icon={<Clock3 className="w-5 h-5 text-blue-400" />} iconBg="bg-blue-500/10" />
        <StatCard label="Booking Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5 text-orange-400" />} iconBg="bg-orange-500/10" />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map((status) => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={statusFilter === status
              ? { background: '#f97316', color: '#fff' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500">Loading requests…</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="No requests found"
          description={`No requests matching: ${statusFilter}`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Request list */}
          <div className="lg:col-span-3 space-y-3">
            {requests.map((req) => {
              const isPaid = PAID_STATUSES.has(req.status);
              return (
                <div key={req._id}
                  onClick={() => setSelectedRequest(req)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-150"
                  style={selectedRequest?._id === req._id ? {
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.35)',
                    boxShadow: '0 0 0 2px rgba(249,115,22,0.10)',
                  } : {
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{req.issueCategory.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{req.issueDescription || 'No description'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge status={req.status} />
                      {isPaid && (
                        <span className="text-2xs font-bold text-green-400 px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.20)' }}>
                          ₹{req.bookingFee} PAID
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.userId?.name || 'User'}</span>
                    <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{req.garageId?.name || 'Pending'}</span>
                    <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 rounded-xl p-5 self-start sticky top-20"
            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
            {selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <StatusBadge status={selectedRequest.status} />
                  <h2 className="text-base font-semibold text-white mt-2">
                    {selectedRequest.issueCategory.replace(/_/g, ' ')}
                  </h2>
                  {selectedRequest.issueDescription && (
                    <p className="text-sm text-slate-500 mt-1">{selectedRequest.issueDescription}</p>
                  )}
                </div>

                {/* Payment status highlight */}
                <div className="p-3.5 rounded-xl"
                  style={PAID_STATUSES.has(selectedRequest.status)
                    ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Booking Fee</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">₹{selectedRequest.bookingFee}</span>
                        {PAID_STATUSES.has(selectedRequest.status) && (
                          <span className="text-xs font-bold text-green-400 px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(34,197,94,0.15)' }}>
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Urgency</p>
                      <p className="text-sm font-semibold text-white">{selectedRequest.urgency}</p>
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3">
                  {[
                    { icon: <User className="w-4 h-4 text-slate-400" />,   label: 'Customer',  value: `${selectedRequest.userId?.name || '—'}\n${selectedRequest.userId?.email || ''}` },
                    { icon: <Wrench className="w-4 h-4 text-slate-400" />, label: 'Garage',    value: selectedRequest.garageId?.name || 'Pending' },
                    { icon: <User className="w-4 h-4 text-slate-400" />,   label: 'Mechanic',  value: selectedRequest.mechanicId?.name || 'Pending' },
                    { icon: <MapPin className="w-4 h-4 text-slate-400" />, label: 'Location',  value: selectedRequest.address || '—' },
                    { icon: <Clock3 className="w-4 h-4 text-slate-400" />, label: 'Created',   value: new Date(selectedRequest.createdAt).toLocaleString('en-IN') },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">{icon}</div>
                      <div>
                        <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-xs text-slate-300 whitespace-pre-line">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking ID */}
                <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-2xs text-slate-600 font-mono">ID: {selectedRequest._id}</p>
                </div>
              </div>
            ) : (
              <EmptyState title="Select a request" description="Click a request to view its details." />
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AdminRequestsPage;
