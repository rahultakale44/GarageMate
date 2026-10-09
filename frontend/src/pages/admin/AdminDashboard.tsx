import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Users,
  Store,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  FileText,
  Loader2,
  Check,
  XCircle,
  RefreshCw,
  Activity,
  UserCheck,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface GarageReviewItem {
  _id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  verificationStatus: string;
  verificationNotes?: string;
  services?: string[];
  owner?: { name?: string; email?: string; phone?: string };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'garages' | 'verifications' | 'requests' | 'payments' | 'complaints'>('overview');
  const [verifications, setVerifications] = useState<GarageReviewItem[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<GarageReviewItem | null>(null);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const navItems = [
    { icon: TrendingUp, label: 'Overview', key: 'overview' as const },
    { icon: Users, label: 'Users', key: 'users' as const },
    { icon: Store, label: 'Garages', key: 'garages' as const },
    { icon: CheckCircle, label: 'Verifications', key: 'verifications' as const },
    { icon: AlertCircle, label: 'Requests', key: 'requests' as const },
    { icon: DollarSign, label: 'Payments', key: 'payments' as const },
    { icon: FileText, label: 'Complaints', key: 'complaints' as const },
  ];

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD);
      setDashboardStats(response.data?.data || null);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Set fallback demo data when API fails
      setDashboardStats({
        totalUsers: 1247,
        totalGarages: 156,
        totalRequests: 1543,
        totalRevenue: 245890,
        verificationStats: {
          approved: 45,
          pending: 25,
          rejected: 10,
          underReview: 20,
        },
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchQueue = async (status = filter) => {
    setLoadingVerifications(true);
    setErrorMessage(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.VERIFICATIONS, { params: { status } });
      setVerifications(response.data?.data || []);
      if ((response.data?.data || []).length > 0) {
        setSelectedGarage(response.data.data[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load verification queue');
    } finally {
      setLoadingVerifications(false);
    }
  };

  useEffect(() => {
    void fetchQueue(filter);
    if (activeSection === 'overview') {
      void fetchDashboardStats();
    }
  }, [filter, activeSection]);

  const openGarage = async (garage: GarageReviewItem) => {
    setLoadingDetails(true);
    setSelectedGarage(garage);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.GARAGE_DETAILS(garage._id));
      setSelectedGarage(response.data?.data || garage);
    } catch {
      setSelectedGarage(garage);
    } finally {
      setLoadingDetails(false);
    }
  };

  const performAction = async (action: 'approve' | 'reject' | 'changes' | 'suspend' | 'reactivate', reason?: string) => {
    if (!selectedGarage) {
      return;
    }

    try {
      const payload = reason ? { reason } : action === 'changes' ? { notes: reason || 'Please update the profile details.' } : {};
      const endpoint = action === 'approve'
        ? API_ENDPOINTS.ADMIN.APPROVE_GARAGE(selectedGarage._id)
        : action === 'reject'
          ? API_ENDPOINTS.ADMIN.REJECT_GARAGE(selectedGarage._id)
          : action === 'changes'
            ? API_ENDPOINTS.ADMIN.REQUEST_CHANGES(selectedGarage._id)
            : action === 'suspend'
              ? API_ENDPOINTS.ADMIN.SUSPEND_GARAGE(selectedGarage._id)
              : API_ENDPOINTS.ADMIN.REACTIVATE_GARAGE(selectedGarage._id);

      await axiosInstance.patch(endpoint, payload);
      setSuccessMessage(`Garage ${action}d successfully`);
      await fetchQueue(filter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action failed');
    }
  };

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
              onClick={() => {
                setActiveSection(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.key
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
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
            <h1 className="text-xl font-semibold text-white">
              {activeSection === 'overview' && 'Platform Overview'}
              {activeSection === 'users' && 'User Management'}
              {activeSection === 'garages' && 'Garage Management'}
              {activeSection === 'verifications' && 'Verification Queue'}
              {activeSection === 'requests' && 'Service Requests'}
              {activeSection === 'payments' && 'Payments & Revenue'}
              {activeSection === 'complaints' && 'User Complaints'}
            </h1>
            <button className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors"><Bell className="w-6 h-6 text-dark-300" /><span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" /></button>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
          {errorMessage && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>}
          {successMessage && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{successMessage}</div>}

          {/* OVERVIEW SECTION - Analytics Dashboard */}
          {activeSection === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {loadingStats ? '...' : dashboardStats?.totalUsers || 0}
                  </h3>
                  <p className="text-sm text-dark-400">Total Users</p>
                  <p className="text-xs text-green-400 mt-2">+12% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Store className="h-6 w-6 text-purple-400" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {loadingStats ? '...' : dashboardStats?.totalGarages || 0}
                  </h3>
                  <p className="text-sm text-dark-400">Total Garages</p>
                  <p className="text-xs text-green-400 mt-2">+8% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {loadingStats ? '...' : dashboardStats?.totalRequests || 0}
                  </h3>
                  <p className="text-sm text-dark-400">Total Requests</p>
                  <p className="text-xs text-green-400 mt-2">+24% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-400" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    ₹{loadingStats ? '...' : (dashboardStats?.totalRevenue || 0).toLocaleString()}
                  </h3>
                  <p className="text-sm text-dark-400">Total Revenue</p>
                  <p className="text-xs text-green-400 mt-2">+18% from last month</p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Request Trends (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={[
                      { day: 'Mon', requests: 12 },
                      { day: 'Tue', requests: 19 },
                      { day: 'Wed', requests: 15 },
                      { day: 'Thu', requests: 25 },
                      { day: 'Fri', requests: 22 },
                      { day: 'Sat', requests: 30 },
                      { day: 'Sun', requests: 28 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Verification Status Pie Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Garage Verification Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: dashboardStats?.verificationStats?.approved || 45, color: '#10B981' },
                          { name: 'Pending', value: dashboardStats?.verificationStats?.pending || 25, color: '#F59E0B' },
                          { name: 'Rejected', value: dashboardStats?.verificationStats?.rejected || 10, color: '#EF4444' },
                          { name: 'Under Review', value: dashboardStats?.verificationStats?.underReview || 20, color: '#3B82F6' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Approved', value: 45, color: '#10B981' },
                          { name: 'Pending', value: 25, color: '#F59E0B' },
                          { name: 'Rejected', value: 10, color: '#EF4444' },
                          { name: 'Under Review', value: 20, color: '#3B82F6' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Revenue Bar Chart */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Monthly Revenue (₹)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { month: 'Jan', revenue: 45000 },
                    { month: 'Feb', revenue: 52000 },
                    { month: 'Mar', revenue: 48000 },
                    { month: 'Apr', revenue: 61000 },
                    { month: 'May', revenue: 55000 },
                    { month: 'Jun', revenue: 67000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Recent Activity */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Platform Activity</h3>
                <div className="space-y-4">
                  {[
                    { icon: UserCheck, text: 'New user registered: Rajesh Kumar', time: '5 min ago', color: 'text-blue-400' },
                    { icon: Store, text: 'Garage "Auto Care Center" approved', time: '12 min ago', color: 'text-green-400' },
                    { icon: AlertCircle, text: 'New assistance request in Pune', time: '18 min ago', color: 'text-yellow-400' },
                    { icon: DollarSign, text: 'Payment received: ₹1,500', time: '25 min ago', color: 'text-green-400' },
                    { icon: FileText, text: 'New complaint filed by user', time: '32 min ago', color: 'text-red-400' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-dark-900 rounded-lg border border-dark-700">
                      <div className={`p-2 rounded-lg ${activity.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                        <activity.icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.text}</p>
                        <p className="text-xs text-dark-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* VERIFICATIONS SECTION */}
          {activeSection === 'verifications' && (
            <>
              <div className="flex gap-2">
                {['PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-full px-3 py-2 text-sm ${filter === status ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 border border-dark-700'}`}>{status}</button>)}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700">
              <div className="p-6 border-b border-dark-700 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Verification Queue</h3><span className="text-sm text-dark-400">{loadingVerifications ? 'Loading...' : `${verifications.length} items`}</span></div>
              <div className="divide-y divide-dark-700">
                {loadingVerifications ? <div className="p-6 text-sm text-dark-400">Loading queue...</div> : verifications.length === 0 ? <div className="p-6 text-sm text-dark-400">No garage applications match this filter.</div> : verifications.map((garage) => <button key={garage._id} onClick={() => void openGarage(garage)} className="w-full p-6 text-left hover:bg-dark-700/50 transition-colors"><div className="flex items-start justify-between gap-3"><div><h4 className="font-medium text-white">{garage.name}</h4><p className="text-sm text-dark-400">Owner: {garage.owner?.name || 'Unknown'}</p><p className="text-xs text-dark-500 mt-1">{garage.city}, {garage.state}</p></div><span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs text-primary-300">{garage.verificationStatus}</span></div></button>)}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Garage Review</h3>{loadingDetails ? <Loader2 className="h-4 w-4 animate-spin text-dark-400" /> : null}</div>
              {selectedGarage ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Garage</p><p className="mt-2 text-white">{selectedGarage.name}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Owner details</p><p className="mt-2 text-white">{selectedGarage.owner?.name || 'Unknown'}</p><p className="text-sm text-dark-400">{selectedGarage.owner?.email || 'No email'}</p><p className="text-sm text-dark-400">{selectedGarage.owner?.phone || 'No phone'}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Services & location</p><p className="mt-2 text-white">{selectedGarage.services?.join(', ') || 'No services listed'}</p><p className="text-sm text-dark-400">{selectedGarage.city}, {selectedGarage.state}</p></div>
                  <div className="rounded-lg border border-dark-700 p-4"><p className="text-xs uppercase tracking-wide text-dark-500">Admin notes</p><p className="mt-2 text-white">{selectedGarage.verificationNotes || 'No notes yet'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void performAction('approve')} className="rounded-lg bg-green-500 px-3 py-2 text-sm text-white"><Check className="mr-1 inline h-4 w-4" />Approve</button>
                    <button onClick={() => void performAction('reject', 'Documents are incomplete')} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"><XCircle className="mr-1 inline h-4 w-4" />Reject</button>
                    <button onClick={() => void performAction('changes', 'Please update your service details and address.')} className="rounded-lg bg-yellow-500 px-3 py-2 text-sm text-white"><RefreshCw className="mr-1 inline h-4 w-4" />Request changes</button>
                    <button onClick={() => void performAction('suspend')} className="rounded-lg bg-dark-700 px-3 py-2 text-sm text-white">Suspend</button>
                    <button onClick={() => void performAction('reactivate')} className="rounded-lg bg-primary-500 px-3 py-2 text-sm text-white">Reactivate</button>
                  </div>
                </div>
              ) : <div className="mt-4 text-sm text-dark-400">Select a garage from the queue.</div>}
            </motion.div>
          </div>
            </>
          )}

          {/* USERS SECTION */}
          {activeSection === 'users' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Total Users</span>
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">1,247</p>
                  <p className="text-xs text-green-400 mt-2">+12.5% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Active Today</span>
                    <Activity className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">387</p>
                  <p className="text-xs text-green-400 mt-2">+8.2% from yesterday</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">New This Week</span>
                    <UserCheck className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">89</p>
                  <p className="text-xs text-green-400 mt-2">+15.3% growth</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Avg. Requests</span>
                    <TrendingUp className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">2.8</p>
                  <p className="text-xs text-dark-400 mt-2">per user</p>
                </motion.div>
              </div>

              {/* User List */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Recent Users</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">User</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Email</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Phone</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Joined</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Requests</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {[
                        { name: 'Rajesh Kumar', email: 'rajesh.k@email.com', phone: '9876543210', joined: '2024-09-15', requests: 5, active: true },
                        { name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '9765432109', joined: '2024-09-20', requests: 3, active: true },
                        { name: 'Amit Patel', email: 'amit.p@email.com', phone: '9654321098', joined: '2024-09-22', requests: 8, active: false },
                        { name: 'Sneha Reddy', email: 'sneha.reddy@email.com', phone: '9543210987', joined: '2024-09-25', requests: 2, active: true },
                        { name: 'Vikram Singh', email: 'vikram.s@email.com', phone: '9432109876', joined: '2024-09-28', requests: 6, active: true },
                        { name: 'Ananya Iyer', email: 'ananya.i@email.com', phone: '9321098765', joined: '2024-10-01', requests: 4, active: false },
                        { name: 'Rahul Verma', email: 'rahul.v@email.com', phone: '9210987654', joined: '2024-10-03', requests: 1, active: true },
                      ].map((user, index) => (
                        <tr key={index} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                                <span className="text-primary-400 font-medium">{user.name.charAt(0)}</span>
                              </div>
                              <span className="text-white font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-dark-300 text-sm">{user.email}</td>
                          <td className="p-4 text-dark-300 text-sm">{user.phone}</td>
                          <td className="p-4 text-dark-300 text-sm">{user.joined}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">{user.requests}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs rounded-full ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* GARAGES SECTION */}
          {activeSection === 'garages' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Total Garages</span>
                    <Store className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">156</p>
                  <p className="text-xs text-green-400 mt-2">+8.3% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Verified</span>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">124</p>
                  <p className="text-xs text-dark-400 mt-2">79.5% of total</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Pending</span>
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">18</p>
                  <p className="text-xs text-yellow-400 mt-2">Awaiting review</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Active Now</span>
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">92</p>
                  <p className="text-xs text-dark-400 mt-2">Online & available</p>
                </motion.div>
              </div>

              {/* Garage Grid */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">All Garages</h3>
                  <select className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
                    <option>All Status</option>
                    <option>Verified</option>
                    <option>Pending</option>
                    <option>Suspended</option>
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: 'Auto Care Center', city: 'Pune', rating: 4.8, reviews: 156, status: 'Verified', services: ['Engine Repair', 'Oil Change', 'Brake Service'] },
                    { name: 'Speed Motors', city: 'Mumbai', rating: 4.6, reviews: 203, status: 'Verified', services: ['Tyre Change', 'AC Repair', 'Battery'] },
                    { name: 'City Garage', city: 'Delhi', rating: 4.9, reviews: 189, status: 'Verified', services: ['General Service', 'Painting', 'Denting'] },
                    { name: 'Pro Mechanics', city: 'Bangalore', rating: 4.7, reviews: 142, status: 'Pending', services: ['Engine', 'Suspension', 'Electrical'] },
                    { name: 'Quick Fix Auto', city: 'Chennai', rating: 4.5, reviews: 98, status: 'Verified', services: ['Quick Service', 'Oil Change', 'Inspection'] },
                    { name: 'Elite Motors', city: 'Hyderabad', rating: 4.8, reviews: 175, status: 'Verified', services: ['Luxury Cars', 'Engine', 'Detailing'] },
                  ].map((garage, index) => (
                    <div key={index} className="bg-dark-900 border border-dark-700 rounded-lg p-4 hover:border-primary-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{garage.name}</h4>
                          <p className="text-sm text-dark-400">{garage.city}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${garage.status === 'Verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {garage.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-white font-medium">{garage.rating}</span>
                        </div>
                        <span className="text-sm text-dark-400">({garage.reviews} reviews)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {garage.services.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="px-2 py-1 bg-dark-800 text-dark-300 text-xs rounded">
                            {service}
                          </span>
                        ))}
                        {garage.services.length > 2 && (
                          <span className="px-2 py-1 text-dark-500 text-xs">
                            +{garage.services.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* REQUESTS SECTION */}
          {activeSection === 'requests' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Total</span>
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">1,543</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Active</span>
                    <Activity className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">87</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Completed</span>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">1,398</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Cancelled</span>
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">58</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Avg Time</span>
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">45m</p>
                </motion.div>
              </div>

              {/* Requests List */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Requests</h3>
                <div className="space-y-3">
                  {[
                    { id: 'REQ-1543', user: 'Rajesh Kumar', issue: 'Engine Overheating', garage: 'Auto Care Center', status: 'IN_PROGRESS', time: '15 min ago' },
                    { id: 'REQ-1542', user: 'Priya Sharma', issue: 'Flat Tyre', garage: 'Speed Motors', status: 'COMPLETED', time: '1 hour ago' },
                    { id: 'REQ-1541', user: 'Amit Patel', issue: 'Battery Dead', garage: 'City Garage', status: 'ASSIGNED', time: '2 hours ago' },
                    { id: 'REQ-1540', user: 'Sneha Reddy', issue: 'Brake Problem', garage: 'Pro Mechanics', status: 'BROADCASTED', time: '3 hours ago' },
                    { id: 'REQ-1539', user: 'Vikram Singh', issue: 'Oil Change', garage: 'Quick Fix Auto', status: 'COMPLETED', time: '4 hours ago' },
                  ].map((request, index) => (
                    <div key={index} className="bg-dark-900 border border-dark-700 rounded-lg p-4 hover:border-primary-500/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-primary-400">{request.id}</span>
                            <span className="text-white font-medium">{request.issue}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-dark-400">
                            <span>User: {request.user}</span>
                            <span>•</span>
                            <span>Garage: {request.garage}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {request.time}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                          request.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          request.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                          request.status === 'ASSIGNED' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* PAYMENTS SECTION */}
          {activeSection === 'payments' && (
            <>
              {/* Revenue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Total Revenue</span>
                    <DollarSign className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">₹2,45,890</p>
                  <p className="text-xs text-green-400 mt-2">+18.2% from last month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Today</span>
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">₹12,450</p>
                  <p className="text-xs text-blue-400 mt-2">23 transactions</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Avg. Value</span>
                    <DollarSign className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">₹1,650</p>
                  <p className="text-xs text-dark-400 mt-2">per transaction</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Pending</span>
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">₹8,200</p>
                  <p className="text-xs text-yellow-400 mt-2">5 payments</p>
                </motion.div>
              </div>

              {/* Payments List */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-dark-700">
                  <h3 className="text-lg font-semibold text-white">Recent Payments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-900">
                      <tr>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Transaction ID</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">User</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Garage</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Amount</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Type</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Status</th>
                        <th className="text-left p-4 text-xs font-medium text-dark-400 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {[
                        { id: 'PAY-8923', user: 'Rajesh Kumar', garage: 'Auto Care', amount: 1500, type: 'Service', status: 'Success', date: '2024-10-10' },
                        { id: 'PAY-8922', user: 'Priya Sharma', garage: 'Speed Motors', amount: 2300, type: 'Service', status: 'Success', date: '2024-10-10' },
                        { id: 'PAY-8921', user: 'Amit Patel', garage: 'City Garage', amount: 899, type: 'Booking', status: 'Pending', date: '2024-10-10' },
                        { id: 'PAY-8920', user: 'Sneha Reddy', garage: 'Pro Mechanics', amount: 3200, type: 'Service', status: 'Success', date: '2024-10-09' },
                        { id: 'PAY-8919', user: 'Vikram Singh', garage: 'Quick Fix', amount: 750, type: 'Booking', status: 'Success', date: '2024-10-09' },
                        { id: 'PAY-8918', user: 'Ananya Iyer', garage: 'Elite Motors', amount: 4500, type: 'Service', status: 'Success', date: '2024-10-09' },
                      ].map((payment, index) => (
                        <tr key={index} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-sm text-primary-400">{payment.id}</span>
                          </td>
                          <td className="p-4 text-white text-sm">{payment.user}</td>
                          <td className="p-4 text-dark-300 text-sm">{payment.garage}</td>
                          <td className="p-4">
                            <span className="text-white font-semibold">₹{payment.amount.toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">{payment.type}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs rounded-full ${payment.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="p-4 text-dark-300 text-sm">{payment.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}

          {/* COMPLAINTS SECTION */}
          {activeSection === 'complaints' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Total</span>
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">89</p>
                  <p className="text-xs text-dark-400 mt-2">All time</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Open</span>
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">12</p>
                  <p className="text-xs text-red-400 mt-2">Needs attention</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Resolved</span>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">77</p>
                  <p className="text-xs text-green-400 mt-2">86.5% resolution rate</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-dark-400">Avg. Time</span>
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">4.2h</p>
                  <p className="text-xs text-dark-400 mt-2">to resolve</p>
                </motion.div>
              </div>

              {/* Complaints List */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Recent Complaints</h3>
                  <select className="px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
                    <option>All Status</option>
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 'COMP-089', user: 'Rajesh Kumar', garage: 'Auto Care Center', issue: 'Mechanic arrived 2 hours late', priority: 'High', status: 'Open', time: '30 min ago' },
                    { id: 'COMP-088', user: 'Priya Sharma', garage: 'Speed Motors', issue: 'Overcharged for service', priority: 'Medium', status: 'In Progress', time: '2 hours ago' },
                    { id: 'COMP-087', user: 'Amit Patel', garage: 'City Garage', issue: 'Poor service quality', priority: 'Low', status: 'Resolved', time: '5 hours ago' },
                    { id: 'COMP-086', user: 'Sneha Reddy', garage: 'Pro Mechanics', issue: 'Parts not genuine', priority: 'High', status: 'Open', time: '1 day ago' },
                    { id: 'COMP-085', user: 'Vikram Singh', garage: 'Quick Fix Auto', issue: 'Unprofessional behavior', priority: 'Medium', status: 'Resolved', time: '1 day ago' },
                  ].map((complaint, index) => (
                    <div key={index} className="bg-dark-900 border border-dark-700 rounded-lg p-4 hover:border-primary-500/50 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-primary-400">{complaint.id}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              complaint.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                              complaint.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {complaint.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              complaint.status === 'Open' ? 'bg-red-500/20 text-red-400' :
                              complaint.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {complaint.status}
                            </span>
                          </div>
                          <p className="text-white font-medium mb-2">{complaint.issue}</p>
                          <div className="flex items-center gap-4 text-sm text-dark-400">
                            <span>User: {complaint.user}</span>
                            <span>•</span>
                            <span>Garage: {complaint.garage}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {complaint.time}
                            </span>
                          </div>
                        </div>
                        {complaint.status === 'Open' && (
                          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
