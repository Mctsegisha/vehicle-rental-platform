import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

interface ProviderTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderTermsModal({ isOpen, onClose }: ProviderTermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-dark-2 w-full max-w-2xl rounded-2xl shadow-2xl border border-gold/20 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-3/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-display font-black uppercase tracking-tight leading-none">Vehicle Provider</h3>
                  <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Platform Terms & Conditions</p>
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
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">1. Ownership and Listing</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    You must be the legal owner or authorized representative of the vehicles you list on the platform. All vehicles must have a clear title and be registered legally in your jurisdiction.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">2. Accurate Information</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Providers are responsible for providing truthful, accurate, and up-to-date information regarding the vehicle's make, model, year, condition, and availability. Misrepresentation of a vehicle may lead to immediate suspension.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">3. Inspection and Approval</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Before a listing becomes active, it must pass the platform's approval process. This may include digital inspection of photos and verification of documentation. The platform reserves the right to reject any vehicle for any reason.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">4. Insurance and Legal Compliance</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Providers must maintain standard automotive insurance as required by law. While the platform provides supplementary coverage during rental periods, you are responsible for ensuring your primary insurance allows for peer-to-peer sharing or commercial use.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">5. Maintenance and Safety</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    You are solely responsible for keeping your vehicle in a safe, roadworthy condition. Regular maintenance (oil changes, brake checks, tire pressure) must be performed. Any safety recalls must be addressed before the vehicle can be rented.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">6. Pricing and Availability</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Providers have the right to set their own daily rates and manage availability through the platform's calendar. However, once a booking is confirmed, you are expected to honor it unless an emergency arises. Frequent cancellations may result in penalties.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">7. Active Rental Responsibilities</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    During a rental, you must be accessible to the renter for emergencies or questions. You must facilitate the hand-off and return process as agreed upon through the platform's messaging system.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">8. Payment and Commission</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    The platform charges a commission on each successful rental to cover operational costs, insurance, and marketing. Payments are processed after the completion of a rental and verification that no disputes exist.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">9. Dispute Resolution</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    In the event of a dispute with a renter regarding damage, fuel, or cleanlines, the platform will act as an arbitrator. Providers must provide documented evidence (photos, inspection reports) to support their claims.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">10. Suspension Rights</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    The platform reserves the right to suspend or remove any listing or Provider account for violations of safety standards, poor user ratings, or breach of these terms.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">11. Legal Agreement</h4>
                  <p className="text-muted leading-relaxed font-medium pb-8 border-b border-white/5">
                    By listing your vehicle on this platform, you agree to comply with all local laws and regulations regarding vehicle sharing and commercial activity.
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
                Accept & Proceed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
