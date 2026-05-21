export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'admin';
  phone?: string;
  status: string;
  age?: number;
  driverLicenseNumber?: string;
  idPhotoUrl?: string;
  licensePhotoUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  category: string;
  description?: string;
  pricePerDay: number;
  location: string;
  availabilityStatus: string;
  images: string[];
  fuelType?: string;
  transmission?: string;
  seats?: number;
  createdAt: string;
  averageRating: number;
  reviewCount: number;
}

export interface Booking {
  id: number;
  customerId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  paymentReference?: string;
  createdAt: string;
}
