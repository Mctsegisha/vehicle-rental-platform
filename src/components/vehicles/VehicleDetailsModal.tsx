import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Star, Calendar, Shield, Clock, ChevronLeft, ChevronRight, MessageSquare, User, Phone } from 'lucide-react';
import { Vehicle } from '../../types';
import ReviewSection from './ReviewSection';

interface VehicleDetailsModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onBook: (vehicle: Vehicle) => void;
}

export default function VehicleDetailsModal({ vehicle, isOpen, onClose, onBook }: VehicleDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
  
  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key={`vehicle-details-modal-overlay-${vehicle.id}`} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key={`vehicle-details-backdrop-${vehicle.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            key={`vehicle-details-modal-container-${vehicle.id}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-dark-2 w-full max-w-6xl rounded-[14px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-gold/15"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-dark-1/50 hover:bg-dark-1 rounded-full text-white/50 hover:text-white transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Carousel Side */}
            <div className="md:w-3/5 h-[40vh] md:h-auto bg-dark-1 relative group flex items-center justify-center">
              {images.length > 0 ? (
                <div className="relative w-full h-full">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`vehicle-details-img-${vehicle.id}-${currentImageIndex}`}
                      src={images[currentImageIndex]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Pagination Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {images.map((_, i) => (
                        <button
                          key={`img-dot-${i}`}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === currentImageIndex ? 'bg-gold w-6' : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted/20">
                  <span className="font-display font-black text-6xl tracking-tight uppercase opacity-5 text-white">No Visual</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Metadata Incomplete</p>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-dark-1/40 hover:bg-dark-1/60 text-white rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-dark-1/40 hover:bg-dark-1/60 text-white rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Info Side */}
            <div className="md:w-2/5 p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-bold tracking-widest uppercase border border-gold/20 rounded">
                    {vehicle.category}
                  </span>
                  {vehicle.reviewCount && vehicle.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-dark bg-gold px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-dark" />
                      {vehicle.averageRating?.toFixed(1)}
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-display font-black tracking-tight text-white mb-4 leading-none lowercase">
                  {vehicle.name}
                </h2>
                <div className="flex items-center gap-2 text-muted font-medium text-xs uppercase tracking-widest">
                  <MapPin className="w-4 h-4 text-gold/60" />
                  {vehicle.location}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-4 bg-dark-3 border border-white/5 rounded-xl">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Price</p>
                  <p className="text-lg font-bold text-white">ETB {vehicle.pricePerDay.toLocaleString()}<span className="text-[10px] text-muted font-normal">/day</span></p>
                </div>
                <div className="p-4 bg-dark-3 border border-white/5 rounded-xl">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-bold capitalize ${vehicle.availabilityStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                    {vehicle.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <div className="p-4 bg-dark-3 border border-white/5 rounded-xl">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Fuel / Transmission</p>
                  <p className="text-[11px] font-bold uppercase text-white">{vehicle.fuelType || 'Petrol'} / {vehicle.transmission || 'Auto'}</p>
                </div>
                <div className="p-4 bg-dark-3 border border-white/5 rounded-xl">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Passenger Capacity</p>
                  <p className="text-[11px] font-bold uppercase text-white">{vehicle.seats || 5} Seats</p>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold mb-4">About this vehicle</h3>
                <p className="text-muted leading-relaxed italic border-l-2 border-gold/20 pl-6 py-2 mb-8 text-sm">
                  {vehicle.description}
                </p>

                {/* Owner Information Card */}
                <div className="p-6 bg-dark-1 rounded-xl text-white border border-gold/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Shield className="w-20 h-20 text-gold" />
                  </div>
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3 h-3 text-gold" />
                    Verified Provider
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center text-dark text-xl font-bold shadow-lg shadow-gold/10">
                      {vehicle.ownerName?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold leading-none mb-1">{vehicle.ownerName || 'Vehicle Owner'}</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-bold text-muted uppercase tracking-tight flex items-center gap-1.5 leading-none">
                          <User className="w-2.5 h-2.5" />
                          Authorized Representative
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-xs font-medium text-muted">
                  <Shield className="w-4 h-4 text-gold/60" />
                  Full Insurance Coverage Included
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-muted">
                  <Clock className="w-4 h-4 text-gold/60" />
                  Flexible Pick-up & Drop-off
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-muted">
                  <Star className="w-4 h-4 text-gold/60" />
                  Top Rated Service Provider
                </div>
              </div>

              <button
                onClick={() => onBook(vehicle)}
                className="btn-primary w-full py-5 text-sm uppercase tracking-widest"
              >
                Book This Vehicle
              </button>

              <div className="mt-12 pt-12 border-t border-white/5">
                <div className="flex items-center gap-2 mb-8">
                   <MessageSquare className="w-5 h-5 text-gold" />
                   <h3 className="text-xl font-display font-bold text-white">Guest Reviews</h3>
                </div>
                <ReviewSection vehicleId={vehicle.id} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
