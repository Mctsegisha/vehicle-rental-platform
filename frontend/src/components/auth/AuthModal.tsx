import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, Briefcase, CheckCircle2, Eye, EyeOff, Check, XCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { UserProfile, UserRole } from '../../types';
import TermsModal from './TermsModal';
import TermsModalProvider from './TermsModalProvider';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showProviderTerms, setShowProviderTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'customer' as UserRole
  });

  // Password validation checks helper
  const isMinLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(formData.password);
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  // Reset states on change mode
  useEffect(() => {
    setAcceptedTerms(false);
    setError('');
    setSuccess('');
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode, formData.role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    // 1. Client-Side Validations
    if (mode === 'signup') {
      if (!trimmedName) {
        setError('Full legal name is required.');
        setLoading(false);
        return;
      }
      if (trimmedName.length < 2) {
        setError('Name must be at least 2 characters.');
        setLoading(false);
        return;
      }
      const nameRegex = /^[A-Za-z\s'\-\.]+$/;
      if (!nameRegex.test(trimmedName)) {
        setError('Name can only contain letters, spaces, hyphens, and periods.');
        setLoading(false);
        return;
      }

      if (trimmedPhone) {
        const phoneRegex = /^(\+?[0-9\s-]{9,15})$/;
        if (!phoneRegex.test(trimmedPhone)) {
          setError('Please enter a valid phone number (9-15 digits, numbers/spaces/dashes).');
          setLoading(false);
          return;
        }
      }

      if (formData.role === 'customer' && !acceptedTerms) {
        setError('You must accept the Vehicle Rental Terms & Conditions to register.');
        setLoading(false);
        return;
      }
      if (formData.role === 'owner' && !acceptedTerms) {
        setError('You must accept the Provider Terms & Conditions to register.');
        setLoading(false);
        return;
      }
    }

    if (mode === 'signup' || mode === 'reset') {
      if (!trimmedEmail) {
        setError('Email matches to connect you.');
        setLoading(false);
        return;
      }
      // Email format Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }

      if (!isPasswordValid) {
        setError('Please make sure your password matches all requirements.');
        setLoading(false);
        return;
      }

      if (!passwordsMatch) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        const { user } = await userService.login(trimmedEmail, formData.password);
        onSuccess(user);
      } else if (mode === 'signup') {
        const { user } = await userService.register({
          name: trimmedName,
          email: trimmedEmail,
          password: formData.password,
          phone: trimmedPhone || undefined,
          role: formData.role
        });
        onSuccess(user);
      } else if (mode === 'reset') {
        // Backend Reset endpoint
        await userService.resetPassword(trimmedEmail, formData.password);
        setSuccess('Password reset successfully. You can now login.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto scroll-smooth">
      <motion.div 
        key="auth-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        key="auth-modal-container"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-dark-2 w-full max-w-md rounded-[14px] shadow-2xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] border border-gold/15 custom-scrollbar scroll-smooth"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted hover:text-gold hover:bg-white/5 rounded-full transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10">
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className="text-3xl font-display font-black text-white mb-2 leading-none uppercase tracking-tight">
              {mode === 'login' ? 'Welcome Back.' : mode === 'signup' ? 'Start Your Journey.' : 'Reset Password.'}
            </h2>
            <p className="text-muted font-bold text-[10px] mt-4 uppercase tracking-[0.2em] leading-relaxed">
              {mode === 'login' ? 'Sign in to access your dashboard.' : mode === 'signup' ? 'Join the premier vehicle network in Ethiopia.' : 'Securely reload and verify your security parameters.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input 
                    required
                    type="text" 
                    placeholder="Full Legal Name" 
                    className="w-full pl-12 pr-4 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                    <input 
                      type="tel" 
                      placeholder="Contact Number (Optional)" 
                      className="w-full pl-12 pr-4 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white font-medium text-sm appearance-none cursor-pointer transition-all uppercase tracking-widest text-[10px]"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value="customer">I want to rent a vehicle (Guest)</option>
                    <option value="owner">I want to host my vehicle (Provider)</option>
                  </select>
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
              <input 
                required
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
              <input 
                required
                type={showPassword ? 'text' : 'password'} 
                placeholder={mode === 'reset' ? 'New Password' : 'Password'} 
                className="w-full pl-12 pr-12 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password Field (Only for signup & reset mode) */}
            {(mode === 'signup' || mode === 'reset') && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                <input 
                  required
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm Password" 
                  className="w-full pl-12 pr-12 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors p-1"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Password validation indicators (Real-time Feedback Checklist) */}
            {(mode === 'signup' || mode === 'reset') && formData.password.length > 0 && (
              <div className="p-4 bg-dark-3 rounded-lg border border-white/5 space-y-2 animate-in fade-in duration-300">
                <p className="text-[10px] font-black uppercase text-gold/80 tracking-widest mb-1.5 flex items-center gap-1.5">
                  🛡️ Password Requirements
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-medium text-muted">
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

            {mode === 'signup' && (
              <div className="pt-2 px-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-white/10 rounded group-hover:border-gold/50 peer-checked:border-gold peer-checked:bg-gold transition-all" />
                    <CheckCircle2 className="absolute w-3.5 h-3.5 text-dark opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[11px] text-muted font-bold tracking-tight leading-relaxed select-none">
                    I have read and agree to the{' '}
                    <button 
                      type="button"
                      onClick={() => formData.role === 'customer' ? setShowTerms(true) : setShowProviderTerms(true)}
                      className="text-gold hover:underline underline-offset-2"
                    >
                      {formData.role === 'customer' ? 'Vehicle Rental Terms & Conditions' : 'Provider Terms & Conditions'}
                    </button>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">{error}</p>
            )}

            {success && (
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">{success}</p>
            )}

            <button 
              disabled={loading || ((mode === 'signup' || mode === 'reset') && (!isPasswordValid || !passwordsMatch))}
              className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                  Loading...
                </div>
              ) : (
                mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Confirm New Password'
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setMode('reset')}
                className="text-gold/60 hover:text-gold font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <p className="text-center mt-8 text-muted font-bold text-[10px] uppercase tracking-widest">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button 
                  onClick={() => setMode('signup')}
                  className="text-gold hover:underline underline-offset-4 decoration-gold/30 font-extrabold"
                >
                  Sign Up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')}
                  className="text-gold hover:underline underline-offset-4 decoration-gold/30 font-extrabold"
                >
                  Log In
                </button>
              </>
            )}
            {mode === 'reset' && (
              <>
                Back to{' '}
                <button 
                  onClick={() => setMode('login')}
                  className="text-gold hover:underline underline-offset-4 decoration-gold/30 font-extrabold"
                >
                  Log In
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <TermsModalProvider isOpen={showProviderTerms} onClose={() => setShowProviderTerms(false)} />
    </div>
  );
}
