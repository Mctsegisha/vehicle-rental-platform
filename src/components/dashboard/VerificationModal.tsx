import React, { useState } from 'react';
import { X, Shield, Upload, CheckCircle2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { UserProfile } from '../../types';

interface VerificationModalProps {
  user: UserProfile;
  isOpen: boolean;
  targetOwnerId?: number;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

export default function VerificationModal({ user, isOpen, targetOwnerId, onClose, onSuccess }: VerificationModalProps) {
  const [formData, setFormData] = useState({
    age: user.age || '',
    driverLicenseNumber: user.driverLicenseNumber || '',
    idPhotoUrl: user.idPhotoUrl || '',
    licensePhotoUrl: user.licensePhotoUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.age || parseInt(formData.age as string) < 21) {
      setError('You must be at least 21 years old to rent a vehicle.');
      return;
    }
    if (!formData.idPhotoUrl || !formData.licensePhotoUrl) {
      setError('Please upload both identification and driver\'s license photos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await userService.updateProfileVerification({
        age: parseInt(formData.age as string),
        driverLicenseNumber: formData.driverLicenseNumber,
        idPhotoUrl: formData.idPhotoUrl,
        licensePhotoUrl: formData.licensePhotoUrl,
        targetOwnerId
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update verification info');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'idPhotoUrl' | 'licensePhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('images', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Upload failed';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          console.error('Non-JSON error:', await response.text());
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.urls && data.urls.length > 0) {
        setFormData(prev => ({ ...prev, [field]: data.urls[0] }));
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.message || 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-dark-1 w-full max-w-xl rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] border border-white/5 animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-gold text-dark rounded-lg shadow-xl shadow-gold/20">
                <Shield className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Identity Verification</h2>
               <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Upload Documents</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-lg transition-all border border-white/5 text-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          {error && (
            <div className="p-5 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-4 border border-red-500/20">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
               {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3 font-mono">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your Age</label>
              <input
                type="number"
                required
                min="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white placeholder:text-muted/20"
                placeholder="21+"
              />
            </div>
            <div className="space-y-3 font-mono">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">License Number</label>
              <input
                type="text"
                required
                value={formData.driverLicenseNumber}
                onChange={(e) => setFormData({ ...formData, driverLicenseNumber: e.target.value })}
                className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white placeholder:text-muted/20"
                placeholder="DL-XXXXXX"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center justify-between">
                ID Card / Passport
                {formData.idPhotoUrl && <span className="text-green-400 text-[9px] flex items-center gap-2 font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'idPhotoUrl')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`p-10 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-4 ${
                  formData.idPhotoUrl ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-dark-2 group-hover:bg-dark-3 group-hover:border-gold/20'
                }`}>
                  <Upload className={`w-8 h-8 ${formData.idPhotoUrl ? 'text-green-500' : 'text-muted/20'}`} />
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] group-hover:text-gold transition-colors">
                    {formData.idPhotoUrl ? 'Change ID Photo' : 'Upload ID Photo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center justify-between">
                Driver's License
                {formData.licensePhotoUrl && <span className="text-green-400 text-[9px] flex items-center gap-2 font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'licensePhotoUrl')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`p-10 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-4 ${
                  formData.licensePhotoUrl ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-dark-2 group-hover:bg-dark-3 group-hover:border-gold/20'
                }`}>
                  <Upload className={`w-8 h-8 ${formData.licensePhotoUrl ? 'text-green-500' : 'text-muted/20'}`} />
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] group-hover:text-gold transition-colors">
                    {formData.licensePhotoUrl ? 'Change License Photo' : 'Upload License'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-gold text-dark rounded-lg font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-gold/20 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-4">
                 <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                 Verifying...
              </div>
            ) : 'Submit Verification'}
          </button>

          <p className="text-center text-[9px] font-black text-muted uppercase tracking-[0.3em] font-mono opacity-40">
            Secure Identity Verification active
          </p>
        </form>
      </div>
    </div>
  );
}
