import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsModalProviderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModalProvider({ isOpen, onClose }: TermsModalProviderProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto scroll-smooth">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-dark-2 w-full max-w-2xl rounded-2xl shadow-2xl border border-gold/20 overflow-y-auto max-h-[90vh] md:max-h-[85vh] flex flex-col custom-scrollbar scroll-smooth"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-3/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-display font-black uppercase tracking-tight leading-none">Provider Listing</h3>
                  <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Host Terms & Agreement</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
              <div className="space-y-8">
                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">1. Ownership & Legal Right</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    As a provider, you warrant that you are the legal owner or authorized representative of the vehicles you list on our platform. You must provide valid registration credentials, valid inspection papers, and certified commercial/personal insurance certifications.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">2. Vehicle Standards & Inspection</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Every listed vehicle must be in superb mechanical condition and fully roadworthy. Hosts must perform regular technical check-ups, maintain cleanliness protocols, and disclose any functional limitations or active dashboard warning alerts before renting to clients.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">3. Revenue Share & Platform Fees</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Joining and listing is completely free. The platform retains a standard commission fee of 10% from successful, completed booking payouts to cover background checks, transaction processing, and system maintenance.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">4. Payout Processing</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Rental fee payouts are processed on a weekly schedule. The transfer will be initiated via the verified bank account details (Commercial Bank of Ethiopia or Bank of Abyssinia) linked with your Profile dashboard.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">5. Listing Approval Workflow</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    All new vehicle listings are subject to verification and approval. Admin agents will review uploaded ownership books, license plates, and insurance declarations. Verification and approval typically complete within 12-24 hours.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">6. Host Liability & Insurance</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Hosts must ensure their listed vehicles hold active third-party insurance as required by Ethiopian transportation law. The platform is not responsible for accidents or property damage but provides assistance via security deposit locks and client checks.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">7. Cancellation & Refusals</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Hosts should refrain from cancelling approved customer bookings unnecessarily. Frequent, repetitive cancellations will affect search priority rankings and key host ratings, and may lead to temporary listing suspension.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">8. Host Code of Conduct</h4>
                  <p className="text-muted leading-relaxed font-medium pb-8 border-b border-white/5">
                    Hosts must communicate respectfully, coordinate smooth pick-up/return transfers, and inspect vehicle handovers fairly alongside clients to foster high community standards and transparent reviews.
                  </p>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-dark-3/80 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-gold text-dark font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-gold/90 transition-all shadow-[0_8px_20px_-5px_rgba(234,179,8,0.3)] active:scale-95"
              >
                Accept Host Terms
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
