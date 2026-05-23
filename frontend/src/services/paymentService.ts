import { apiFetch } from '../lib/apiClient';
import { Payment } from '../types';

export const paymentService = {
  async getAllPayments(): Promise<Payment[]> {
    return apiFetch('/admin/payments');
  },

  async getOwnerPayments(): Promise<Payment[]> {
    return apiFetch('/owner/payments');
  },

  async verifyPayment(id: number | string): Promise<void> {
    await apiFetch(`/admin/payments/${id}/verify`, {
      method: 'PUT'
    });
  },

  async ownerVerifyPayment(id: number | string, action: 'verify' | 'reject' = 'verify'): Promise<void> {
    await apiFetch(`/owner/payments/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ action })
    });
  }
};
