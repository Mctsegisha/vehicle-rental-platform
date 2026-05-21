import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { useState, FormEvent } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: 'Booking Question',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', contact: '', subject: 'Booking Question', message: '' });
    }, 1500);
  };

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left Column: Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div>
              <span className="inline-block px-4 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                Get in Touch
              </span>
              <h1 className="text-6xl font-display font-black text-white mb-6 tracking-tight">
                Contact Us
              </h1>
              <p className="text-muted text-lg max-w-md leading-relaxed">
                Have a question about a vehicle, booking, or anything else? We're here to help.
              </p>
            </div>

            <div className="space-y-8">
              <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
                DriveFleet Support
              </h2>
              <p className="text-muted leading-relaxed max-w-sm">
                Our team is available to assist customers and vehicle owners with bookings, payments, and any platform-related questions.
              </p>

              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold/40 transition-all shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-muted font-medium text-sm pt-2">Addis Ababa University, School of Commerce, Addis Ababa</p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold/40 transition-all shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <p className="text-white font-bold text-sm">support@drivefleet.et</p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold/40 transition-all shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <p className="text-white font-bold text-sm">+251 911 000 000</p>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold group-hover:border-gold/40 transition-all shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-muted font-medium text-sm uppercase text-[11px] tracking-wide">Mon–Sat, 8:00 AM – 6:00 PM EAT</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-dark-1 p-6 sm:p-10 rounded-xl border border-white/5 shadow-2xl relative"
          >
            {submitted ? (
              <div className="py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/20">
                  <Send className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Message Sent</h3>
                <p className="text-muted">We have received your message. Our team will get back to you shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="btn-primary px-8"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white placeholder:text-muted/20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email or Phone</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Email or phone number"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white placeholder:text-muted/20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Subject</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white appearance-none cursor-pointer"
                  >
                    <option className="bg-dark-2">Booking Question</option>
                    <option className="bg-dark-2">Payment Issue</option>
                    <option className="bg-dark-2">Vehicle Listing</option>
                    <option className="bg-dark-2">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Describe your question or issue..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-6 py-4 bg-dark-2 border border-white/5 rounded-lg focus:border-gold/40 outline-none transition-all font-bold text-white placeholder:text-muted/20 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gold text-dark rounded-lg font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-gold/20 hover:scale-[1.02] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
