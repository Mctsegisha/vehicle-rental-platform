import { apiFetch } from '../lib/apiClient';
import { Payment } from '../types';

export const paymentService = {
  async getAllPayments(): Promise<Payment[]> {
    return apiFetch('/admin/payments');
  },

  async verifyPayment(id: number | string): Promise<void> {
    await apiFetch(`/admin/payments/${id}/verify`, {
      method: 'PUT'
    });
  }
};
