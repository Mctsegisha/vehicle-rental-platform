import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Car, ListChecks, DollarSign, Check, X, Edit2, 
  ShieldCheck, Trash2, ArrowUpRight, TrendingUp, Calendar,
  Users, CreditCard, Activity, MapPin, Search, ChevronRight,
  Download, FileText, AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { vehicleService } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { Vehicle, Booking, UserProfile } from '../../types';
import AddVehicleModal from '../vehicles/AddVehicleModal';
import { exportToCSV, exportToPDF } from '../../utils/reportExporter';

interface OwnerDashboardProps {
  user: UserProfile;
}

type TabType = 'overview' | 'vehicles' | 'bookings' | 'verifications' | 'finance';

export default function OwnerDashboard({ user }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [vData, bData, vrData, pData] = await Promise.all([
        vehicleService.getOwnerVehicles(),
        bookingService.getOwnerBookings(),
        userService.getOwnerVerificationRequests(),
        paymentService.getOwnerPayments()
      ]);
      setVehicles(Array.isArray(vData) ? vData : []);
      setBookings(Array.isArray(bData) ? bData : []);
      setVerificationRequests(Array.isArray(vrData) ? vrData : []);
      setPayments(Array.isArray(pData) ? pData : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Reference', 'Vehicle Name', 'Transaction Date', 'Amount (ETB)', 'Status'];
    const rows = payments.map(p => [
      `PY_${String(p.id).padStart(4, '0')}`,
      p.vehicleName || 'General',
      new Date(p.createdAt).toLocaleDateString(),
      `ETB ${p.amount.toLocaleString()}`,
      p.paymentStatus.toUpperCase()
    ]);
    exportToCSV(headers, rows, `owner_finance_statement_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const summaryMetrics = [
      { label: 'Total Earnings', value: `ETB ${stats.totalEarnings.toLocaleString()}` },
      { label: 'Platform Fee (5%)', value: `ETB ${(stats.totalEarnings * 0.05).toFixed(0).toLocaleString()}` },
      { label: 'Net Revenue', value: `ETB ${(stats.totalEarnings * 0.95).toFixed(0).toLocaleString()}` }
    ];
    const tableHeaders = ['Reference', 'Vehicle', 'Date', 'Amount', 'Status'];
    const tableRows = payments.map(p => [
      `PY_${String(p.id).padStart(4, '0')}`,
      (p.vehicleName || 'General').toUpperCase(),
      new Date(p.createdAt).toLocaleDateString(),
      `ETB ${p.amount.toLocaleString()}`,
      p.paymentStatus.toUpperCase()
    ]);
    exportToPDF({
      type: 'owner',
      title: 'Provider Earnings Statement',
      subtitle: 'Official transaction log of processed vehicle rentals and platform offsets.',
      userName: user.name,
      userEmail: user.email,
      summaryMetrics,
      tableHeaders,
      tableRows,
      fileName: `owner_earnings_statement_${new Date().toISOString().split('T')[0]}`
    });
  };

  const pendingStats = useMemo(() => {
    const pBookings = (bookings || []).filter(b => b.status === 'pending');
    // Important fix for double counting: Only count payment proof if it's currently actionable (booking is 'paid')
    const pPayments = (payments || []).filter(p => {
      const booking = bookings.find(b => b.id === p.bookingId);
      return p.paymentStatus === 'pending' && booking?.status === 'paid';
    });
    const pVerifications = (verificationRequests || []).filter(vr => vr.status === 'pending');
    
    return {
      bookings: pBookings,
      payments: pPayments,
      verifications: pVerifications,
      total: pBookings.length + pPayments.length + pVerifications.length
    };
  }, [bookings, payments, verificationRequests]);

  const stats = useMemo(() => {
    const totalEarnings = bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const activeRentals = bookings.filter(b => ['approved', 'paid', 'confirmed'].includes(b.status)).length;
    
    // Revenue chart data (last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayEarnings = bookings
        .filter(b => b.createdAt.split('T')[0] === dateStr && (b.status === 'completed' || b.status === 'confirmed'))
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      return {
        date: date.toLocaleDateString(undefined, { weekday: 'short' }),
        revenue: dayEarnings
      };
    });

    return { totalEarnings, activeRentals, revenueData: last7Days };
  }, [bookings]);

  const handleBookingAction = async (id: number, status: 'approved' | 'rejected' | 'completed') => {
    let finalStatus: string = status;
    if (status === 'approved') {
      const booking = bookings.find(b => b.id === id);
      if (booking?.paymentReference) {
        finalStatus = 'paid';
      }
    }
    await bookingService.updateBookingStatus(id, finalStatus);
    await fetchData();
  };

  const handleVerifyPayment = async (paymentId: number) => {
    try {
      await paymentService.ownerVerifyPayment(paymentId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to verify payment');
    }
  };

  const handleDeleteVehicle = (v: Vehicle) => {
    setDeleteError(null);
    setVehicleToDelete(v);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      setVehicleToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditVehicle = (v: Vehicle) => {
    setVehicleToEdit(v);
    setIsAddModalOpen(true);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-muted font-mono text-[10px] uppercase tracking-widest animate-pulse">Syncing Provider Data</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 font-sans text-white">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight uppercase">Provider Console</h1>
          <p className="text-xs text-muted font-mono mt-2 flex items-center gap-2 uppercase tracking-widest">
            <Activity className="w-3 h-3 text-gold" />
            Control Hub for {user.name}
          </p>
        </div>

        <nav className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['overview', 'vehicles', 'bookings', 'verifications', 'finance'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-gold text-dark shadow-lg shadow-gold/20' 
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              <div 
                onClick={() => setActiveTab('finance')}
                className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-gold/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gold/10 rounded-xl">
                    <DollarSign className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded">+12%</span>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors" />
                  </div>
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Net Earnings</p>
                <p className="text-3xl font-display font-black text-white mt-1">ETB {stats.totalEarnings.toLocaleString()}</p>
              </div>

              <div 
                onClick={() => setActiveTab('vehicles')}
                className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-blue-400/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-400/10 rounded-xl">
                    <Car className="w-5 h-5 text-blue-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Active Fleet</p>
                <p className="text-3xl font-display font-black text-white mt-1">{vehicles.length}</p>
              </div>

              <div 
                onClick={() => setActiveTab('bookings')}
                className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-gold/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gold/10 rounded-xl">
                    <Activity className="w-5 h-5 text-gold" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Pending Requests</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-display font-black text-gold mt-1">{pendingStats.bookings.length}</p>
                  {pendingStats.bookings.length > 0 && <span className="animate-ping absolute top-8 right-8 w-2 h-2 bg-gold rounded-full" />}
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('verifications')}
                className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-gold/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gold/10 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-gold" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-gold transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Pending Identity Verifications</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-display font-black text-gold mt-1">{pendingStats.verifications.length}</p>
                  {pendingStats.verifications.length > 0 && <span className="animate-ping absolute top-8 right-8 w-2 h-2 bg-gold rounded-full" />}
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('bookings')}
                className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl group hover:border-purple-400/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-400/10 rounded-xl">
                    <ListChecks className="w-5 h-5 text-purple-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em]">Active Rentals</p>
                <p className="text-3xl font-display font-black text-white mt-1">{stats.activeRentals}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-display font-black uppercase tracking-tight">Revenue Stream</h3>
                    <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">Earnings performance over 7 days</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                      <div className="w-2 h-2 bg-gold rounded-full" />
                      <span className="text-[10px] font-bold uppercase">Revenue</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full min-w-0 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={stats.revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
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
                        tickFormatter={(v) => `E ${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        labelStyle={{ color: '#D4AF37', fontWeight: 'bold', marginBottom: '4px' }}
                        itemStyle={{ color: '#fff', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#D4AF37" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-6">
                <div className="bg-gold p-8 rounded-3xl shadow-2xl shadow-gold/10 text-dark relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-xl font-display font-black uppercase tracking-tight mb-2 leading-none">New Fleet Member?</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-8 opacity-80">List a vehicle and start earning today</p>
                    <button 
                      onClick={() => {
                        setVehicleToEdit(null);
                        setIsAddModalOpen(true);
                      }}
                      className="w-full py-4 bg-dark text-gold rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3"
                    >
                      <Plus className="w-4 h-4" />
                      Add Vehicle
                    </button>
                  </div>
                  <Car className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                </div>

                <div className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    {bookings.slice(0, 4).map((b, i) => (
                      <div key={`activity-${b.id}-${i}`} className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          b.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          b.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase leading-none">{b.vehicleName}</p>
                          <p className="text-[9px] text-muted font-mono mt-1 uppercase tracking-tight">
                            {b.status === 'completed' ? 'Rental Completed' : `Booking ${b.status}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <p className="text-[10px] text-muted/30 italic text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'vehicles' && (
          <motion.div 
            key="vehicles"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="SEARCH FLEET..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 pl-12 pr-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-gold/30 focus:outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setVehicleToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="px-8 py-4 bg-gold text-dark rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-gold/10"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vehicles
                .filter(v => v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || v.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((v, i) => (
                <div key={`v-${v.id}-${i}`} className="bg-dark-1/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl group hover:border-gold/20 transition-all flex flex-col">
                  <div className="relative aspect-[16/10] bg-dark-3 rounded-2xl overflow-hidden mb-6">
                    {v.images?.[0] ? (
                      <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10">
                        <Car className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button onClick={() => handleEditVehicle(v)} className="p-3 bg-dark/80 backdrop-blur-md rounded-xl text-gold border border-gold/20 hover:bg-gold hover:text-dark transition-all"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => handleDeleteVehicle(v)} className="p-3 bg-dark/80 backdrop-blur-md rounded-xl text-red-400 border border-red-400/20 hover:bg-red-400 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="px-2 flex-grow">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xl font-display font-black uppercase tracking-tight text-white mb-1">{v.name || v.category}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-widest mb-4">
                          <MapPin className="w-3 h-3 text-gold" />
                          {v.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-display font-black text-gold">ETB {v.pricePerDay}</p>
                        <p className="text-[8px] text-muted font-bold uppercase tracking-widest">PER DAY</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] text-muted uppercase font-black mb-1">Total Bookings</p>
                        <p className="text-sm font-display font-black text-white">{bookings.filter(b => b.vehicleId === v.id).length}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] text-muted uppercase font-black mb-1">Revenue</p>
                        <p className="text-sm font-display font-black text-gold">
                          {bookings.filter(b => b.vehicleId === v.id && (b.status === 'completed' || b.status === 'confirmed')).reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        v.availabilityStatus === 'available' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {v.availabilityStatus === 'available' ? 'Operational' : 'Reserved'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        v.approvalStatus === 'approved' ? 'text-green-500' : 
                        v.approvalStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        {v.approvalStatus || 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="lg:col-span-3 p-20 text-center bg-dark-1/50 rounded-3xl border border-dashed border-white/10">
                   <p className="text-muted font-display font-black text-2xl uppercase tracking-widest opacity-20">Your fleet is empty</p>
                   <button onClick={() => setIsAddModalOpen(true)} className="text-gold text-[10px] font-black mt-4 uppercase tracking-[0.3em] hover:scale-110 transition-transform">Start Listing Now</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div 
            key="bookings-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Booking Requests */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] pl-2 flex items-center gap-3">
                <ListChecks className="w-4 h-4 text-gold" />
                Booking Management
              </h3>
              <div className="space-y-4">
                {bookings
                  .filter(b => ['pending', 'paid', 'confirmed'].includes(b.status))
                  .sort((a, b) => {
                    const priority: Record<string, number> = { 'pending': 0, 'paid': 1, 'confirmed': 2 };
                    return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
                  })
                  .map((booking, i) => (
                  <div key={`b-req-${booking.id}-${i}`} className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative group">
                    <div className="flex items-start justify-between gap-6 mb-6">
                      <div>
                        <h4 className="text-xl font-display font-black uppercase tracking-tight text-white leading-none mb-2">{booking.vehicleName}</h4>
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          booking.status === 'paid' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-display font-black text-gold tracking-tighter">ETB {booking.totalAmount.toLocaleString()}</p>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Total Fee</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-8 text-[11px] font-mono text-muted">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em] mb-1">Pick Up</span>
                        <div className="flex items-center gap-2">
                           <Calendar className="w-3 h-3" />
                           {new Date(booking.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em] mb-1">Drop Off</span>
                        <div className="flex items-center gap-2">
                           <Calendar className="w-3 h-3" />
                           {new Date(booking.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleBookingAction(booking.id, 'rejected')}
                            className="flex-1 py-4 bg-red-400/10 text-red-400 border border-red-400/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-400/20 transition-all font-mono"
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => handleBookingAction(booking.id, 'approved')}
                            className="flex-[2] py-4 bg-gold text-dark rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gold/20 hover:scale-[1.02] transition-all"
                          >
                            Approve Booking
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => handleBookingAction(booking.id, 'completed')}
                          className="w-full py-4 bg-green-500/10 text-green-400 border border-green-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all"
                        >
                          Complete Booking
                        </button>
                      )}

                      {booking.status === 'paid' && (
                         <div className="w-full space-y-4">
                           <div className="p-4 bg-orange-400/5 border border-orange-400/10 rounded-2xl flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Payment Proof Details</p>
                                <p className="text-[9px] text-muted mt-1 uppercase font-mono">Reference: {booking.paymentReference}</p>
                              </div>
                              <CreditCard className="w-6 h-6 text-orange-500 opacity-20" />
                           </div>
                           {payments.find(p => p.bookingId === booking.id && p.paymentStatus === 'pending') && (
                              <div className="flex gap-3">
                                <button 
                                  onClick={async () => {
                                    if(window.confirm('Reject this proof?')) {
                                      await paymentService.ownerVerifyPayment(payments.find(p => p.bookingId === booking.id)!.id, 'reject');
                                      fetchData();
                                    }
                                  }}
                                  className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest font-mono"
                                >
                                  Invalidate
                                </button>
                                <button 
                                  onClick={() => handleVerifyPayment(payments.find(p => p.bookingId === booking.id)!.id)}
                                  className="flex-[2] py-4 bg-gold text-dark rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gold/20"
                                >
                                  Confirm Deposit
                                </button>
                              </div>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.filter(b => ['pending', 'paid', 'confirmed'].includes(b.status)).length === 0 && (
                   <div className="p-16 text-center bg-dark-1/30 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center">
                      <ListChecks className="w-12 h-12 text-gold opacity-40 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest text-white mb-2">No Active Booking Requests</p>
                      <p className="text-xs text-muted/60 max-w-md">There are currently no active rental or booking requests submitted by renters. When a client requests to reserve one of your vehicles, it will appear here so you can approve, decline, or process payment confirmations.</p>
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'verifications' && (
          <motion.div 
            key="verifications-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Verification Requests */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] pl-2 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Identity Verification
              </h3>
              <div className="space-y-4">
                {verificationRequests.map((vr, i) => (
                  <div key={`vr-${vr.request_id}-${i}`} className="bg-dark-1/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                         <h4 className="text-lg font-display font-black uppercase tracking-tight text-white mb-1">{vr.customer_name}</h4>
                         <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{vr.customer_email}</p>
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => userService.updateVerificationRequestStatus(vr.request_id, 'rejected').then(fetchData)}
                           className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                         >
                           <X className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => userService.updateVerificationRequestStatus(vr.request_id, 'approved').then(fetchData)}
                           className="p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
                         >
                           <Check className="w-5 h-5" />
                         </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 group cursor-pointer" onClick={() => window.open(vr.id_photo_url, '_blank')}>
                         <p className="text-[8px] font-black text-muted uppercase tracking-[0.3em]">National ID</p>
                         <div className="aspect-video rounded-xl bg-dark-3 overflow-hidden border border-white/5 relative">
                           <img src={vr.id_photo_url} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="ID" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark/40">
                             <Search className="w-6 h-6 text-white" />
                           </div>
                         </div>
                      </div>
                      <div className="space-y-2 group cursor-pointer" onClick={() => window.open(vr.license_photo_url, '_blank')}>
                         <p className="text-[8px] font-black text-muted uppercase tracking-[0.3em]">Driver's License</p>
                         <div className="aspect-video rounded-xl bg-dark-3 overflow-hidden border border-white/5 relative">
                           <img src={vr.license_photo_url} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="License" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark/40">
                             <Search className="w-6 h-6 text-white" />
                           </div>
                         </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted">
                        <div>Age: <span className="text-white font-black">{vr.age}Y</span></div>
                        <div>Doc ID: <span className="text-white font-mono">{vr.driver_license_number}</span></div>
                    </div>
                  </div>
                ))}
                {verificationRequests.length === 0 && (
                   <div className="p-16 text-center bg-dark-1/30 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center">
                      <ShieldCheck className="w-12 h-12 text-gold opacity-40 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest text-white mb-2">No Pending Verifications</p>
                      <p className="text-xs text-muted/60 max-w-md">All renter verification queues are currently empty. Renters request identity validations through driver's licenses and national IDs, ensuring full safety of the vehicles. You're completely up to date.</p>
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'finance' && (
          <motion.div 
            key="finance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                   <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Revenue Generated</p>
                   <p className="text-4xl font-display font-black text-white tracking-tighter">ETB {stats.totalEarnings.toLocaleString()}</p>
                   <div className="mt-10 pt-10 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest mb-4">
                        <span className="text-muted">Gross Bookings</span>
                        <span>ETB {(stats.totalEarnings * 1.1).toFixed(0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="text-muted">Platform Commission (5%)</span>
                        <span className="text-red-400">- ETB {(stats.totalEarnings * 0.05).toFixed(0)}</span>
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 bg-dark-1/50 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                     <div>
                       <h3 className="text-xl font-display font-black uppercase tracking-tight">Transaction Audit Trail</h3>
                       <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em] mt-1">Export transaction & earnings ledger</p>
                     </div>
                     <div className="flex gap-2.5">
                       <button
                         onClick={handleExportCSV}
                         type="button"
                         className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-gold/30 rounded-xl text-muted hover:text-gold hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
                         title="Download CSV Spreadsheet"
                       >
                         <Download className="w-3.5 h-3.5" />
                         <span>CSV</span>
                       </button>
                       <button
                         onClick={handleExportPDF}
                         type="button"
                         className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-gold/15 bg-gold/5 hover:bg-gold/10 hover:border-gold text-gold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                         title="Download PDF statement"
                       >
                         <FileText className="w-3.5 h-3.5" />
                         <span>PDF Statement</span>
                       </button>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[9px] uppercase font-black tracking-widest text-muted border-b border-white/5">
                          <th className="pb-4">Reference</th>
                          <th className="pb-4">Vehicle</th>
                          <th className="pb-4">Date</th>
                          <th className="pb-4">Amount</th>
                          <th className="pb-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                        {payments.map((p, i) => (
                          <tr key={`p-log-${p.id}-${i}`} className="group hover:bg-white/5 transition-colors">
                            <td className="py-4 text-muted">PY_{String(p.id).padStart(4, '0')}</td>
                            <td className="py-4 font-bold text-white uppercase">{p.vehicleName}</td>
                            <td className="py-4 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 font-bold text-gold">ETB {p.amount.toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                p.paymentStatus === 'verified' ? 'text-green-400 bg-green-400/10' :
                                p.paymentStatus === 'rejected' ? 'text-red-400 bg-red-400/10' :
                                'text-orange-400 bg-orange-400/10'
                              }`}>
                                {p.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddVehicleModal 
        isOpen={isAddModalOpen} 
        vehicleToEdit={vehicleToEdit}
        onClose={() => {setIsAddModalOpen(false); setVehicleToEdit(null);}} 
        onSuccess={fetchData} 
      />

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {vehicleToDelete && (
          <div key="delete-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              key="delete-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isDeleting) setVehicleToDelete(null); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              key="delete-modal-container"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-dark-2 w-full max-w-md rounded-[14px] border border-red-500/10 shadow-3xl p-8 text-center space-y-6 overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-black text-white tracking-tight uppercase">Confirm Fleet Deletion</h3>
                <p className="text-[10px] uppercase font-black tracking-wider text-muted font-mono">{vehicleToDelete.name}</p>
              </div>

              {/* Vehicle Preview Card inside Modal */}
              <div className="relative aspect-[16/9] bg-dark-3 rounded-lg overflow-hidden border border-white/5 opacity-80">
                {vehicleToDelete.images?.[0] ? (
                  <img src={vehicleToDelete.images[0]} alt={vehicleToDelete.name} className="w-full h-full object-cover grayscale" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <Car className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-2 to-transparent opacity-60" />
                <div className="absolute bottom-3 left-3 text-left">
                  <p className="text-xs font-black text-white">{vehicleToDelete.name}</p>
                  <p className="text-[9px] text-muted font-mono">{vehicleToDelete.plateNumber}</p>
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <p className="text-[11px] text-muted leading-relaxed font-semibold uppercase tracking-wider">
                  Are you absolutely sure you want to remove this vehicle from your fleet?
                </p>
                <p className="text-[9px] text-red-400 font-mono uppercase bg-red-500/5 py-2 px-3 rounded border border-red-500/10 inline-block leading-relaxed">
                  ⚠️ This action is permanent. All historical reviews, bookings, and financial payment entries for this specific vehicle will be removed cascadingly.
                </p>
              </div>

              {deleteError && (
                <div className="p-4 bg-red-500/10 border border-red-500/15 text-red-500 rounded-xl text-[10px] font-black uppercase text-left tracking-wide leading-relaxed">
                  ❌ Error: {deleteError}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setVehicleToDelete(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-muted hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-white/5 disabled:opacity-50"
                >
                  No, Keep Vehicle
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-[1.5] py-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-red-500/10 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Fleet'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

