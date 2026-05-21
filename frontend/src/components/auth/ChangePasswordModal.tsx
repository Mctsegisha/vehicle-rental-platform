import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Eye, EyeOff, Check, CheckCircle2, XCircle } from 'lucide-react';
import { userService } from '../../services/userService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation checks helper
  const isMinLength = formData.newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.newPassword);
  const hasLower = /[a-z]/.test(formData.newPassword);
  const hasNumber = /\d/.test(formData.newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(formData.newPassword);
  const passwordsMatch = formData.newPassword && formData.newPassword === formData.confirmPassword;

  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Current password is required.');
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError('New password does not meet requirements.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('New password and confirmation do not match.');
      setLoading(false);
      return;
    }

    try {
      await userService.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Your password has been changed successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto scroll-smooth">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative my-auto bg-dark-2 w-full max-w-md rounded-2xl shadow-2xl border border-gold/15 overflow-y-auto max-h-[90vh] flex flex-col custom-scrollbar scroll-smooth z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-dark-3/50 sticky top-0 z-20 backdrop-blur">
              <div>
                <h3 className="text-xl font-display font-black text-white leading-none uppercase tracking-tight">Change Password</h3>
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1.5 leading-relaxed">Securely update your digital credentials.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted hover:text-gold hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted tracking-widest">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input
                    required
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="w-full pl-12 pr-12 py-3.5 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 text-sm font-medium transition-all"
                    value={formData.currentPassword}
                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors p-1"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted tracking-widest">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input
                    required
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-12 py-3.5 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 text-sm font-medium transition-all"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors p-1"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted tracking-widest">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input
                    required
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    className="w-full pl-12 pr-12 py-3.5 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 text-sm font-medium transition-all"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors p-1"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Real-time Checklist Feedback */}
              {formData.newPassword.length > 0 && (
                <div className="p-4 bg-dark-3 rounded-lg border border-white/5 space-y-2 animate-in fade-in duration-300">
                  <p className="text-[10px] font-black uppercase text-gold hover:text-gold/80 tracking-widest mb-1 shadow-sm flex items-center gap-1.5">
                    🛡️ New Password Criteria
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted font-medium">
                    <div className="flex items-center gap-1.5">
                      {isMinLength ? <Check className="w-3.5 h-3.5 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted/40 ml-1" />}
                      <span className={isMinLength ? 'text-white/80' : ''}>Min 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasUpper ? <Check className="w-3.5 h-3.5 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted/40 ml-1" />}
                      <span className={hasUpper ? 'text-white/80' : ''}>1 Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasLower ? <Check className="w-3.5 h-3.5 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted/40 ml-1" />}
                      <span className={hasLower ? 'text-white/80' : ''}>1 Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasNumber ? <Check className="w-3.5 h-3.5 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted/40 ml-1" />}
                      <span className={hasNumber ? 'text-white/80' : ''}>1 Number</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {hasSpecial ? <Check className="w-3.5 h-3.5 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted/40 ml-1" />}
                      <span className={hasSpecial ? 'text-white/80' : ''}>1 Special character (!@#$% etc.)</span>
                    </div>
                    {formData.confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2 mt-1 border-t border-white/5 pt-1">
                        {passwordsMatch ? <Check className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        <span className={passwordsMatch ? 'text-white/80' : 'text-red-400'}>Passwords Match</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center leading-relaxed">
                  {error}
                </p>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center flex flex-col items-center gap-2 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <p className="text-green-400 text-[11px] font-bold uppercase tracking-widest">{success}</p>
                </div>
              )}

              <button
                disabled={loading || !isPasswordValid || !passwordsMatch || !formData.currentPassword}
                className="btn-primary w-full py-4 text-sm uppercase tracking-widest font-black disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-4"
              >
                {loading ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
