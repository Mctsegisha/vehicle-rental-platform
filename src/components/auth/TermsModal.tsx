import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
                  <h3 className="text-white font-display font-black uppercase tracking-tight leading-none">Vehicle Rental</h3>
                  <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Terms & Conditions</p>
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
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">1. Driver Eligibility</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    To rent a vehicle, you must be at least 21 years old and possess a valid, government-issued driver's license. Your account must be verified through our platform, which requires uploading a clear photo of your ID and driver's license.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">2. Booking and Payment</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    All bookings must be made through the platform. Payment is required in full to confirm your reservation. We accept major credit cards and integrated digital payment methods. Security deposits may be required depending on the vehicle category.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">3. Vehicle Usage Rules</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Vehicles are intended for lawful use only. Smoking, pets (unless explicitly allowed), and off-road driving are strictly prohibited. The vehicle must not be used for racing, towing, or commercial transport of hazardous materials.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">4. Fuel Policy</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Vehicles are typically provided with a full tank of fuel. You are expected to return the vehicle with the same level of fuel. If returned with less fuel, a refueling fee plus the cost of fuel will be charged.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">5. Inspection Procedures</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    A thorough inspection of the vehicle will be conducted at the time of pick-up and return. Both the renter and the provider should document any existing damage. We strongly recommend taking photos of the vehicle from all angles during these inspections.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">6. Damage and Liability</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    You are responsible for any damage to the vehicle during the rental period that exceeds normal wear and tear. In the event of an accident, you must notify the provider and the platform immediately and file a police report if necessary.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">7. Late Return Penalties</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Late returns disadvantage other users. A grace period of 30 minutes is provided. Extensions must be requested and approved through the platform. Unauthorized late returns will incur hourly penalties at 1.5x the standard rate.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">8. Insurance and Safety</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Vehicles provided on the platform are covered by basic insurance. renters are encouraged to maintain their own personal liability coverage. Safety equipment provided (spare tires, jacks) must be maintained and used correctly.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">9. Cancellation Policy</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    Full refunds are available for cancellations made at least 48 hours prior to start time. Cancellations between 24-48 hours receive a 50% refund. No refunds are provided for cancellations within 24 hours or "no-shows".
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">10. Verification Process</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    The platform reserves the right to deny service based on identity verification results, driving history, or previous platform violations. Profile verification is a manual process that can take up to 24 hours.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">11. Platform Responsibilities</h4>
                  <p className="text-muted leading-relaxed font-medium">
                    The platform acts as an intermediary facilitating the connection between vehicle providers and renters. While we strive to ensure quality and safety, we are not liable for individual user conduct or unforeseen mechanical failures.
                  </p>
                </section>

                <section>
                  <h4 className="text-gold text-xs font-black uppercase tracking-widest mb-3">12. User Agreement</h4>
                  <p className="text-muted leading-relaxed font-medium pb-8 border-b border-white/5">
                    By checking the agreement box and completing your registration, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions in their entirety.
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
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
