export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  age?: number;
  driverLicenseNumber?: string;
  idPhotoUrl?: string;
  licensePhotoUrl?: string;
  isVerified?: boolean;
}

export interface Vehicle {
  id: number;
  ownerId: number;
  name: string;
  category: string;
  description: string;
  pricePerDay: number;
  availabilityStatus: 'available' | 'unavailable';
  location: string;
  images: string[];
  fuelType?: string;
  transmission?: string;
  seats?: number;
  ownerName?: string;
  ownerPhone?: string;
  createdAt: string;
  averageRating?: number;
  reviewCount?: number;
  plateNumber?: string;
  ownershipBookUrl?: string;
  insuranceCertUrl?: string;
  nationalIdUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface Review {
  id: number;
  vehicleId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: number;
  customerId: number;
  ownerId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'confirmed' | 'completed';
  paymentReference?: string;
  createdAt: string;
  category?: string;
  vehicleName?: string;
  vehicle?: Vehicle;
  customerName?: string;
  customerEmail?: string;
  ownerName?: string;
  paymentId?: number;
}

export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  customerName?: string;
  vehicleName?: string;
  amount: number;
  paymentStatus: 'pending' | 'verified' | 'failed' | 'rejected';
  verifiedByAdmin: boolean;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}
