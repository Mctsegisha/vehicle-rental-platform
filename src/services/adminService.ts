import { apiFetch } from '../lib/apiClient';

export interface AdminStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  activeRentals: number;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    return apiFetch('/admin/stats');
  },
  async getBookings(): Promise<any[]> {
    return apiFetch('/admin/bookings');
  },
  async getVerifications(): Promise<any[]> {
    return apiFetch('/admin/verifications');
  }
};
