import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, FileText, CreditCard, ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle, ChevronRight, Eye } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { adminService, AdminStats } from '../../services/adminService';
import { bookingService } from '../../services/bookingService';
import { Payment, UserProfile } from '../../types';

interface AdminDashboardProps {
  user: UserProfile;
}

type Tab = 'overview' | 'users' | 'bookings' | 'payments' | 'verifications';

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, uData, sData, bData, vData] = await Promise.all([
          paymentService.getAllPayments(),
          userService.getAllUsers(),
          adminService.getStats(),
          adminService.getBookings(),
          adminService.getVerifications()
        ]);
        setPayments(Array.isArray(pData) ? pData : []);
        setUsers(Array.isArray(uData) ? uData : []);
        setBookings(Array.isArray(bData) ? bData : []);
        setVerifications(Array.isArray(vData) ? vData : []);
        setStats(sData);
      } catch (err) {
        console.error('AdminDashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerifyPayment = async (id: number) => {
    await paymentService.verifyPayment(id);
    setPayments(payments.map(p => p.id === id ? { ...p, paymentStatus: 'verified', verifiedByAdmin: true } : p));
  };

  const handleUpdateUserStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await userService.updateUser(userId, { status: newStatus });
    setUsers(users.map(u => u.userId === userId ? { ...u, status: newStatus } : u));
  };

  const handleToggleVerification = async (userId: number, currentVerified: boolean) => {
    await userService.updateUser(userId, { isVerified: !currentVerified });
    setUsers(users.map(u => u.userId === userId ? { ...u, isVerified: !currentVerified } : u));
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div 
          onClick={() => setActiveTab('users')}
          className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl flex items-center gap-6 cursor-pointer hover:border-gold/20 transition-all group"
        >
          <div className="p-4 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-3xl font-display font-black text-white">{stats?.totalUsers || users.length}</p>
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('payments')}
          className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl flex items-center gap-6 cursor-pointer hover:border-gold/20 transition-all group"
        >
          <div className="p-4 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:border-orange-500/40 transition-all">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Pending Payments</p>
            <p className="text-3xl font-display font-black text-orange-400">{stats?.pendingPayments || payments.filter(p => !p.verifiedByAdmin).length}</p>
          </div>
        </div>
        <div className="bg-dark-1 p-8 rounded-xl border border-gold/20 shadow-2xl flex items-center gap-6 cursor-pointer hover:border-gold/30 transition-all group">
          <div className="p-4 rounded-lg bg-gold/10 text-gold border border-gold/20 group-hover:border-gold/40 transition-all">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-3xl font-display font-black text-gold">ETB {(stats?.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('bookings')}
          className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl flex items-center gap-6 cursor-pointer hover:border-gold/20 transition-all group"
        >
          <div className="p-4 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:border-blue-500/40 transition-all">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Bookings</p>
            <p className="text-3xl font-display font-black text-blue-400">{stats?.totalBookings || bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-2 bg-dark-1 border border-white/5 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: ShieldCheck },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'bookings', label: 'Bookings', icon: Clock },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'verifications', label: 'Verifications', icon: AlertCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-gold text-dark shadow-xl shadow-gold/20' 
              : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-dark-1 p-10 rounded-xl border border-white/5 shadow-2xl h-fit">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-10 pb-4 border-b border-white/5">Recent Users</h3>
                <div className="space-y-4">
                  {users.slice(0, 5).map((u, i) => (
                    <div key={`recent-user-${u.userId}-${i}`} className="flex items-center justify-between p-4 bg-dark-2 rounded-lg border border-white/5 group hover:border-gold/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-display font-black text-sm group-hover:bg-gold group-hover:text-dark transition-all">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{u.name}</p>
                          <p className="text-[9px] font-bold text-muted uppercase tracking-wider">{u.role} // Registered {new Date(u.createdAt || '').toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        u.isVerified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {u.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('users')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/5 rounded-lg border border-gold/10 mt-6 transition-all">
                    View All Users
                  </button>
                </div>
              </div>

              <div className="bg-dark-1 p-10 rounded-xl border border-white/5 shadow-2xl h-fit">
                <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-10 pb-4 border-b border-white/5">Recent Bookings</h3>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((b, i) => (
                    <div key={`recent-booking-${b.id}-${i}`} className="flex items-center justify-between p-4 bg-dark-2 rounded-lg border border-white/5 group hover:border-gold/20 transition-all">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{b.vehicleName}</p>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-wider">BY {b.customerName} // {new Date(b.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-white">ETB {b.totalAmount}</p>
                        <p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-1 ${
                          b.status === 'confirmed' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {b.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('bookings')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/5 rounded-lg border border-gold/10 mt-6 transition-all">
                    View All Bookings
                  </button>
                </div>
              </div>
            </div>
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
            <div className="bg-dark-1 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Booking ID</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Vehicle</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Customer</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Dates</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Reference</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                    {bookings.map((b, i) => (
                      <tr key={`booking-row-${b.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-8 font-bold text-muted tracking-tighter">BK_{String(b.id).padStart(4, '0')}</td>
                        <td className="px-8 py-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-display font-black text-white group-hover:text-gold transition-colors uppercase tracking-tight">{b.vehicleName}</span>
                            <span className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1">{b.vehicleCategory}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase">{b.customerName}</span>
                            <span className="text-[9px] text-muted tracking-wide">{b.customerEmail}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-muted uppercase tracking-widest leading-loose">
                          {new Date(b.startDate).toLocaleDateString()} <br/> TO <br/> {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-8 font-bold text-white tracking-widest">ETB {b.totalAmount}</td>
                        <td className="px-8 py-8">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border ${
                            b.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            b.status === 'paid' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-8 py-8">
                           {b.paymentReference ? (
                             <span className="text-[9px] font-black text-gold bg-gold/10 px-3 py-1 rounded border border-gold/20 uppercase tracking-widest">
                               {b.paymentReference}
                             </span>
                           ) : (
                             <span className="text-[9px] text-muted/20 font-black italic uppercase">N/A</span>
                           )}
                        </td>
                        <td className="px-8 py-8">
                          {b.status === 'paid' && (
                            <button 
                              onClick={async () => {
                                await bookingService.updateBookingStatus(b.id, 'confirmed');
                                // Refresh bookings
                                const data = await adminService.getBookings();
                                setBookings(Array.isArray(data) ? data : []);
                              }}
                              className="px-6 py-3 bg-gold text-dark rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/20 active:scale-95"
                            >
                              Confirm Booking
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-dark-1 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Transaction ID</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Booking Ref</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Status Detail</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                    {payments.map((p, i) => (
                      <tr key={`payment-row-${p.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-8 font-bold text-muted">PY_{String(p.id).padStart(4, '0')}</td>
                        <td className="px-8 py-8 text-white font-bold tracking-widest uppercase">BK_{p.bookingId}</td>
                        <td className="px-8 py-8 font-display font-black text-gold text-base tracking-tighter">ETB {p.amount}</td>
                        <td className="px-8 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            p.verifiedByAdmin ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                             {p.verifiedByAdmin ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
                             {p.verifiedByAdmin ? 'Verified' : 'Pending Verification'}
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           {!p.verifiedByAdmin && (
                             <button 
                               onClick={() => handleVerifyPayment(p.id)}
                               className="px-6 py-3 bg-gold text-dark rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/20 active:scale-95"
                             >
                               Verify Payment
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-8">
               <div className="bg-dark-1 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">User</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Details</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Documents</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Owner</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {verifications.map((v, i) => {
                        const targetUser = users.find(u => u.userId === v.customer_id);
                        return (
                          <tr key={`verification-row-${v.request_id}-${i}`} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-8">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-white group-hover:text-gold transition-colors uppercase tracking-tight">{v.customer_name}</span>
                                <span className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">{v.customer_email}</span>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <div className="text-[10px] space-y-2 font-mono uppercase tracking-widest overflow-hidden">
                                <p><span className="text-muted/40">Age:</span> <span className="font-bold text-muted">{v.age || 'N/A'}</span></p>
                                <p><span className="text-muted/40">License:</span> <span className="font-bold text-muted truncate max-w-[100px] inline-block align-bottom">{v.driver_license_number || 'N/A'}</span></p>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <div className="flex gap-3">
                                {v.id_photo_url && (
                                  <a href={v.id_photo_url} target="_blank" rel="noreferrer" className="p-3 bg-white/5 text-gold rounded-lg border border-white/10 hover:border-gold/30 transition-all group" title="View ID Photo">
                                    <Eye className="w-4 h-4" />
                                  </a>
                                )}
                                {v.license_photo_url && (
                                  <a href={v.license_photo_url} target="_blank" rel="noreferrer" className="p-3 bg-white/5 text-gold rounded-lg border border-white/10 hover:border-gold/30 transition-all group" title="View License Photo">
                                    <FileText className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted/40 uppercase font-black tracking-widest leading-none mb-2">Owner</span>
                                <span className="text-[11px] font-bold text-white uppercase tracking-tighter">{v.owner_name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                               <button 
                                 onClick={() => handleToggleVerification(v.customer_id, targetUser?.isVerified || false)}
                                 className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border ${
                                   targetUser?.isVerified 
                                     ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                                     : 'bg-gold text-dark border-gold hover:scale-105 shadow-gold/20'
                                 }`}
                               >
                                 {targetUser?.isVerified ? 'Verified ✓' : 'Verify Now'}
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                      {verifications.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-20 text-center text-muted font-bold text-[10px] uppercase tracking-widest font-mono">No pending verifications found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

               {/* All Users with Docs (Manual Verification) */}
               <div className="bg-dark-1 p-10 rounded-xl border border-white/5 shadow-2xl">
                 <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-10 pb-4 border-b border-white/5 flex items-center gap-4">
                   <Users className="w-5 h-5" />
                   User Verification Management
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {users.filter(u => u.role === 'customer').map((u, i) => (
                     <div key={`customer-card-${u.userId}-${i}`} className="p-8 bg-dark-2 rounded-xl border border-white/5 group hover:border-gold/20 transition-all">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <p className="font-display font-black text-white text-lg tracking-tight uppercase">{u.name}</p>
                            <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">{u.email}</p>
                          </div>
                          <span className={`p-2 rounded-lg border ${u.isVerified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                            {u.isVerified ? <CheckCircle2 className="w-4 h-4 font-black" /> : <Clock className="w-4 h-4 font-black" />}
                          </span>
                        </div>
                        <div className="space-y-4 mb-10 font-mono">
                           <div className="flex justify-between text-[10px]">
                             <span className="text-muted/40 uppercase tracking-widest font-bold">Age</span>
                             <span className="font-bold text-muted">{u.age || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                             <span className="text-muted/40 uppercase tracking-widest font-bold">License No</span>
                             <span className="font-bold text-muted truncate max-w-[120px]">{u.driverLicenseNumber || 'N/A'}</span>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             disabled={!u.idPhotoUrl}
                             onClick={() => u.idPhotoUrl && window.open(u.idPhotoUrl)}
                             className="flex-1 py-3 bg-dark-1 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5 text-muted hover:bg-white/5 hover:text-white disabled:opacity-10 transition-all"
                           >
                             View ID
                           </button>
                           <button 
                             disabled={!u.licensePhotoUrl}
                             onClick={() => u.licensePhotoUrl && window.open(u.licensePhotoUrl)}
                             className="flex-1 py-3 bg-dark-1 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5 text-muted hover:bg-white/5 hover:text-white disabled:opacity-10 transition-all"
                           >
                             View License
                           </button>
                        </div>
                        <button 
                          onClick={() => handleToggleVerification(u.userId!, u.isVerified || false)}
                          className={`w-full mt-6 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                            u.isVerified ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-gold text-dark border-gold hover:scale-105'
                          }`}
                        >
                          {u.isVerified ? 'Revoke Verification' : 'Verify User'}
                        </button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
