import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, FileText, CreditCard, ShieldCheck, AlertCircle, 
  Clock, CheckCircle2, XCircle, ChevronRight, Eye, Car, 
  TrendingUp, Search, Activity, Calendar, ArrowUpRight,
  Filter, MoreHorizontal, LayoutDashboard, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { adminService, AdminStats } from '../../services/adminService';
import { bookingService } from '../../services/bookingService';
import { Payment, UserProfile } from '../../types';
import { exportToCSV, exportToPDF } from '../../utils/reportExporter';

interface AdminDashboardProps {
  user: UserProfile;
}

type Tab = 'overview' | 'users' | 'bookings' | 'payments' | 'vehicles' | 'commissions';

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [pendingVehicles, setPendingVehicles] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [pData, uData, sData, bData, vData, vhData, cData] = await Promise.all([
        paymentService.getAllPayments(),
        userService.getAllUsers(),
        adminService.getStats(),
        adminService.getBookings(),
        adminService.getVerifications(),
        adminService.getPendingVehicles(),
        adminService.getCommissions()
      ]);
      setPayments(Array.isArray(pData) ? pData : []);
      setUsers(Array.isArray(uData) ? uData : []);
      setBookings(Array.isArray(bData) ? bData : []);
      setVerifications(Array.isArray(vData) ? vData : []);
      setPendingVehicles(Array.isArray(vhData) ? vhData : []);
      setCommissions(Array.isArray(cData) ? cData : []);
      setStats(sData);
      setError(null);
    } catch (err: any) {
      console.error('AdminDashboard fetch error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Revenue Collected (ETB)', 'Base Rate (%)', 'Provider Owner', 'Vehicle Resource', 'Status'];
    const rows = commissions.map(c => [
      `REC_${String(c.id).padStart(6, '0')}`,
      c.type ? c.type.toUpperCase() : 'RENTAL',
      `ETB ${c.amount.toFixed(2)}`,
      `${c.rate}%`,
      c.ownerName || 'Unknown Provider',
      c.vehicleName || 'General Resource',
      c.status ? c.status.toUpperCase() : 'VERIFIED'
    ]);
    exportToCSV(headers, rows, `admin_commissions_ledger_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const totalCollected = commissions.reduce((sum, c) => sum + c.amount, 0);
    const summaryMetrics = [
      { label: 'Commissions Collected', value: `ETB ${totalCollected.toLocaleString()}` },
      { label: 'Total Audits', value: String(commissions.length) },
      { label: 'Avg Rate', value: '10.0% FLAT' }
    ];
    const tableHeaders = ['Transaction', 'Amount', 'Rate %', 'Provider / Vehicle', 'Audit Status'];
    const tableRows = commissions.map(c => [
      `REC_${String(c.id).padStart(6, '0')}`,
      `ETB ${c.amount.toFixed(2)}`,
      `${c.rate}%`,
      `${c.ownerName || 'General'} (${c.vehicleName || 'General Platform'})`,
      c.status ? c.status.toUpperCase() : 'VERIFIED'
    ]);
    exportToPDF({
      type: 'admin',
      title: 'Platform Commissions Ledger',
      subtitle: 'Global platform operations audit, fee collections, and ledger settlements.',
      userName: user.name,
      userEmail: user.email,
      summaryMetrics,
      tableHeaders,
      tableRows,
      fileName: `admin_commissions_ledger_${new Date().toISOString().split('T')[0]}`
    });
  };

  const chartData = useMemo(() => {
    if (!bookings.length) return [];
    
    // Group earnings by day for the last 14 days
    const days = 14;
    return Array.from({ length: days }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = bookings.filter(b => b.createdAt.split('T')[0] === dateStr);
      const revenue = dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const commission = dayBookings.reduce((sum, b) => sum + ((b.totalAmount || 0) * 0.1), 0); // Assuming 10%

      return {
        name: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue,
        commission
      };
    });
  }, [bookings]);

  const userDistribution = useMemo(() => {
    return [
      { name: 'Owners', value: users.filter(u => u.role === 'owner').length, color: '#D4AF37' },
      { name: 'Customers', value: users.filter(u => u.role === 'customer').length, color: '#3B82F6' },
      { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#A855F7' }
    ];
  }, [users]);

  const handleUpdateUserStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await userService.updateUser(userId, { status: newStatus });
    setUsers(users.map(u => u.userId === userId ? { ...u, status: newStatus } : u));
  };

  const handleToggleVerification = async (userId: number, currentVerified: boolean) => {
    await userService.updateUser(userId, { isVerified: !currentVerified });
    setUsers(users.map(u => u.userId === userId ? { ...u, isVerified: !currentVerified } : u));
  };

  const handleApproveVehicle = async (vehicleId: number, status: 'approved' | 'rejected') => {
    try {
      await adminService.updateVehicleApproval(vehicleId, status);
      setPendingVehicles(pendingVehicles.filter(v => v.id !== vehicleId));
      fetchData();
    } catch (err) {
      console.error('Failed to update vehicle approval:', err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-black/30 border border-white/5 rounded-2xl max-w-lg mx-auto gap-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-2">Failed to fetch dashboard data</h3>
          <p className="text-muted/85 text-xs font-mono max-w-sm mx-auto leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchData();
          }}
          className="px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-muted font-mono text-[10px] uppercase tracking-widest animate-pulse">Authenticating Admin Session</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 font-sans text-white">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight uppercase flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-gold" />
            Central Oversight
          </h1>
          <p className="text-xs text-muted font-mono mt-2 flex items-center gap-2 uppercase tracking-widest">
            <Activity className="w-3 h-3 text-gold" />
            Admin Control Panel // {user.name}
          </p>
        </div>

        <nav className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto whitespace-nowrap custom-scrollbar">
          {[
            { id: 'overview', icon: LayoutDashboard },
            { id: 'users', icon: Users },
            { id: 'bookings', icon: Clock },
            { id: 'payments', icon: CreditCard },
            { id: 'vehicles', icon: Car },
            { id: 'commissions', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as Tab); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-gold text-dark shadow-lg shadow-gold/20' 
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.id.replace('bookings', 'History').replace('payments', 'Payments')}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  onClick={() => { setActiveTab('commissions'); setSearchQuery(''); }}
                  className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group hover:border-gold/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                   <div className="flex items-center justify-between mb-4">
                     <div className="p-3 bg-gold/10 rounded-2xl">
                       <TrendingUp className="w-5 h-5 text-gold" />
                     </div>
                     <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors" />
                   </div>
                   <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Platform Revenue</p>
                   <p className="text-3xl font-display font-black text-white mt-1">ETB {(stats?.totalCommissions || 0).toLocaleString()}</p>
                   <div className="absolute -bottom-2 -right-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <TrendingUp className="w-24 h-24 text-gold" />
                   </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('bookings'); setSearchQuery(''); }}
                  className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl group hover:border-blue-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                   <div className="flex items-center justify-between mb-4">
                     <div className="p-3 bg-blue-500/10 rounded-2xl">
                       <FileText className="w-5 h-5 text-blue-400" />
                     </div>
                     <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                   </div>
                   <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Processed Bookings</p>
                   <p className="text-3xl font-display font-black text-white mt-1">{stats?.totalBookings || bookings.length}</p>
                </div>

                <div 
                  onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                  className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl group hover:border-purple-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                   <div className="flex items-center justify-between mb-4">
                     <div className="p-3 bg-purple-500/10 rounded-2xl">
                       <Users className="w-5 h-5 text-purple-400" />
                     </div>
                     <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100" />
                   </div>
                   <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Active Ecosystem</p>
                   <p className="text-3xl font-display font-black text-white mt-1">{users.length}</p>
                </div>

                <div 
                  onClick={() => { setActiveTab('vehicles'); setSearchQuery(''); }}
                  className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl group hover:border-orange-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                   <div className="flex items-center justify-between mb-4">
                     <div className="p-3 bg-orange-500/10 rounded-2xl">
                       <Car className="w-5 h-5 text-orange-400" />
                     </div>
                     <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100" />
                   </div>
                   <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Pending Provider</p>
                   <p className="text-3xl font-display font-black text-white mt-1">{pendingVehicles.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Analytics Chart */}
                <div className="lg:col-span-2 bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-xl font-display font-black uppercase tracking-tight">System Performance</h3>
                      <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">Daily platform throughput analytics</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Revenue</span>
                       </div>
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Growth</span>
                       </div>
                    </div>
                  </div>
                  <div className="h-[350px] w-full min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                        />
                        <YAxis 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          labelStyle={{ color: '#D4AF37', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#D4AF37" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorRevAdmin)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Audit & Distribution */}
                <div className="space-y-6">
                   <div className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl">
                     <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-8">User Demographics</h3>
                     <div className="space-y-6">
                        {userDistribution.map((dist, i) => (
                          <div key={`dist-${i}`} className="space-y-2">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                               <span className="text-muted">{dist.name}</span>
                               <span className="text-white">{Math.round((dist.value / users.length) * 100)}% ({dist.value})</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(dist.value / users.length) * 100}%` }}
                                 className="h-full rounded-full"
                                 style={{ backgroundColor: dist.color }}
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                   </div>

                   <div className="bg-gold p-8 rounded-3xl shadow-2xl shadow-gold/10 text-dark group transition-all hover:scale-[1.02] cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <ShieldCheck className="w-8 h-8 opacity-20" />
                        <ArrowUpRight className="w-5 h-5 opacity-40" />
                      </div>
                      <h3 className="text-xl font-display font-black uppercase tracking-tighter leading-none mb-2">Fleet Audit</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Moderation Pending: {pendingVehicles.length}</p>
                      <button 
                        onClick={() => setActiveTab('vehicles')}
                        className="mt-6 w-full py-3 bg-dark text-gold rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Launch Review Portal
                      </button>
                   </div>
                </div>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Users className="w-4 h-4 text-gold" />
                      Recent Registrations
                    </h3>
                    <button onClick={() => setActiveTab('users')} className="text-[9px] font-black text-gold uppercase tracking-widest hover:underline">Full Directory</button>
                  </div>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((u, i) => (
                      <div key={`recent-user-${u.userId}-${i}`} className="flex items-center justify-between p-4 bg-dark-2/50 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-display font-black text-base group-hover:bg-gold group-hover:text-dark transition-all">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">{u.name}</p>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                              {u.role} <span className="opacity-20 mx-2">//</span> Verified: {u.isVerified ? 'YES' : 'NO'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted/20 group-hover:text-gold transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gold" />
                      Booking Activity
                    </h3>
                    <button onClick={() => setActiveTab('bookings')} className="text-[9px] font-black text-gold uppercase tracking-widest hover:underline">Audit Trail</button>
                  </div>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((b, i) => (
                      <div key={`recent-booking-${b.id}-${i}`} className="flex items-center justify-between p-4 bg-dark-2/50 rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
                        <div>
                          <p className="text-sm font-display font-black text-white uppercase tracking-tight">{b.vehicleName}</p>
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">BY {b.customerName} <span className="opacity-20 mx-2">//</span> {b.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-gold">ETB {b.totalAmount.toLocaleString()}</p>
                          <p className="text-[8px] text-muted/40 uppercase tracking-widest mt-1">{new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
               key="users"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                   <input 
                     type="text" 
                     placeholder="SEARCH ECOSYSTEM..."
                     className="w-full py-4 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-gold/30 focus:outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-4 bg-gold/10 text-gold rounded-2xl border border-gold/20 flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{users.length} TOTAL</span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-1/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">User Identity</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Platform Role</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Account Status</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Verification Status</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users
                        .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((u, i) => (
                        <tr key={`user-row-${u.userId}-${i}`} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-display font-black text-sm text-gold border border-white/5 group-hover:scale-110 transition-transform">
                                {u.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-white uppercase">{u.name}</span>
                                <span className="text-[10px] font-mono text-muted lowercase tracking-wider mt-1">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                             <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                               u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                               u.role === 'owner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-muted border-white/10'
                             }`}>
                               {u.role}
                             </span>
                          </td>
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} />
                               <span className="text-[10px] font-black uppercase tracking-widest text-white">{u.status}</span>
                             </div>
                          </td>
                          <td className="px-8 py-8 text-[10px] font-bold text-muted uppercase tracking-widest">
                             {u.isVerified ? <span className="text-green-400">IDENTITY VERIFIED</span> : <span className="text-orange-400">PENDING REVIEW</span>}
                          </td>
                          <td className="px-8 py-8 text-right">
                            <button 
                              onClick={() => handleUpdateUserStatus(u.userId!, u.status || 'active')}
                              className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 hover:bg-white text-dark bg-white/5 transition-all"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vehicles' && (
            <motion.div 
               key="vehicles"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                   <input 
                     type="text" 
                     placeholder="SEARCH FLEET QUEUE..."
                     className="w-full py-4 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-gold/30 focus:outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <div className="px-6 py-4 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 flex items-center gap-3">
                  <Car className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{pendingVehicles.length} PENDING AUDIT</span>
                </div>
              </div>

              <div className="bg-dark-1/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Vehicle Details</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Owner</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Documents</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingVehicles
                        .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((v, i) => (
                        <tr key={`pending-vehicle-${v.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-gold transition-colors uppercase tracking-tight">{v.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{v.category}</span>
                                <span className="text-muted/20">//</span>
                                <span className="text-[10px] font-mono text-gold uppercase">{v.plateNumber || 'NO_PLATE'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white uppercase">{v.ownerName}</span>
                              <span className="text-[9px] text-muted/40 uppercase tracking-widest mt-1">Provider ID: {v.ownerId || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex gap-2">
                              {v.ownershipBookUrl && (
                                <a href={v.ownershipBookUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/5 text-gold rounded-xl border border-white/10 hover:border-gold/30 transition-all text-[9px] font-black uppercase tracking-widest">
                                  Libre
                                </a>
                              )}
                              {v.insuranceCertUrl && (
                                <a href={v.insuranceCertUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/5 text-gold rounded-xl border border-white/10 hover:border-gold/30 transition-all text-[9px] font-black uppercase tracking-widest">
                                  Insur.
                                </a>
                              )}
                              {v.nationalIdUrl && (
                                <a href={v.nationalIdUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white/5 text-gold rounded-xl border border-white/10 hover:border-gold/30 transition-all text-[9px] font-black uppercase tracking-widest">
                                  ID
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => handleApproveVehicle(v.id, 'approved')}
                                className="px-5 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-black text-[9px] uppercase hover:bg-green-500 hover:text-dark transition-all"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleApproveVehicle(v.id, 'rejected')}
                                className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[9px] uppercase hover:bg-red-500 hover:text-white transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingVehicles.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-muted font-bold text-[10px] uppercase tracking-widest font-mono italic opacity-40">No pending vehicle records found in buffer.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'commissions' && (
            <motion.div 
               key="commissions"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="bg-dark-1/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden font-sans">
                <div className="p-10 border-b border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-display font-black text-gold uppercase tracking-tighter">Financial Ledger</h3>
                    <p className="text-[10px] text-muted font-serif uppercase tracking-widest mt-1">Platform Revenue Stream Audit</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleExportCSV}
                      type="button"
                      className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-gold/30 rounded-xl text-muted hover:text-gold hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                      title="Download CSV Ledger"
                    >
                      <Download className="w-3.5 h-3.5 animate-pulse" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      type="button"
                      className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-gold/15 bg-gold/5 hover:bg-gold/10 hover:border-gold text-gold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      title="Download PDF statement"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF Audit Statement</span>
                    </button>
                    <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Aggregate Collected</p>
                      <p className="text-3xl font-display font-black text-white">ETB {commissions.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Tx Type</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Revenue Collected</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Base Rate</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Provider Source</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {commissions.map((c, i) => (
                        <tr key={`commission-row-${c.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-8">
                            <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                              c.type === 'rental' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gold/10 text-gold border-gold/20'
                            }`}>
                              {c.type}
                            </span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-white text-lg tracking-tighter">ETB {c.amount.toFixed(2)}</span>
                              <span className="text-[8px] text-muted/40 uppercase font-black tracking-widest mt-1">Tx: REC_{String(c.id).padStart(6, '0')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">{c.rate}% FLAT</span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white uppercase tracking-tight">{c.ownerName}</span>
                              <span className="text-[9px] text-gold font-bold uppercase mt-1">{c.vehicleName || 'GENERAL_PLATFORM'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <span className="inline-flex items-center gap-2 text-[9px] font-black text-green-400 uppercase tracking-[0.2em] px-4 py-2 bg-green-500/5 rounded-xl">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <div className="bg-dark-1 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">User Identity</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Role</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Verification</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u, i) => (
                      <tr key={`user-row-${u.userId}-${i}`} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white group-hover:text-gold transition-colors uppercase">{u.name}</span>
                            <span className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                           <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                             u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                             u.role === 'owner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/10 text-muted border-white/10'
                           }`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="px-8 py-8">
                          <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-8 py-8">
                           <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-white/5 rounded-full text-muted ${u.isVerified ? '!bg-green-500/10 !text-green-400 !border-green-500/20' : ''}`}>
                             {u.isVerified ? 'Verified' : 'Unverified'}
                           </span>
                        </td>
                        <td className="px-8 py-8">
                          <button 
                            onClick={() => handleUpdateUserStatus(u.userId!, u.status || 'active')} 
                            className="text-gold hover:text-white text-[10px] font-black uppercase tracking-widest underline underline-offset-4 decoration-gold/30 hover:decoration-white/30 transition-all font-mono"
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <motion.div 
               key="bookings"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
               <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                   <input 
                     type="text" 
                     placeholder="QUERY RENTAL LOGS..."
                     className="w-full py-4 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-gold/30 focus:outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
              </div>

               <div className="bg-dark-1/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden font-sans">
                 <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Booking ID</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Users</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Vehicle</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Period & Revenue</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Process Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                      {bookings
                        .filter(b => b.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) || b.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((b, i) => (
                        <tr key={`booking-row-${b.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="font-black text-white tracking-[0.2em] uppercase text-xs">BK_{String(b.id).padStart(5, '0')}</span>
                              <span className="text-[8px] text-muted/40 tracking-widest mt-1">LOGGED: {new Date(b.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-black text-white uppercase">{b.customerName}</span>
                              </div>
                              <div className="flex items-center gap-2 opacity-40">
                                <ShieldCheck className="w-3 h-3 text-gold" />
                                <span className="text-[9px] font-black text-gold uppercase">{b.ownerName || 'PLATFORM'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="text-sm font-display font-black text-white group-hover:text-gold transition-colors uppercase tracking-tight">{b.vehicleName}</span>
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">{b.category}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2 text-muted">
                                 <Calendar className="w-3 h-3" />
                                 <span>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</span>
                               </div>
                               <span className="text-lg font-display font-black text-white tracking-tighter">ETB {b.totalAmount.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <span className={`inline-block px-5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                              b.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
                              b.status === 'paid' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              b.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              b.status === 'cancelled' || b.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-white/5 text-muted border-white/10'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div 
               key="payments"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="relative flex-grow max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                   <input 
                     type="text" 
                     placeholder="AUDIT TRANSACTIONS..."
                     className="w-full py-4 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-gold/30 focus:outline-none transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
              </div>

              <div className="bg-dark-1/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden font-sans">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Tx Ledger ID</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Entity</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Settlement</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Verification Ref</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Audit State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                      {payments
                        .filter(p => (p.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.paymentReference || '').toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((p, i) => (
                        <tr key={`payment-row-${p.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="font-black text-white text-xs tracking-widest uppercase">PY_{String(p.id).padStart(6, '0')}</span>
                              <span className="text-[8px] text-muted/40 tracking-widest uppercase mt-1">Link: BK_{p.bookingId}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white uppercase">{p.customerName || 'UNKNOWN_IDENTITY'}</span>
                              <span className="text-[9px] text-gold font-bold uppercase tracking-tighter mt-1">{p.vehicleName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                              <span className="text-lg font-display font-black text-white tracking-tighter">ETB {p.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-gold" />
                                <span className="text-white font-black uppercase text-[9px]">{p.paymentMethod || 'MANUAL_WIRE'}</span>
                              </div>
                              <span className="text-muted/40 tracking-[0.2em] uppercase text-[8px] truncate max-w-[150px]">{p.paymentReference || 'NO_AUDIT_SEED'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <div className="flex items-center justify-end gap-3 text-[9px] font-black uppercase tracking-widest">
                              {p.paymentStatus === 'verified' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>CLEARED</span>
                                </div>
                              ) : p.paymentStatus === 'rejected' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>VOIDED</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>PENDING_AUDIT</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
