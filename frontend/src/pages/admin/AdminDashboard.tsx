import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Bell, Users, Store, AlertCircle, DollarSign, CheckCircle,
  TrendingUp, FileText, Loader2, Check, XCircle, RefreshCw, Activity,
  UserCheck, Clock, CreditCard,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface GarageReviewItem {
  _id: string; name: string; phone: string; city: string; state: string;
  verificationStatus: string; verificationNotes?: string; services?: string[];
  owner?: { name?: string; email?: string; phone?: string };
}

type AdminSection = 'overview' | 'users' | 'garages' | 'verifications' | 'requests' | 'payments' | 'complaints';

const navItems: NavItem[] = [
  { icon: TrendingUp,  label: 'Overview',       path: '/admin/dashboard' },
  { icon: Users,       label: 'Users',           path: '/admin/dashboard' },
  { icon: Store,       label: 'Garages',         path: '/admin/dashboard' },
  { icon: CheckCircle, label: 'Verifications',   path: '/admin/dashboard' },
  { icon: AlertCircle, label: 'Requests',        path: '/admin/requests' },
  { icon: CreditCard,  label: 'Subscriptions',   path: '/admin/subscriptions' },
  { icon: DollarSign,  label: 'Payments',        path: '/admin/dashboard' },
  { icon: FileText,    label: 'Complaints',      path: '/admin/dashboard' },
];

