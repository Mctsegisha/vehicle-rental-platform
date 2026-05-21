import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, DollarSign, MapPin, Info, Upload, Image as ImageIcon } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicleToEdit?: Vehicle | null;
}

export default function AddVehicleModal({ isOpen, onClose, onSuccess, vehicleToEdit }: AddVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sedan',
    description: '',
    pricePerDay: '',
    location: '',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seats: '5',
    availabilityStatus: 'available',
    images: [] as string[],
    plateNumber: '',
    ownershipBookUrl: '',
    insuranceCertUrl: '',
    nationalIdUrl: '',
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        name: vehicleToEdit.name || '',
        category: vehicleToEdit.category,
        description: vehicleToEdit.description || '',
        pricePerDay: vehicleToEdit.pricePerDay.toString(),
        location: vehicleToEdit.location,
        fuelType: vehicleToEdit.fuelType || 'Petrol',
        transmission: vehicleToEdit.transmission || 'Automatic',
        seats: (vehicleToEdit.seats || 5).toString(),
        availabilityStatus: vehicleToEdit.availabilityStatus || 'available',
        images: vehicleToEdit.images || [],
        plateNumber: vehicleToEdit.plateNumber || '',
        ownershipBookUrl: vehicleToEdit.ownershipBookUrl || '',
        insuranceCertUrl: vehicleToEdit.insuranceCertUrl || '',
        nationalIdUrl: vehicleToEdit.nationalIdUrl || '',
      });
      
      const categories = ['Sedan', 'SUV', 'Luxury', 'Truck', 'Hatchback', 'Motorcycle'];
      if (!categories.includes(vehicleToEdit.category)) {
        setShowCustomCategory(true);
        setCustomCategory(vehicleToEdit.category);
      } else {
        setShowCustomCategory(false);
        setCustomCategory('');
      }
    } else {
      setFormData({
        name: '',
        category: 'Sedan',
        description: '',
        pricePerDay: '',
        location: '',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        seats: '5',
        availabilityStatus: 'available',
        images: [],
        plateNumber: '',
        ownershipBookUrl: '',
        insuranceCertUrl: '',
        nationalIdUrl: '',
      });
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  }, [vehicleToEdit, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { urls } = await vehicleService.uploadImages(files);
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...urls]
      }));
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { urls } = await vehicleService.uploadImages([file]);
      setFormData(prev => ({ 
        ...prev, 
        [field]: urls[0]
      }));
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const price = parseFloat(formData.pricePerDay);
      const seatsCount = parseInt(formData.seats);

      if (isNaN(price)) throw new Error('Please enter a valid price per day.');
      if (isNaN(seatsCount)) throw new Error('Please enter a valid seat count.');

      if (!vehicleToEdit) {
        if (!formData.ownershipBookUrl) throw new Error('Ownership book is required.');
        if (!formData.insuranceCertUrl) throw new Error('Insurance certification is required.');
        if (!formData.nationalIdUrl) throw new Error('National ID is required.');
        if (!formData.plateNumber) throw new Error('Plate number is required.');
        if (formData.images.length === 0) throw new Error('At least one vehicle photo is required.');
      }

      const vehicleRecord = {
        category: showCustomCategory ? customCategory : formData.category,
        name: formData.name,
        description: formData.description,
        price_per_day: price,
        location: formData.location,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        seats: seatsCount,
        availability_status: formData.availabilityStatus,
        images: formData.images,
        plate_number: formData.plateNumber,
        ownership_book_url: formData.ownershipBookUrl,
        insurance_cert_url: formData.insuranceCertUrl,
        national_id_url: formData.nationalIdUrl,
      };

      if (vehicleToEdit) {
        await vehicleService.updateVehicle(vehicleToEdit.id, vehicleRecord);
      } else {
        await vehicleService.addVehicle(vehicleRecord);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save vehicle:', err.message);
      alert('Failed to save vehicle: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="add-vehicle-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="add-vehicle-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            key={`add-vehicle-modal-container-${vehicleToEdit?.id || 'new'}`}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-dark-2 w-full max-w-2xl rounded-[14px] border border-gold/15 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="sticky top-0 z-10 bg-dark-2/80 backdrop-blur-md px-10 py-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-display font-black text-white tracking-tight">{vehicleToEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-all group"
              >
                <X className="w-5 h-5 text-muted group-hover:text-gold" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Vehicle Name */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Vehicle Model *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Toyota Land Cruiser"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm"
                  />
                </div>

                {/* Category */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setShowCustomCategory(true);
                        setFormData({ ...formData, category: 'Other' });
                      } else {
                        setShowCustomCategory(false);
                        setFormData({ ...formData, category: val });
                      }
                    }}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Truck">Truck</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                {showCustomCategory && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="col-span-2 space-y-2"
                  >
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">New Category</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter category name"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm"
                    />
                  </motion.div>
                )}

                {/* Location */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Location *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Addis Ababa"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm"
                  />
                </div>

                {/* Price */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Price per Day (ETB) *</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 1500"
                    value={formData.pricePerDay}
                    onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm font-mono"
                  />
                </div>

                {/* Plate Number */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Vehicle Plate Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. AA 2 12345"
                    value={formData.plateNumber}
                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm uppercase"
                  />
                </div>

                {/* Fuel Type */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Transmission */}
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={e => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* Seats */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Passenger Capacity</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 5"
                    value={formData.seats}
                    onChange={e => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    required
                    placeholder="Describe condition, rental terms, and features..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all placeholder:text-muted/20 text-sm min-h-[120px] resize-none leading-relaxed"
                  />
                </div>

                {/* Availability Status */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Availability Status</label>
                  <select
                    value={formData.availabilityStatus}
                    onChange={e => setFormData({ ...formData, availabilityStatus: e.target.value as any })}
                    className="w-full px-5 py-4 bg-dark-3 text-white border border-white/5 rounded-lg focus:border-gold outline-none transition-all appearance-none cursor-pointer text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable / Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Required Documentation */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gold" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Required Documentation</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ownership Book */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Ownership Book (Libre) *</label>
                    <div className={`relative px-4 py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      formData.ownershipBookUrl ? 'border-gold/50 bg-gold/5' : 'border-white/5 hover:border-gold/30'
                    }`}>
                      <Upload className={`w-5 h-5 ${formData.ownershipBookUrl ? 'text-gold' : 'text-muted'}`} />
                      <span className="text-[9px] font-bold text-white uppercase text-center">
                        {formData.ownershipBookUrl ? 'Uploaded ✓' : 'Upload PDF/Image'}
                      </span>
                      <input 
                        type="file" 
                        required={!vehicleToEdit?.ownershipBookUrl}
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocUpload(e, 'ownershipBookUrl')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Insurance Certification *</label>
                    <div className={`relative px-4 py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      formData.insuranceCertUrl ? 'border-gold/50 bg-gold/5' : 'border-white/5 hover:border-gold/30'
                    }`}>
                      <Upload className={`w-5 h-5 ${formData.insuranceCertUrl ? 'text-gold' : 'text-muted'}`} />
                      <span className="text-[9px] font-bold text-white uppercase text-center">
                        {formData.insuranceCertUrl ? 'Uploaded ✓' : 'Upload PDF/Image'}
                      </span>
                      <input 
                        type="file" 
                        required={!vehicleToEdit?.insuranceCertUrl}
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocUpload(e, 'insuranceCertUrl')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* National ID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">National ID / Fayda ID *</label>
                    <div className={`relative px-4 py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      formData.nationalIdUrl ? 'border-gold/50 bg-gold/5' : 'border-white/5 hover:border-gold/30'
                    }`}>
                      <Upload className={`w-5 h-5 ${formData.nationalIdUrl ? 'text-gold' : 'text-muted'}`} />
                      <span className="text-[9px] font-bold text-white uppercase text-center">
                        {formData.nationalIdUrl ? 'Uploaded ✓' : 'Upload PDF/Image'}
                      </span>
                      <input 
                        type="file" 
                        required={!vehicleToEdit?.nationalIdUrl}
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocUpload(e, 'nationalIdUrl')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos Upload */}
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Vehicle Photos *</label>
                <div className={`w-full min-h-[160px] bg-dark-3/50 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative group ${
                  formData.images.length > 0 ? 'border-gold/30 bg-gold/5' : 'border-white/5 hover:border-gold/30'
                }`}>
                  <div className="p-4 rounded-lg bg-dark-1 border border-white/5 group-hover:border-gold/30 transition-colors">
                    <ImageIcon className={`w-6 h-6 ${uploading ? 'animate-pulse text-gold' : 'text-muted'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-white uppercase tracking-widest">
                      {uploading ? 'Uploading...' : 'Upload Vehicle Photos'}
                    </p>
                    <p className="text-[9px] text-muted mt-1 uppercase font-medium">
                      Multi-angle photos recommended
                    </p>
                  </div>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {formData.images.map((url, index) => (
                      <div key={`vehicle-img-${index}-${url.slice(-10)}`} className="relative group aspect-square rounded-lg overflow-hidden border border-white/5 bg-dark-3">
                        <img src={url} className="w-full h-full object-cover" alt={`Unit ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-dark-1/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                        >
                          <X className="w-5 h-5 text-gold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-8 border-t border-white/5">
                <button
                  disabled={loading || uploading}
                  type="submit"
                  className="btn-primary w-full py-5 text-sm uppercase tracking-widest disabled:opacity-30"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (uploading ? 'Uploading Photos...' : (vehicleToEdit ? 'Save Changes' : 'Add Vehicle'))}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
