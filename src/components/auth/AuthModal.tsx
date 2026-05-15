import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, Briefcase } from 'lucide-react';
import { userService } from '../../services/userService';
import { UserProfile, UserRole } from '../../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'customer' as UserRole
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { user } = await userService.login(formData.email, formData.password);
        onSuccess(user);
      } else {
        const { user } = await userService.register(formData);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-dark-2 w-full max-w-md rounded-[14px] shadow-2xl overflow-y-auto max-h-[90vh] border border-gold/15"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted hover:text-gold hover:bg-white/5 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-display font-black text-white mb-2 leading-none uppercase tracking-tight">
              {isLogin ? 'Welcome Back.' : 'Start Your Journey.'}
            </h2>
            <p className="text-muted font-bold text-[10px] mt-4 uppercase tracking-[0.2em] leading-relaxed">
              {isLogin ? 'Sign in to access your dashboard.' : 'Join the premier vehicle network in Ethiopia.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 bg-dark-3 border border-white/5 rounded-lg focus:border-gold outline-none text-white placeholder:text-muted/20 font-medium text-sm transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">{error}</p>
            )}

            <button 
              disabled={loading}
              className="btn-primary w-full py-4 text-sm uppercase tracking-widest mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                  Loading...
                </div>
              ) : (
                isLogin ? 'Log In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-muted font-bold text-[10px] uppercase tracking-widest">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold hover:underline underline-offset-4 decoration-gold/30"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