const PIE_COLORS = ['#f97316', '#16a34a', '#ef4444', '#3b82f6', '#8b5cf6'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [verifications, setVerifications] = useState<GarageReviewItem[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<GarageReviewItem | null>(null);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');
  const [dashboardStats, setDashboardStats] = useState<Record<string, unknown> | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD);
      setDashboardStats(res.data?.data || null);
    } catch {
      setDashboardStats({ totalUsers: 0, totalGarages: 0, totalRequests: 0, totalRevenue: 0 });
    } finally { setLoadingStats(false); }
  };

  const fetchQueue = async (status = filter) => {
    setLoadingVerifications(true);
    setErrorMessage(null);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.ADMIN.VERIFICATIONS, { params: { status } });
      const data = res.data?.data || [];
      setVerifications(data);
      if (data.length > 0) setSelectedGarage(data[0]);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Unable to load verification queue'); }
    finally { setLoadingVerifications(false); }
  };

  useEffect(() => {
    void fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeSection === 'verifications') void fetchQueue(filter);
  }, [filter, activeSection]);

  const openGarage = async (garage: GarageReviewItem) => {
    setLoadingDetails(true);
    setSelectedGarage(garage);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.ADMIN.GARAGE_DETAILS(garage._id));
      setSelectedGarage(res.data?.data || garage);
    } catch { setSelectedGarage(garage); }
    finally { setLoadingDetails(false); }
  };

  const performAction = async (action: 'approve' | 'reject' | 'changes' | 'suspend' | 'reactivate', reason?: string) => {
    if (!selectedGarage) return;
    try {
      const payload = action === 'approve' ? {} : action === 'reject' ? { reason } : action === 'changes' ? { notes: reason || 'Please update profile details.' } : {};
      const ep = {
        approve:    API_ENDPOINTS.ADMIN.APPROVE_GARAGE(selectedGarage._id),
        reject:     API_ENDPOINTS.ADMIN.REJECT_GARAGE(selectedGarage._id),
        changes:    API_ENDPOINTS.ADMIN.REQUEST_CHANGES(selectedGarage._id),
        suspend:    API_ENDPOINTS.ADMIN.SUSPEND_GARAGE(selectedGarage._id),
        reactivate: API_ENDPOINTS.ADMIN.REACTIVATE_GARAGE(selectedGarage._id),
      }[action];
      await axiosInstance.patch(ep, payload);
      setSuccessMessage(`Garage ${action}d successfully`);
      setShowRejectForm(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchQueue(filter);
    } catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Action failed'); }
  };

  const stats = dashboardStats as { totalUsers?: number; totalGarages?: number; totalRequests?: number; totalRevenue?: number; verificationStats?: { pending?: number; approved?: number } } | null;

  const headerActions = (
    <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
      <Bell className="w-5 h-5" />
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
    </button>
  );

  return (
    <DashboardShell navItems={navItems} headerActions={headerActions}>
      {/* Welcome */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Console</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Platform Operations</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back, {user?.name ?? 'Administrator'}</p>
      </div>

      {/* Alerts */}
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

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto flex-wrap">
        {(['overview', 'verifications', 'users', 'garages', 'requests', 'payments', 'complaints'] as AdminSection[]).map((section) => (
          <button key={section} onClick={() => {
            if (section === 'requests') { navigate('/admin/requests'); return; }
            setActiveSection(section);
          }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeSection === section ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {section === 'verifications' && verifications.length > 0 && activeSection === 'verifications'
              ? `Verifications (${verifications.length})`
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
        <Link to="/admin/subscriptions"
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">
          Subscriptions
        </Link>
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={loadingStats ? '…' : stats?.totalUsers ?? 0}
              icon={<Users className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" />
            <StatCard label="Total Garages" value={loadingStats ? '…' : stats?.totalGarages ?? 0}
              icon={<Store className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" />
            <StatCard label="Total Requests" value={loadingStats ? '…' : stats?.totalRequests ?? 0}
              icon={<Activity className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" />
            <StatCard label="Revenue" value={loadingStats ? '…' : `₹${((stats?.totalRevenue as number) ?? 0).toLocaleString('en-IN')}`}
              icon={<DollarSign className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" />
          </div>

          {/* Verification summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Pending Verifications', value: stats?.verificationStats && (stats.verificationStats as Record<string,number>).pending || 0, icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
              { label: 'Approved Garages', value: stats?.verificationStats && (stats.verificationStats as Record<string,number>).approved || 0, icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
              { label: 'Active Subscriptions', value: '—', icon: <UserCheck className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
            ].map(({ label, value, icon, bg }) => (
              <StatCard key={label} label={label} value={value} icon={icon} iconBg={bg} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-5">Request Status Distribution</h3>
              {dashboardStats ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Completed', value: (dashboardStats as Record<string,Record<string,number>>)?.requestStats?.completed || 0 },
                      { name: 'Active', value: (dashboardStats as Record<string,Record<string,number>>)?.requestStats?.active || 0 },
                      { name: 'Cancelled', value: (dashboardStats as Record<string,Record<string,number>>)?.requestStats?.cancelled || 0 },
                    ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">Loading chart data…</div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-5">Platform Summary</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'Users', value: stats?.totalUsers ?? 0 },
                  { name: 'Garages', value: stats?.totalGarages ?? 0 },
                  { name: 'Requests', value: stats?.totalRequests ?? 0 },
                ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Verifications ─────────────────────────────────────────── */}
      {activeSection === 'verifications' && (
        <div className="space-y-5">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'SUSPENDED'].map((status) => (
              <button key={status} onClick={() => { setFilter(status); void fetchQueue(status); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === status ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
                }`}>
                {status.replace('_', ' ')}
              </button>
            ))}
            <button onClick={() => void fetchQueue(filter)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingVerifications ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : verifications.length === 0 ? (
            <EmptyState icon={<CheckCircle className="w-6 h-6" />} title={`No garages with status: ${filter.replace('_', ' ')}`} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* List */}
              <div className="lg:col-span-2 card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{verifications.length} Garages</p>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
                  {verifications.map((g) => (
                    <div key={g._id}
                      className={`px-4 py-3.5 cursor-pointer transition-colors ${selectedGarage?._id === g._id ? 'bg-orange-50 border-l-2 border-orange-500' : 'hover:bg-slate-50'}`}
                      onClick={() => void openGarage(g)}>
                      <p className="text-sm font-medium text-slate-900">{g.name}</p>
                      <p className="text-xs text-slate-500">{g.city}, {g.state}</p>
                      <div className="mt-1.5">
                        <StatusBadge status={g.verificationStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail panel */}
              <div className="lg:col-span-3 card">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : selectedGarage ? (
                  <div className="p-5 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{selectedGarage.name}</h3>
                        <p className="text-sm text-slate-500">{selectedGarage.city}, {selectedGarage.state}</p>
                      </div>
                      <StatusBadge status={selectedGarage.verificationStatus} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Phone', selectedGarage.phone],
                        ['Owner', selectedGarage.owner?.name || '—'],
                        ['Owner Email', selectedGarage.owner?.email || '—'],
                        ['Owner Phone', selectedGarage.owner?.phone || '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-sm text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedGarage.services && selectedGarage.services.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedGarage.services.map((s) => (
                            <span key={s} className="text-2xs px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-100">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedGarage.verificationNotes && (
                      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Previous Notes</p>
                        <p className="text-sm text-blue-700">{selectedGarage.verificationNotes}</p>
                      </div>
                    )}

                    {/* Reject form */}
                    {showRejectForm && (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-slate-700">Rejection reason</label>
                        <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)}
                          rows={3} className="input-field text-sm resize-none" placeholder="Explain why this garage is being rejected…" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {selectedGarage.verificationStatus !== 'APPROVED' && (
                        <button onClick={() => void performAction('approve')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {selectedGarage.verificationStatus !== 'REJECTED' && (
                        showRejectForm ? (
                          <>
                            <button onClick={() => void performAction('reject', rejectNotes)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
                              Confirm Reject
                            </button>
                            <button onClick={() => setShowRejectForm(false)}
                              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setShowRejectForm(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )
                      )}
                      <button onClick={() => void performAction('changes', 'Please update your garage profile.')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Request Changes
                      </button>
                      {selectedGarage.verificationStatus === 'APPROVED' && (
                        <button onClick={() => void performAction('suspend')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-semibold hover:bg-yellow-100 transition-colors">
                          Suspend
                        </button>
                      )}
                      {selectedGarage.verificationStatus === 'SUSPENDED' && (
                        <button onClick={() => void performAction('reactivate')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Select a garage" description="Click a garage from the list to review it." />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Users placeholder ─────────────────────────────────────── */}
      {activeSection === 'users' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">User Management</h3>
            <span className="text-xs text-slate-400">Live data from API</span>
          </div>
          <EmptyState icon={<Users className="w-6 h-6" />} title="Users section"
            description="User management with block/unblock functionality is available via the Admin API endpoints. Full table UI coming in the next update."
            action={<Link to="/admin/requests" className="btn-primary text-sm">View Requests Instead</Link>} />
        </div>
      )}

      {/* ── Garages placeholder ───────────────────────────────────── */}
      {activeSection === 'garages' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Garage Management</h3>
          </div>
          <EmptyState icon={<Store className="w-6 h-6" />} title="Garage management"
            description="Full garage management, verification review, and suspension controls are available in the Verifications section above."
            action={<button onClick={() => setActiveSection('verifications')} className="btn-primary text-sm">Go to Verifications</button>} />
        </div>
      )}

      {/* ── Payments placeholder ──────────────────────────────────── */}
      {activeSection === 'payments' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Payments & Revenue</h3>
          </div>
          <EmptyState icon={<DollarSign className="w-6 h-6" />} title="Payment records"
            description="Payment and revenue data is loaded from the backend. Full table view available in the next phase."
            action={<Link to="/admin/subscriptions" className="btn-primary text-sm">View Subscriptions</Link>} />
        </div>
      )}

      {/* ── Complaints placeholder ────────────────────────────────── */}
      {activeSection === 'complaints' && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">User Complaints</h3>
          </div>
          <EmptyState icon={<FileText className="w-6 h-6" />} title="Complaints management"
            description="Incoming user complaints are managed here. Full interface available in the next phase." />
        </div>
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
