import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, CheckCircle2, AlertCircle, Clock, Copy, Check } from 'lucide-react';
import { Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import { TelebirrLogo, CBELogo, BOALogo } from '../payment/PaymentLogos';

interface PaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ booking, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe' | 'boa' | ''>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'payment' | 'success'>('payment');
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bankDetails = {
    telebirr: { name: 'Telebirr', account: '0911000000', owner: 'EthioRent LLC' },
    cbe: { name: 'Commercial Bank of Ethiopia', account: '1000123456789', owner: 'EthioRent LLC' },
    boa: { name: 'Bank of Abyssinia', account: '87654321', owner: 'EthioRent LLC' }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
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
      await bookingService.updateBookingStatus(booking.id, 'paid', transactionRef);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="payment-modal-overlay-outer" className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto scroll-smooth">
          <motion.div
            key="payment-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            key={`payment-modal-container-${booking.id}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-dark-1 rounded-xl overflow-y-auto max-h-[90vh] md:max-h-[85vh] shadow-2xl border border-white/5 custom-scrollbar scroll-smooth"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5 sticky top-0 z-20 backdrop-blur-md bg-dark-1/90 flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white uppercase mb-1">Payment</h2>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold/60">Booking Ref: #BK_{String(booking.id).padStart(4, '0')}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-muted transition-colors border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {step === 'success' ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-display font-black mb-2 text-white uppercase tracking-tight">Payment Submitted!</h3>
                  <p className="text-muted font-medium px-8 text-xs leading-relaxed uppercase tracking-wider">Your request has been submitted successfully. The car owner will respond soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-6">
                  <div className="bg-dark-2 p-5 sm:p-8 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] font-mono">Select Payment Method</span>
                      <CreditCard className="w-5 h-5 text-gold/40" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-10">
                      {(['telebirr', 'cbe', 'boa'] as const).map((method) => {
                        const isSelected = paymentMethod === method;
                        return (
                          <motion.button
                            key={`payment-modal-method-${method}`}
                            type="button"
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPaymentMethod(method)}
                            className={`relative flex items-center justify-between p-6 rounded-lg border transition-all duration-300 ${
                              isSelected 
                                ? 'border-gold bg-gold/5 shadow-2xl shadow-gold/10' 
                                : 'border-white/5 bg-dark-3 hover:border-gold/20'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden border transition-all duration-500 shadow-2xl ${
                                isSelected ? 'scale-115 rotate-3 ring-2 ring-gold/40' : 'opacity-85'
                              } ${
                                method === 'telebirr' ? 'bg-[#0B1528] border-blue-500/20 shadow-indigo-600/10' :
                                method === 'cbe' ? 'bg-[#1A0F00] border-orange-500/20 shadow-orange-600/10' :
                                'bg-[#151208] border-amber-500/20 shadow-yellow-600/10'
                              }`}>
                                {method === 'telebirr' ? (
                                  <TelebirrLogo className="w-12 h-12 object-contain" />
                                ) : method === 'cbe' ? (
                                  <CBELogo className="w-11 h-11 object-contain" />
                                ) : (
                                  <BOALogo className="w-10 h-10 object-contain" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className={`text-sm font-black tracking-tight uppercase ${isSelected ? 'text-white' : 'text-muted'}`}>
                                  {bankDetails[method].name}
                                </p>
                                <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1 opacity-60">
                                  Mobile/Bank Transfer
                                </p>
                              </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-gold border-gold scale-110' : 'border-white/10'
                            }`}>
                              {isSelected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-dark" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMethod && (
                        <motion.div 
                          key={`payment-details-info-${paymentMethod}`}
                          initial={{ opacity: 0, y: 10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="bg-black/40 backdrop-blur-md p-8 rounded-lg border border-gold/20 space-y-6 mb-10 overflow-hidden"
                        >
                           <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] font-mono">Payment Gateway</h4>
                             <div className="px-3 py-1 bg-gold/10 rounded text-[9px] font-black text-gold border border-gold/20 uppercase tracking-widest">Active</div>
                           </div>

                           <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-1">
                                 <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Beneficiary (Provider)</p>
                                 <p className="text-xs font-black text-white uppercase tracking-tight">{booking.ownerName || bankDetails[paymentMethod].owner}</p>
                               </div>
                               <div className="space-y-1 text-right">
                                 <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Institution</p>
                                 <p className="text-xs font-black text-gold uppercase tracking-tight">{bankDetails[paymentMethod].name}</p>
                               </div>
                             </div>

                             <div 
                               onClick={() => handleCopyAccount(bankDetails[paymentMethod].account)}
                               className="p-6 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between group cursor-pointer active:scale-95 transition-all hover:bg-white/10"
                             >
                               <div className="space-y-2">
                                 <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Account Number</p>
                                 <p className="text-2xl font-mono font-black text-white tracking-[0.2em]">{bankDetails[paymentMethod].account}</p>
                               </div>
                               <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark transition-all border border-gold/20 relative">
                                 {copied ? (
                                   <Check className="w-5 h-5" />
                                 ) : (
                                   <Copy className="w-4 h-4" />
                                 )}
                                 {copied && (
                                   <span className="absolute -top-8 right-0 bg-gold text-dark text-[8px] font-black px-2 py-0.5 rounded shadow uppercase tracking-wider whitespace-nowrap">Copied!</span>
                                 )}
                               </div>
                             </div>

                             <div className="bg-gold/5 p-4 rounded-lg border border-gold/10 text-center">
                               <p className="text-[10px] text-muted font-bold leading-relaxed uppercase tracking-wider">
                                 I. Open your banking app<br/>
                                 II. Transfer <span className="text-white font-black text-sm underline decoration-gold decoration-2 underline-offset-4 tracking-tighter">ETB {booking.totalAmount}</span>
                               </p>
                             </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono">Transaction Reference #</label>
                        <span className="text-[9px] font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20 uppercase tracking-widest">Required</span>
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="EX: REF-12345678"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value)}
                        className="w-full px-6 py-5 bg-dark-3 border border-white/5 rounded-lg font-mono text-sm outline-none focus:border-gold/40 text-white transition-all placeholder:text-muted/20 shadow-inner"
                      />
                      <div className="flex items-center gap-3 px-1">
                        <Clock className="w-3.5 h-3.5 text-muted/40" />
                        <p className="text-[9px] text-muted/40 font-bold uppercase tracking-tight italic">Nerve center verification active. 24/7 Monitoring Enabled.</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    disabled={loading || !paymentMethod || !transactionRef}
                    type="submit"
                    className="w-full py-6 bg-gold text-dark rounded-lg font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-gold/20 hover:scale-[1.02] transition-all disabled:opacity-20 disabled:grayscale group active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                        Submitting...
                      </div>
                    ) : 'Submit Payment'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
