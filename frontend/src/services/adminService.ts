import { apiFetch } from '../lib/apiClient';

export interface AdminStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  totalCommissions: number;
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
  },
  async getPendingVehicles(): Promise<any[]> {
    return apiFetch('/admin/vehicles/pending');
  },
  async updateVehicleApproval(id: number, status: 'approved' | 'rejected'): Promise<void> {
    await apiFetch(`/admin/vehicles/${id}/approval`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  async getCommissions(): Promise<any[]> {
    return apiFetch('/admin/commissions');
  }
};
