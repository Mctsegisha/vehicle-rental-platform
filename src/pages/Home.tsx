import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar, ArrowRight, Shield, Clock, ThumbsUp, Sparkles, Car,
  ShieldCheck, Crown, Zap, BatteryCharging, Infinity, Truck, Globe, 
  Smile, Mountain, Wind, Users, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, UserProfile } from '../types';
import VehicleCard from '../components/vehicles/VehicleCard';

const BRANDS = [
  { name: "TOYOTA", icon: ShieldCheck },
  { name: "MERCEDES", icon: Crown },
  { name: "BMW", icon: Zap },
  { name: "TESLA", icon: BatteryCharging },
  { name: "AUDI", icon: Infinity },
  { name: "FORD", icon: Truck },
  { name: "NISSAN", icon: Globe },
  { name: "HYUNDAI", icon: Smile },
  { name: "LAND ROVER", icon: Mountain },
  { name: "SUZUKI", icon: Wind },
  { name: "VW", icon: Users },
  { name: "KIA", icon: Sparkles }
];

interface HomeProps {
  user: UserProfile | null;
  onAuthClick: () => void;
}

export default function Home({ user, onAuthClick }: HomeProps) {
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const navigate = useNavigate();

  const handleListCarClick = () => {
    if (!user || user.role !== 'owner') {
      setShowAccessDeniedModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await vehicleService.getAllVehicles('available', 'all', undefined, undefined, 3);
        setFeaturedVehicles(data);
      } catch (err) {
        console.error('Failed to fetch featured vehicles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleBook = (vehicle: Vehicle) => {
    if (!user) {
      onAuthClick();
      return;
    }

    if (user.role !== 'customer') {
      alert('Only Customer accounts can book vehicles. Please log in with a customer account.');
      return;
    }

    navigate('/vehicles');
  };

  return (
    <div className="bg-dark space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(201,146,42,0.08)_0%,transparent_70%)] opacity-80"></div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C9922A 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="section-tag">✦ Premium Vehicle Rentals</div>
              <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-[1.1] mb-8 tracking-tight">
                Drive Your <br />
                <span className="text-gold italic font-normal">Perfect Ride</span> <br />
                Today
              </h1>
              <p className="text-lg text-muted max-w-lg mb-10 leading-relaxed font-medium">
                Discover a wide range of quality vehicles — from passenger cars to industrial equipment. Book instantly, drive confidently.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/vehicles')}
                  className="btn-primary"
                >
                  Browse Vehicles
                </button>
                <button 
                  onClick={handleListCarClick}
                  className="btn-ghost"
                >
                  List Your Car
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="aspect-[16/10] bg-dark-3 rounded-[14px] border border-gold/15 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 to-transparent"></div>
                <Car className="w-32 h-32 text-gold opacity-10 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-dark-2/90 backdrop-blur-md border border-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-0.5">Featured Model</p>
                    <p className="text-sm font-bold text-white">Toyota Land Cruiser V8</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-0.5">Starting at</p>
                    <p className="text-sm font-bold text-gold">ETB 2,500/day</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold/5 blur-3xl rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gold/5 blur-3xl rounded-full"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-dark-2 border-y border-gold/15 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Vehicles Available", value: "50+" },
              { label: "Vehicle Categories", value: "6" },
              { label: "Secure Payments", value: "100%" },
              { label: "Customer Support", value: "24/7" }
            ].map((stat, i) => (
              <div key={`home-stat-${i}-${stat.label.replace(/\s+/g, '-').toLowerCase()}`} className="text-center group">
                <div className="font-display text-4xl font-bold text-gold mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="section-tag">How It Works</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Rent a Vehicle in 4 Easy Steps</h2>
          <p className="text-muted max-w-2xl mx-auto">Simple, secure, and straightforward — get on the road in no time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              step: "01", 
              title: "Search & Browse", 
              desc: "Filter by category, location, price range, and availability to find your ideal vehicle." 
            },
            { 
              step: "02", 
              title: "Submit a Booking", 
              desc: "Select your rental dates and send a booking request to the vehicle owner." 
            },
            { 
              step: "03", 
              title: "Get Approved", 
              desc: "The vehicle owner reviews your request and approves or declines based on availability." 
            },
            { 
              step: "04", 
              title: "Pay & Drive", 
              desc: "Complete your payment securely through the platform and you're ready to go!" 
            }
          ].map((item, i) => (
            <motion.div 
              key={`how-it-works-step-${item.step}-${i}`}
              whileHover={{ y: -5 }}
              className="bg-dark-2 p-8 rounded-[14px] border border-gold/15"
            >
              <div className="font-display text-5xl font-black text-gold/10 mb-6">{item.step}</div>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-16">
          <div>
            <div className="section-tag">Featured Vehicles</div>
            <h2 className="text-4xl font-bold tracking-tight">Top Listings Right Now</h2>
          </div>
          <Link 
            to="/vehicles" 
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-gold hover:underline"
          >
            Explore Full Fleet <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={`featured-skeleton-${i}`} className="aspect-[4/5] bg-dark-2 rounded-[14px] animate-pulse border border-gold/15" />
            ))}
          </div>
        ) : featuredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredVehicles.map((vehicle, index) => (
              <VehicleCard 
                key={`featured-vehicle-${vehicle.id}-${index}`} 
                vehicle={vehicle} 
                onBook={handleBook} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-dark-2 rounded-[14px] border-2 border-gold/10 border-dashed p-20 text-center">
            <Sparkles className="w-12 h-12 text-gold/10 mx-auto mb-6" />
            <p className="text-sm font-medium text-muted uppercase tracking-widest">
              Vehicle information being updated...
            </p>
          </div>
        )}
        
        <div className="mt-16 text-center lg:hidden">
          <Link 
            to="/vehicles" 
            className="inline-flex items-center gap-2 btn-primary"
          >
            View All Vehicles
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-dark-2 border border-gold/15 p-12 md:p-20 rounded-[14px] flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gold/5 blur-3xl rounded-full"></div>
          
          <div className="flex-grow z-10 text-center lg:text-left">
            <div className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-4">Earn Money</div>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-8 leading-tight">
              List Your <br className="hidden md:block"/> Vehicle Today.
            </h2>
            <button 
              onClick={handleListCarClick}
              className="btn-primary"
            >
              List Your Car
            </button>
          </div>
          
          <div className="lg:w-1/3 z-10">
            <div className="p-8 bg-dark-3 rounded-xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-white font-bold">Trusted Network</p>
                   <p className="text-xs text-muted font-medium">Join 200+ verified owners</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed font-medium">
                Our platform manages detailed vehicle information with a secure booking process. Get notified for every request and manage your rentals with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 border-t border-gold/15 py-12 text-center text-muted">
        <p className="text-sm font-medium">
          © 2026 <span className="text-gold font-bold">DriveFleet</span> · Built for Addis Ababa University School of Commerce · All rights reserved.
        </p>
      </footer>

      {/* Access Denied Modal for Non-Providers / Guests */}
      <AnimatePresence>
        {showAccessDeniedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccessDeniedModal(false)}
              className="fixed inset-0 bg-dark/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-dark-2 max-w-md w-full border border-gold/20 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6"
            >
              {/* Warning/Security Indicator */}
              <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto text-gold">
                <Car className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Provider Access Required</h3>
                <div className="text-xs text-muted/80 uppercase tracking-widest font-bold">List Cars Feature</div>
              </div>
              
              <div className="space-y-4 text-sm text-muted font-medium leading-relaxed">
                <p>
                  Only registered car providers can list vehicles on the platform.
                </p>
                <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-gold text-xs font-bold font-mono">
                  “Please sign up or switch to a provider account to continue.”
                </div>
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                {!user ? (
                  <button
                    onClick={() => {
                      setShowAccessDeniedModal(false);
                      onAuthClick();
                    }}
                    className="w-full py-4 bg-gold text-dark font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/10"
                  >
                    Log In / Register Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowAccessDeniedModal(false);
                      localStorage.removeItem('token');
                      window.location.reload();
                    }}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Switch Account (Sign Out)
                  </button>
                )}
                
                <button
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="w-full py-4 bg-white/5 text-muted hover:text-white border border-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
