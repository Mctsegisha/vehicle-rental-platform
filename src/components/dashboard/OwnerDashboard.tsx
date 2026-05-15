import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Car, ListChecks, DollarSign, Check, X, Edit2, ShieldCheck, Trash2 } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { userService } from '../../services/userService';
import { Vehicle, Booking, UserProfile } from '../../types';
import AddVehicleModal from '../vehicles/AddVehicleModal';

interface OwnerDashboardProps {
  user: UserProfile;
}

export default function OwnerDashboard({ user }: OwnerDashboardProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const fetchData = async () => {
    try {
      const [vData, bData, vrData] = await Promise.all([
        vehicleService.getOwnerVehicles(),
        bookingService.getOwnerBookings(),
        userService.getOwnerVerificationRequests()
      ]);
      setVehicles(Array.isArray(vData) ? vData : []);
      setBookings(Array.isArray(bData) ? bData : []);
      setVerificationRequests(Array.isArray(vrData) ? vrData : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookingAction = async (id: number, status: 'approved' | 'rejected' | 'completed') => {
    await bookingService.updateBookingStatus(id, status);
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This will also remove associated non-active bookings and reviews.')) return;
    try {
      await vehicleService.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleVerificationAction = async (id: number, status: 'approved' | 'rejected') => {
    await userService.updateVerificationRequestStatus(id, status);
    setVerificationRequests(verificationRequests.filter(vr => vr.request_id !== id));
    if (status === 'approved') {
       // Optionally show a toast or message
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setVehicleToEdit(null);
  };

  return (
    <div className="space-y-12 pb-12 font-sans">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl">
          <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">My Vehicles</p>
          <p className="text-3xl font-display font-black text-white">{(vehicles || []).length}</p>
        </div>
        <div className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl">
          <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Pending Requests</p>
          <p className="text-3xl font-display font-black text-gold">
            { (bookings || []).filter(b => b.status === 'pending').length + (verificationRequests || []).length }
          </p>
        </div>
        <div className="bg-dark-1 p-8 rounded-xl border border-gold/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16 text-gold" />
          </div>
          <p className="text-gold/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Earnings</p>
          <p className="text-4xl font-display font-black text-gold tracking-tighter">
            ETB { (bookings || [])
              .filter(b => b.status === 'completed')
              .reduce((sum: number, b: any) => sum + b.totalAmount, 0)
              .toLocaleString()}
          </p>
          <p className="text-[10px] text-muted font-bold mt-2 font-mono">PAYMENTS RECEIVED</p>
        </div>
        <div className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl">
          <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Active Bookings</p>
          <p className="text-3xl font-display font-black text-blue-400">
            {(bookings || []).filter(b => b.status === 'approved' || b.status === 'paid').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Verification Requests */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-black flex items-center gap-4 text-white uppercase tracking-tight">
              <ShieldCheck className="w-6 h-6 text-gold" />
              Verification Requests
            </h2>
          </div>
          <div className="space-y-4">
            {(verificationRequests || []).map((request, i) => (
              <motion.div 
                key={`vr-${request.request_id}-${i}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-display font-black text-white text-lg tracking-tight uppercase">{request.customer_name}</p>
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mt-1">{request.customer_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVerificationAction(request.request_id, 'rejected')}
                      className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg border border-red-400/20 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleVerificationAction(request.request_id, 'approved')}
                      className="p-3 text-green-400 hover:bg-green-400/10 rounded-lg border border-green-400/20 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-muted uppercase tracking-widest">ID Document</p>
                     <img 
                       src={request.id_photo_url} 
                       className="w-full h-32 object-cover rounded-lg border border-white/5 grayscale hover:grayscale-0 transition-all cursor-zoom-in" 
                       alt="ID"
                       onClick={() => window.open(request.id_photo_url, '_blank')}
                     />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Driver's License</p>
                     <img 
                       src={request.license_photo_url} 
                       className="w-full h-32 object-cover rounded-lg border border-white/5 grayscale hover:grayscale-0 transition-all cursor-zoom-in" 
                       alt="License"
                       onClick={() => window.open(request.license_photo_url, '_blank')}
                     />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 font-mono">
                   <p className="text-[10px] text-muted">Age: <span className="font-bold text-white">{request.age}Y</span></p>
                   <p className="text-[10px] text-muted">License No: <span className="font-bold text-white">{request.driver_license_number}</span></p>
                </div>
              </motion.div>
            ))}
            {verificationRequests.length === 0 && (
              <div className="p-16 text-center bg-dark-1/30 rounded-xl border border-dashed border-white/5">
                <p className="text-muted font-bold text-[10px] uppercase tracking-widest">No pending requests</p>
              </div>
            )}
          </div>
        </section>

        {/* Booking Requests & Active Bookings */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-black flex items-center gap-4 text-white uppercase tracking-tight">
              <ListChecks className="w-6 h-6 text-gold" />
              Booking Requests
            </h2>
          </div>
          <div className="space-y-4">
            {(bookings || []).filter(b => b.status === 'pending' || b.status === 'paid' || b.status === 'confirmed').map((booking, i) => (
              <motion.div 
                key={`booking-${booking.id}-${i}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dark-1 p-8 rounded-xl border border-white/5 shadow-2xl flex items-center justify-between gap-6"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-display font-black text-white text-lg tracking-tight uppercase">{booking.vehicleName || `Vehicle-${booking.vehicleId}`}</p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      booking.status === 'paid' ? 'bg-orange-500/10 text-orange-400 border-orange-500/10' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 leading-none">{booking.category}</p>
                  <p className="text-xs text-muted font-mono mb-2">{booking.startDate} to {booking.endDate}</p>
                  <p className="text-sm font-bold text-gold font-mono">ETB {booking.totalAmount.toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 gap-3">
                  {booking.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'rejected')}
                        className="p-4 text-red-400 hover:bg-red-400/10 rounded-xl border border-red-400/20 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleBookingAction(booking.id, 'approved')}
                        className="p-4 text-dark bg-gold hover:scale-105 rounded-xl transition-all shadow-xl shadow-gold/20"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => handleBookingAction(booking.id, 'completed')}
                      className="px-6 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all"
                    >
                      Complete Rental
                    </button>
                  )}
                  {booking.status === 'paid' && (
                    <div className="text-[9px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-4 py-2 rounded-full uppercase tracking-widest">
                      Processing Payment
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {(bookings || []).filter(b => b.status === 'pending' || b.status === 'paid' || b.status === 'confirmed').length === 0 && (
              <div className="p-16 text-center bg-dark-1/30 rounded-xl border border-dashed border-white/5">
                <p className="text-muted font-bold text-[10px] uppercase tracking-widest">No active bookings</p>
              </div>
            )}
          </div>
        </section>

        {/* My Vehicles */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <h2 className="text-xl font-display font-black flex items-center gap-4 text-white uppercase tracking-tight">
              <Car className="w-6 h-6 text-gold" />
              My Vehicles
            </h2>
            <button 
              onClick={() => {
                setVehicleToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="btn-primary px-8 py-3 text-[10px] tracking-widest flex items-center gap-3"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((v, i) => (
              <div key={`owner-vehicle-${v.id}-${i}`} className="bg-dark-1 p-6 rounded-xl border border-white/5 shadow-2xl group hover:border-gold/20 transition-all">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-6 bg-dark-3 border border-white/5">
                   {v.images?.[0] ? (
                     <img src={v.images[0]} alt={v.category} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted/20" />
                     </div>
                   )}
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleEditVehicle(v)}
                        className="p-3 bg-dark/80 backdrop-blur-md text-gold hover:bg-gold hover:text-dark rounded-lg transition-all border border-gold/20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-3 bg-dark/80 backdrop-blur-md text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all border border-red-400/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-white text-lg tracking-tight uppercase">{v.name || v.category}</h3>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">{v.location} // {v.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-gold font-mono font-bold text-sm tracking-tighter">ETB {v.pricePerDay}</span>
                    <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      v.availabilityStatus === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {v.availabilityStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AddVehicleModal 
        isOpen={isAddModalOpen} 
        vehicleToEdit={vehicleToEdit}
        onClose={handleCloseModal} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
