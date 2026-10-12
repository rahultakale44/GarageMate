import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  CreditCard,
  TrendingUp,
  Users,
  Store,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllSubscriptions } from '@/services/subscriptionService';
import type { AllSubscriptionsResponse, Subscription, SubscriptionStatus, SubscriptionPlan } from '@/types/subscription';
import { getPlanDisplayName, getStatusLabel, getStatusColor, formatBillingInterval } from '@/types/subscription';

const AdminSubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | ''>('');
  const [roleFilter, setRoleFilter] = useState<'USER' | 'GARAGE_OWNER' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const navItems = [
    { icon: TrendingUp, label: 'Overview', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Store, label: 'Garages', path: '/admin/garages' },
    { icon: CheckCircle, label: 'Verifications', path: '/admin/verifications' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions', active: true },
  ];

  useEffect(() => {
    void fetchSubscriptions();
  }, [statusFilter, planFilter, roleFilter, currentPage]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: currentPage, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;
      if (roleFilter) params.role = roleFilter;

      const data: AllSubscriptionsResponse = await getAllSubscriptions(params);
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const userName = (sub.userId as any)?.name?.toLowerCase() || '';
    const userEmail = (sub.userId as any)?.email?.toLowerCase() || '';
    const garageName = (sub.garageId as any)?.name?.toLowerCase() || '';
    return userName.includes(searchLower) || userEmail.includes(searchLower) || garageName.includes(searchLower);
  });

  // Calculate statistics for display
  const totalActive = statistics?.statusBreakdown?.find((s: any) => s._id === 'ACTIVE')?.count || 0;
  const totalRevenue = statistics?.statusBreakdown?.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-dark-900">
      {sidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />)}
      
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-dark-800 border-r border-dark-700 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-display font-bold text-white">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white"><X size={24} /></button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.label} 
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active ? 'bg-primary-500 text-white' : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg mb-2">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user?.name || 'Administrator'}</p><p className="text-xs text-dark-400 truncate">{user?.email || 'admin@garagemate.com'}</p></div>
          </div>
          <button onClick={() => void logout().then(() => navigate('/'))} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-dark-700 rounded-lg transition-colors"><LogOut className="w-5 h-5" /><span className="font-medium">Logout</span></button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white"><Menu size={24} /></button>
            <h1 className="text-xl font-semibold text-white">Subscription Management</h1>
            <button className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors"><Bell className="w-6 h-6 text-dark-300" /><span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" /></button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{totalActive}</h3>
              <p className="text-sm text-dark-400">Active Subscriptions</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{statistics?.planBreakdown?.find((p: any) => p._id.includes('DRIVER'))?.count || 0}</h3>
              <p className="text-sm text-dark-400">Driver Pro Members</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Store className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{statistics?.planBreakdown?.filter((p: any) => p._id.includes('PARTNER')).reduce((sum: number, p: any) => sum + p.count, 0) || 0}</h3>
              <p className="text-sm text-dark-400">Partner Subscriptions</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">₹{totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-sm text-dark-400">Total Revenue</p>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5 text-dark-400" />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Plan</label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Plans</option>
                  <option value="DRIVER_PRO">Driver Pro</option>
                  <option value="PARTNER_PRO">Partner Pro</option>
                  <option value="PARTNER_BUSINESS">Partner Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Roles</option>
                  <option value="USER">Users</option>
                  <option value="GARAGE_OWNER">Garage Owners</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Subscriptions Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Subscriptions ({pagination.total})</h3>
              <span className="text-sm text-dark-400">Page {pagination.page} of {pagination.pages}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-3 text-dark-400">Loading subscriptions...</span>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-dark-600 mx-auto mb-4" />
                <p className="text-sm text-dark-400">No subscriptions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Subscriber</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Plan</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Billing</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Amount</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Status</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Period End</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {filteredSubscriptions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium text-white">{(sub.userId as any)?.name || 'Unknown'}</p>
                              <p className="text-xs text-dark-400">{(sub.userId as any)?.email || 'No email'}</p>
                              {sub.garageId && <p className="text-xs text-dark-500">{(sub.garageId as any)?.name || ''}</p>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300">
                              {getPlanDisplayName(sub.plan)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-dark-300">{formatBillingInterval(sub.billingInterval)}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-semibold text-white">₹{sub.amount.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(sub.status) === 'green' ? 'bg-green-500/20 text-green-400' :
                              getStatusColor(sub.status) === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                              getStatusColor(sub.status) === 'red' ? 'bg-red-500/20 text-red-400' :
                              'bg-dark-700 text-dark-300'
                            }`}>
                              {getStatusLabel(sub.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-dark-300">
                              <Calendar className="h-4 w-4" />
                              {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-dark-700 flex items-center justify-between">
                  <p className="text-sm text-dark-400">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} subscriptions
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-dark-700 border border-dark-600 rounded-lg text-white hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-white px-3">Page {currentPage} of {pagination.pages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                      className="p-2 bg-dark-700 border border-dark-600 rounded-lg text-white hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminSubscriptionsPage;
