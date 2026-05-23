import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Filter, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, UserProfile } from '../types';
import VehicleCard from '../components/vehicles/VehicleCard';
import BookingModal from '../components/vehicles/BookingModal';

interface VehiclesProps {
  user: UserProfile | null;
  onAuthClick: () => void;
}

export default function Vehicles({ user, onAuthClick }: VehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('available');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  
  // Booking State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const min = minPrice ? parseFloat(minPrice) : undefined;
      const max = maxPrice ? parseFloat(maxPrice) : undefined;
      const data = await vehicleService.getAllVehicles(statusFilter, categoryFilter, min, max);
      setVehicles(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const cats = await vehicleService.getCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, categoryFilter, minPrice, maxPrice]);

  const handleBook = (vehicle: Vehicle) => {
    if (!user) {
      onAuthClick();
      return;
    }
    
    // Only customers should be able to book
    if (user.role !== 'customer') {
      alert('Only Customer accounts can book vehicles. Please log in with a customer account.');
      return;
    }

    setSelectedVehicle(vehicle);
    setIsBookingModalOpen(true);
  };

  const filteredVehicles = useMemo(() => {
    if (!locationSearch) return vehicles;
    const query = locationSearch.toLowerCase();
    return vehicles.filter(v => 
      v.location.toLowerCase().includes(query)
    );
  }, [vehicles, locationSearch]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
           <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gold text-dark rounded-full font-bold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <div className="section-tag mb-4">Marketplace</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Available Vehicles</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Showing {filteredVehicles.length} results
          </div>
        </div>

        {/* Dark Filter Bar */}
        <div className="bg-dark-2 p-6 sm:p-8 rounded-[14px] border border-gold/15 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">Location Search</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-gold transition-colors" />
                <input 
                  type="text" 
                  placeholder="e.g. Addis Ababa"
                  className="w-full pl-11 pr-4 py-3.5 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/40 text-sm font-medium"
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-5 py-3.5 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm font-medium"
              >
                <option value="all">All Categories</option>
                {[...new Set<string>(categories || [])].filter(c => c && typeof c === 'string' && c.toLowerCase() !== 'all').map((cat, i) => (
                  <option key={`cat-opt-${cat}-${i}`} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">Min Price (ETB)</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full px-5 py-3.5 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/40 text-sm font-medium"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">Max Price (ETB)</label>
              <input 
                type="number" 
                placeholder="5000"
                className="w-full px-5 py-3.5 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/40 text-sm font-medium"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest ml-1">Availability</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3.5 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm font-medium"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={`vehicles-skeleton-${i}`} className="bg-dark-2 rounded-[14px] h-[500px] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle: Vehicle, idx) => (
              <div key={`vehicle-grid-item-${vehicle.id}-${idx}`}>
                <VehicleCard 
                  vehicle={vehicle} 
                  onBook={handleBook} 
                />
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-dark-2 rounded-[14px] p-24 text-center border border-white/5"
          >
            <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gold/30">
               <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">No Vehicles Found</h2>
            <p className="text-muted mb-8 max-w-sm mx-auto font-medium">
              Try adjusting your search or check back later for new listings.
            </p>
            <button 
              onClick={() => {
                setLocationSearch('');
                setMinPrice('');
                setMaxPrice('');
                setCategoryFilter('all');
              }}
              className="px-8 py-3 bg-gold text-dark rounded-full font-bold hover:scale-105 transition-all"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen}
        vehicle={selectedVehicle}
        user={user}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}
