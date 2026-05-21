import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, Fuel, Gauge, Star, ChevronLeft, ChevronRight, MessageSquare, ChevronDown, ChevronUp, Eye, Car } from 'lucide-react';
import { Vehicle } from '../../types';
import ReviewSection from './ReviewSection';
import VehicleDetailsModal from './VehicleDetailsModal';

interface VehicleCardProps {
  vehicle: Vehicle;
  onBook: (vehicle: Vehicle) => void;
  key?: any;
}

export default function VehicleCard({ vehicle, onBook }: VehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviews, setShowReviews] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];

  const nextImage = (e: React.MouseEvent) => {
    if (images.length === 0) return;
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    if (images.length === 0) return;
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
        className="card-premium group flex flex-col h-full"
      >
        <div 
          onClick={() => setIsDetailsOpen(true)}
          className="relative h-56 overflow-hidden cursor-pointer flex items-center justify-center bg-dark-3"
        >
          {images.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img 
                key={`vehicle-card-img-${vehicle.id}-${currentImageIndex}`}
                src={images[currentImageIndex]} 
                alt={`${vehicle.name} - ${currentImageIndex + 1}`} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted/20">
              <Car className="w-16 h-16" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No photo yet</p>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-dark/50 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-dark/50 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div 
          onClick={() => setIsDetailsOpen(true)}
          className="mb-4 cursor-pointer"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold mb-2">
            {vehicle.category}
          </p>
          <h3 className="text-xl font-bold text-white tracking-tight mb-2 line-clamp-1 group-hover:text-gold transition-colors">
            {vehicle.name}
          </h3>
          <p className="text-[13px] text-muted leading-relaxed line-clamp-2 mb-4">
            {vehicle.description}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <MapPin className="w-3.5 h-3.5 text-gold/60" />
              <span>{vehicle.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Fuel className="w-3.5 h-3.5 text-gold/60" />
              <span>{vehicle.fuelType || 'Petrol'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Users className="w-3.5 h-3.5 text-gold/60" />
              <span>{vehicle.seats || 5} seats</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Gauge className="w-3.5 h-3.5 text-gold/60" />
              <span>{vehicle.transmission || 'Auto'}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gold">
              ETB {vehicle.pricePerDay.toLocaleString()} <span className="text-[10px] text-muted font-normal">/ day</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${vehicle.availabilityStatus === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${vehicle.availabilityStatus === 'available' ? 'text-green-500/60' : 'text-red-400/60'}`}>
                {vehicle.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => onBook(vehicle)}
            className="btn-book"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>

    <VehicleDetailsModal 
      vehicle={vehicle}
      isOpen={isDetailsOpen}
      onClose={() => setIsDetailsOpen(false)}
      onBook={onBook}
    />
  </>
);
}
