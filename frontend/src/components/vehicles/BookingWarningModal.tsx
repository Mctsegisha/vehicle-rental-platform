import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, AlertCircle } from 'lucide-react';

interface BookingWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  role?: string;
}

export default function BookingWarningModal({ isOpen, onClose, message, role }: BookingWarningModalProps) {
  const displayMessage = message || (role === 'owner' 
    ? "As a Vehicle Owner, you have listed this or other vehicles for rent. To book a vehicle yourself, please use or register a Customer account."
    : "Only Customer accounts can book vehicles. Please log in or register with a customer account.");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-dark-2 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-red-500/20 text-center overflow-hidden"
          >
            {/* Ambient Red glow background effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full filter blur-[60px] pointer-events-none z-0" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 text-red-500 border border-red-500/20 shadow-inner">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="text-lg font-display font-black tracking-wider uppercase text-white mb-2">
                Booking Restricted
              </h3>
              
              <div className="px-2 py-0.5 bg-red-500/10 text-[9px] font-bold text-red-400 border border-red-500/20 rounded-md uppercase tracking-wider mb-4">
                {role ? `Active Profile: ${role}` : 'Provider Account'}
              </div>

              <p className="text-xs text-muted leading-relaxed font-semibold max-w-sm mb-6">
                {displayMessage}
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg shadow-red-500/10"
              >
                Dismiss Instructions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
