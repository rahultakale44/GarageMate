import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, Users, Store, CheckCircle, DollarSign, FileText, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';import { getAllSubscriptions } from '@/services/subscriptionService';
import type { AllSubscriptionsResponse, Subscription, SubscriptionStatus, SubscriptionPlan } from '@/types/subscription';
import { getPlanDisplayName, getStatusLabel, getStatusColor, formatBillingInterval } from '@/types/subscription';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';

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

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statistics, setStatistics] = useState<AllSubscriptionsResponse['statistics'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | ''>('');
  const [roleFilter, setRoleFilter] = useState<'USER' | 'GARAGE_OWNER' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: currentPage, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;
      if (roleFilter) params.role = roleFilter;
      const data = await getAllSubscriptions(params);
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
      setStatistics(data.statistics);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load subscriptions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchSubscriptions(); }, [statusFilter, planFilter, roleFilter, currentPage]);

  const filtered = subscriptions.filter((sub) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const userId = sub.userId as unknown as { name?: string; email?: string };
    const garageId = sub.garageId as unknown as { name?: string };
    return (userId?.name ?? '').toLowerCase().includes(q)
      || (userId?.email ?? '').toLowerCase().includes(q)
      || (garageId?.name ?? '').toLowerCase().includes(q);
  });

  const totalActive = statistics?.statusBreakdown?.find((s) => s._id === 'ACTIVE')?.count ?? 0;
  const totalRevenue = statistics?.statusBreakdown?.reduce((sum, s) => sum + (s.totalRevenue ?? 0), 0) ?? 0;
  const driverPro = statistics?.planBreakdown?.find((p) => p._id.includes('DRIVER'))?.count ?? 0;
  const partnerCount = statistics?.planBreakdown?.filter((p) => p._id.includes('PARTNER')).reduce((s, p) => s + p.count, 0) ?? 0;

  const statusColorMap: Record<string, string> = { green: 'badge-green', yellow: 'badge-yellow', orange: 'badge-orange', red: 'badge-red', gray: 'badge-slate' };

  return (
    <DashboardShell navItems={navItems}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Subscription Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Monitor all active plans and revenue across the platform.</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Subscriptions" value={totalActive} icon={<CheckCircle className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" />
        <StatCard label="Driver Pro Members" value={driverPro} icon={<Users className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" />
        <StatCard label="Partner Subscriptions" value={partnerCount} icon={<Store className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<DollarSign className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 text-sm" placeholder="Search by name or email…" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | '')}
            className="input-field text-sm">
            <option value="">All Statuses</option>
            {['ACTIVE', 'PENDING', 'PAST_DUE', 'CANCELLED', 'EXPIRED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as SubscriptionPlan | '')}
            className="input-field text-sm">
            <option value="">All Plans</option>
            {['DRIVER_PRO', 'PARTNER_PRO', 'PARTNER_BUSINESS'].map((p) => <option key={p} value={p}>{getPlanDisplayName(p as SubscriptionPlan)}</option>)}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'USER' | 'GARAGE_OWNER' | '')}
            className="input-field text-sm">
            <option value="">All Roles</option>
            <option value="USER">Users</option>
            <option value="GARAGE_OWNER">Garage Owners</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Subscriptions ({pagination.total})</h3>
          <span className="text-xs text-slate-400">Page {pagination.page} of {Math.max(pagination.pages, 1)}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
            <span className="text-sm text-slate-500">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CreditCard className="w-6 h-6" />} title="No subscriptions found"
            description="Try changing the filters above." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Subscriber', 'Plan', 'Billing', 'Amount', 'Status', 'Period End'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((sub) => {
                    const userId = sub.userId as unknown as { name?: string; email?: string };
                    const garageId = sub.garageId as unknown as { name?: string };
                    const color = getStatusColor(sub.status);
                    return (
                      <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{userId?.name ?? garageId?.name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{userId?.email ?? sub.userRole}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-slate-700">{getPlanDisplayName(sub.plan)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500 capitalize">{formatBillingInterval(sub.billingInterval)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">₹{sub.amount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${statusColorMap[color] ?? 'badge-slate'}`}>
                            {getStatusLabel(sub.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Showing {((currentPage - 1) * 20) + 1}–{Math.min(currentPage * 20, pagination.total)} of {pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-700">{currentPage}</span>
                  <button onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages}
                    className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default AdminSubscriptionsPage;
