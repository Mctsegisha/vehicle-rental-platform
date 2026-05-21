import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, CreditCard, ExternalLink, Star, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { userService } from '../../services/userService';
import { Booking, UserProfile } from '../../types';
import ReviewSection from '../vehicles/ReviewSection';
import VerificationModal from './VerificationModal';
import PaymentModal from './PaymentModal';

interface CustomerDashboardProps {
  user: UserProfile;
}

export default function CustomerDashboard({ user: initialUser }: CustomerDashboardProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'approved'>('all');

  const fetchBookings = async () => {
    try {
      const [bData, vData] = await Promise.all([
        bookingService.getCustomerBookings(),
        userService.getMyVerificationRequests()
      ]);
      setBookings(Array.isArray(bData) ? bData : []);
      setVerificationRequests(Array.isArray(vData) ? vData : []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const stats = [
    { label: 'Total Bookings', value: (bookings || []).length, icon: Clock, color: 'bg-gold/10 text-gold' },
    { label: 'Approved Bookings', value: (bookings || []).filter(b => ['approved', 'paid', 'confirmed'].includes(b.status)).length, icon: CheckCircle2, color: 'bg-green-500/10 text-green-400' },
    { label: 'Pending Verifications', value: (verificationRequests || []).filter(vr => vr.status === 'pending').length, icon: Clock, color: 'bg-orange-500/10 text-orange-400' },
  ];

  const filteredBookings = (bookings || []).filter(booking => {
    if (bookingFilter === 'approved') {
      return ['approved', 'paid', 'confirmed'].includes(booking.status);
    }
    return true;
  });

  return (
    <div className="space-y-12">
      {/* Verification Banner */}
      {!user.isVerified && (
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
               <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-display font-black text-white text-lg tracking-tight">Not Verified</h3>
                <p className="text-sm text-muted mt-1">Access is limited. Complete identity verification to start booking vehicles.</p>
             </div>
          </div>
          <button 
            onClick={() => setIsVerificationModalOpen(true)}
            className="btn-primary px-8 py-4 text-[10px] tracking-widest whitespace-nowrap"
          >
            Start Verification
          </button>
        </div>
      )}

      {user.isVerified && (
         <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-8 flex items-center gap-6">
            <div className="p-4 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-lg tracking-tight inline-flex items-center gap-2 uppercase">
                Verified
              </h3>
              <p className="text-sm text-muted mt-1">Identity verified. Full access to rental services enabled.</p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Bookings Card */}
        <div 
          onClick={() => setBookingFilter('all')}
          className={`p-8 rounded-xl border shadow-2xl flex items-center gap-6 group hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
            bookingFilter === 'all' 
              ? 'bg-gold/5 border-gold/40 shadow-gold/5 text-white' 
              : 'bg-dark-1 border-white/5 hover:border-gold/25'
          }`}
        >
          <div className={`p-4 rounded-lg border border-white/5 transition-all ${
            bookingFilter === 'all' ? 'bg-gold/20 text-gold border-gold/30' : 'bg-gold/10 text-gold group-hover:border-gold/30'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Bookings</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-display font-black text-white">{(bookings || []).length}</p>
              {bookingFilter === 'all' && (
                <span className="text-[9px] font-black text-gold border border-gold/20 px-1.5 py-0.5 rounded uppercase tracking-wider bg-gold/5">Active Filter</span>
              )}
            </div>
          </div>
        </div>

        {/* Approved Bookings Card */}
        <div 
          onClick={() => setBookingFilter('approved')}
          className={`p-8 rounded-xl border shadow-2xl flex items-center gap-6 group hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
            bookingFilter === 'approved' 
              ? 'bg-green-500/5 border-green-500/40 shadow-green-500/5 text-white' 
              : 'bg-dark-1 border-white/5 hover:border-green-500/25'
          }`}
        >
          <div className={`p-4 rounded-lg border border-white/5 transition-all ${
            bookingFilter === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-500/10 text-green-400 group-hover:border-green-500/30'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Approved Bookings</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-display font-black text-white">
                {(bookings || []).filter(b => ['approved', 'paid', 'confirmed'].includes(b.status)).length}
              </p>
              {bookingFilter === 'approved' && (
                <span className="text-[9px] font-black text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider bg-green-500/5">Active Filter</span>
              )}
            </div>
          </div>
        </div>

        {/* Pending Verifications Card */}
        <div 
          onClick={() => setIsVerificationModalOpen(true)}
          className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl flex items-center gap-6 group hover:border-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="p-4 rounded-lg border border-white/5 bg-orange-500/10 text-orange-400 group-hover:border-orange-500/30 transition-all">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Pending Verifications</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-display font-black text-white">
                {(verificationRequests || []).filter(vr => vr.status === 'pending').length}
              </p>
              <span className="text-[9px] font-black text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors">Verify Now</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-8 ml-1">My Booking History</h2>
        <div className="bg-dark-1 rounded-xl border border-white/5 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center animate-pulse space-y-4">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-4 bg-white/5 rounded w-4/6" />
            </div>
          ) : bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Vehicle</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Booking Period</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Total Amount</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-muted uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((booking, i) => (
                    <tr key={`customer-booking-${booking.id}-${i}`} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-8">
                         <div className="font-display font-black text-white group-hover:text-gold transition-colors">{booking.vehicleName || `Vehicle-${booking.vehicleId}`}</div>
                         <div className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1">{booking.category}</div>
                      </td>
                      <td className="px-8 py-8 text-xs text-muted font-bold font-mono">
                        {booking.startDate} // {booking.endDate}
                      </td>
                      <td className="px-8 py-8 font-mono font-bold text-white uppercase tracking-tighter">ETB {booking.totalAmount}</td>
                      <td className="px-8 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border ${
                          booking.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          booking.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          booking.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        {booking.status === 'approved' && (
                          <button 
                            onClick={() => setPayingBooking(booking)}
                            className="flex items-center gap-2 text-gold font-bold text-[10px] uppercase tracking-widest hover:underline underline-offset-4"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Now
                          </button>
                        )}
                        {booking.status === 'paid' && (
                            <span className="text-orange-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              Verifying Payment
                            </span>
                        )}
                        {booking.status === 'confirmed' && (
                           <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             Booking Confirmed
                           </span>
                        )}
                        {booking.status === 'completed' && (
                          <button 
                            onClick={() => setReviewingBooking(booking)}
                            className="flex items-center gap-2 text-gold font-bold text-[10px] uppercase tracking-widest hover:underline underline-offset-4"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Write a Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
               <p className="text-muted font-bold text-[10px] uppercase tracking-widest">No bookings found.</p>
               <Link to="/vehicles" className="mt-6 btn-primary px-8 py-4 inline-block text-[10px] tracking-widest">Browse Vehicles</Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingBooking(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-dark-2 w-full max-w-lg rounded-[14px] p-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-gold/15"
            >
              <button
                onClick={() => setReviewingBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-all group"
              >
                <X className="w-5 h-5 text-muted group-hover:text-gold" />
              </button>

              <h2 className="text-3xl font-display font-black text-white mb-2 leading-none uppercase">Vehicle Review</h2>
              <p className="text-muted font-bold text-xs mt-3 uppercase tracking-widest mb-10">Share your feedback about the rental.</p>

              <ReviewSection 
                vehicleId={reviewingBooking.vehicleId} 
                canReview={true} 
                bookingId={reviewingBooking.id}
                onReviewSubmitted={() => setReviewingBooking(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PaymentModal 
        booking={payingBooking}
        isOpen={!!payingBooking}
        onClose={() => setPayingBooking(null)}
        onSuccess={() => {
          setPayingBooking(null);
          fetchBookings();
        }}
      />

      <VerificationModal 
        user={user} 
        isOpen={isVerificationModalOpen} 
        onClose={() => setIsVerificationModalOpen(false)}
        onSuccess={(updatedUser) => setUser(updatedUser)}
      />
    </div>
  );
}
