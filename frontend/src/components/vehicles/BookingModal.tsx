import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, DollarSign, Clock, MapPin, CheckCircle2, AlertCircle, ShieldAlert, CreditCard, Car } from 'lucide-react';
import { Vehicle, UserProfile } from '../../types';
import { bookingService } from '../../services/bookingService';
import { userService } from '../../services/userService';
import VerificationModal from '../dashboard/VerificationModal';
import { TelebirrLogo, CBELogo, BOALogo } from '../payment/PaymentLogos';

interface BookingModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  user?: UserProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ vehicle, isOpen, user: propUser, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<'dates' | 'payment' | 'success'>('dates');
  const [user, setUser] = useState<UserProfile | null>(propUser || null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe' | 'boa' | ''>('');
  const [transactionRef, setTransactionRef] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setError(null);
      setStep('dates');
      setPaymentMethod('');
      setTransactionRef('');
      if (propUser) {
        setUser(propUser);
      } else {
        fetchUserProfile();
      }
    }
  }, [isOpen, propUser]);

  const fetchUserProfile = async () => {
    const profile = await userService.getUserProfile();
    setUser(profile);
  };

  const handleVerificationSuccess = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setError(null);
  };

  if (!vehicle) return null;

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return (diffDays || 1) * vehicle.pricePerDay;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.isVerified || !user?.age) {
      setError('Your account verification is incomplete or you are missing age information. Please complete your profile verification.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('End date cannot be before start date.');
      return;
    }

    setError(null);
    setStep('payment');
  };

  const handlePayAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    if (!transactionRef) {
      setError('Please enter your transaction reference number');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Create the booking with payment details in one go to avoid multi-step failures
      await bookingService.createBooking({
        vehicleId: vehicle.id,
        startDate,
        endDate,
        totalAmount: calculateTotal(),
        payment_reference: transactionRef
      } as any);

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bankDetails = {
    telebirr: { name: 'Telebirr', account: '0911000000', owner: 'EthioRent LLC' },
    cbe: { name: 'Commercial Bank of Ethiopia', account: '1000123456789', owner: 'EthioRent LLC' },
    boa: { name: 'Bank of Abyssinia', account: '87654321', owner: 'EthioRent LLC' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key={`booking-modal-overlay-outer-${vehicle.id}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto scroll-smooth">
          <motion.div
            key={`booking-modal-backdrop-${vehicle.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            key={`booking-modal-container-${vehicle.id}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-dark-2 rounded-[14px] overflow-y-auto max-h-[90vh] md:max-h-[85vh] shadow-2xl border border-gold/15 custom-scrollbar scroll-smooth"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gold/15 bg-dark-3 sticky top-0 z-20 backdrop-blur-md bg-dark-3/95">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tight text-white mb-2 leading-none">Complete Your Booking</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Booking Reference: #{String(vehicle.id).padStart(4, '0')}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full text-muted transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-dark-2 border border-gold/20 rounded-xl">
                <div className="w-16 h-16 bg-dark-3 rounded-lg border border-white/5 flex items-center justify-center overflow-hidden">
                  {vehicle.images[0] ? (
                    <img 
                      key={`booking-v-img-${vehicle.id}`}
                      src={vehicle.images[0]} 
                      className="w-full h-full object-cover"
                      alt={vehicle.name}
                    />
                  ) : (
                    <Car key="booking-v-icon" className="w-8 h-8 text-muted/20" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white leading-none mb-1">{vehicle.name}</h4>
                  <p className="text-[10px] font-bold text-gold uppercase tracking-wider">{vehicle.category}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted mt-1.5 font-medium">
                    <MapPin className="w-3 h-3 text-gold/60" />
                    {vehicle.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8" key="booking-content-container">
              {step === 'success' ? (
                <div key="step-success" className="py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Booking Submitted!</h3>
                  <p className="text-muted font-medium">Your request has been submitted successfully. The car owner will respond soon.</p>
                </div>
              ) : step === 'payment' ? (
                <form key="step-payment" onSubmit={handlePayAndBook} className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                     <button 
                       type="button"
                       onClick={() => setStep('dates')}
                       className="text-[10px] font-bold text-muted hover:text-gold uppercase tracking-widest flex items-center gap-1 transition-colors"
                     >
                       ← Back to dates
                     </button>
                  </div>

                  <div className="bg-dark-3 p-6 rounded-2xl border border-gold/15">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Payment Method</span>
                      <CreditCard className="w-4 h-4 text-gold/40" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-8">
                      {(['telebirr', 'cbe', 'boa'] as const).map((method) => {
                        const isSelected = paymentMethod === method;
                        return (
                          <motion.button
                            key={`booking-pay-method-${method}`}
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod(method)}
                            className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                              isSelected 
                                ? 'border-gold bg-gold/5 shadow-[0_0_20px_rgba(201,146,42,0.1)]' 
                                : 'border-white/5 bg-dark-2 hover:border-gold/30'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-all duration-500 shadow-lg ${
                                isSelected ? 'scale-115 ring-2 ring-gold/40' : 'opacity-85'
                              } ${
                                method === 'telebirr' ? 'bg-[#0B1528] border-blue-500/20' :
                                method === 'cbe' ? 'bg-[#1A0F00] border-orange-500/20' :
                                'bg-[#151208] border-amber-500/20'
                              }`}>
                                {method === 'telebirr' ? (
                                  <TelebirrLogo className="w-10 h-10 object-contain" />
                                ) : method === 'cbe' ? (
                                  <CBELogo className="w-9 h-9 object-contain" />
                                ) : (
                                  <BOALogo className="w-8 h-8 object-contain" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className={`text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-muted'}`}>
                                  {bankDetails[method].name}
                                </p>
                              </div>
                            </div>
                            
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-gold border-gold' : 'border-white/10'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-dark" />}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMethod && (
                        <motion.div 
                          key={`booking-payment-details-${paymentMethod}`}
                          initial={{ opacity: 0, y: 10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="bg-dark-2 p-5 rounded-xl border border-gold/20 space-y-4 mb-8 overflow-hidden"
                        >
                           <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Instructions</h4>
                             <div className="px-2 py-0.5 bg-gold/10 text-[9px] font-bold text-gold border border-gold/20 rounded uppercase">Verified</div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1 text-xs">
                               <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Account Holder</p>
                               <p className="font-bold text-white">{vehicle.ownerName || bankDetails[paymentMethod].owner}</p>
                             </div>
                             <div className="space-y-1 text-right text-xs">
                               <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Bank / Wallet</p>
                               <p className="font-bold text-gold">{bankDetails[paymentMethod].name}</p>
                             </div>
                           </div>

                           <div className="p-4 bg-dark-3 rounded-lg border border-white/5 flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                             <div className="space-y-0.5">
                               <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Account Number</p>
                               <p className="text-lg font-mono font-black text-white tracking-widest">{bankDetails[paymentMethod].account}</p>
                             </div>
                             <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark transition-colors">
                               <CreditCard className="w-4 h-4" />
                             </div>
                           </div>

                           <p className="text-[10px] text-muted text-center font-medium leading-relaxed">
                            Transfer exactly <span className="text-gold font-bold underline underline-offset-2">ETB {calculateTotal().toLocaleString()}</span> to the account above and enter the reference number below.
                           </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Transaction Reference</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. REF-12345678"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value)}
                        className="w-full px-5 py-4 bg-dark-2 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  {error && (
                    <div key="booking-error-display" className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total to Pay</span>
                    <span className="text-3xl font-display font-black tracking-tight text-white">ETB {calculateTotal().toLocaleString()}</span>
                  </div>

                  <button
                    disabled={loading || !paymentMethod || !transactionRef}
                    type="submit"
                    className="btn-primary w-full py-4 text-sm uppercase tracking-widest"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : 'Confirm Payment'}
                  </button>
                </form>
              ) : (
                <form key="step-dates" onSubmit={handleProceedToPayment} className="space-y-6">
                  {user && user.role !== 'customer' && (
                    <div key="booking-role-error" className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Role Restricted
                      </div>
                      <p className="text-[11px] font-medium opacity-70">Only Customer accounts can book vehicles. Please log in with a customer account.</p>
                    </div>
                  )}

                  {user && user.role === 'customer' && (!user.isVerified || !user.age) && (
                    <div key="booking-verify-warning" className="p-4 bg-gold/5 border border-gold/20 text-gold rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        Verification Required
                      </div>
                      <p className="text-[11px] font-medium opacity-70">You must be fully verified and 21+ to book a rental. Please complete verification in your dashboard.</p>
                      <button
                        type="button"
                        onClick={() => setIsVerificationModalOpen(true)}
                        className="mt-2 py-2 bg-gold text-dark rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Verify Now
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Pick-up Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                        <input 
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-12 pr-4 py-3 bg-dark-3 text-white border border-white/5 focus:border-gold rounded-lg font-mono text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Return Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                        <input 
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || new Date().toISOString().split('T')[0]}
                          className="w-full pl-12 pr-4 py-3 bg-dark-3 text-white border border-white/5 focus:border-gold rounded-lg font-mono text-xs outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-3 p-6 rounded-2xl border border-gold/15">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Daily Rate</span>
                      </div>
                      <span className="text-sm font-bold text-white">ETB {vehicle.pricePerDay.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Estimate Total</p>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-display font-black tracking-tight text-white">
                            ETB {calculateTotal().toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted font-bold uppercase tracking-widest text-right leading-relaxed italic opacity-60">
                        Secure<br/>Transaction
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={loading || (user?.role !== 'customer' && !!user)}
                    type="submit"
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Proceed to Payment →
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {user && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          user={user}
          targetOwnerId={vehicle.ownerId}
          onClose={() => setIsVerificationModalOpen(false)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </AnimatePresence>
  );
}
