import { apiFetch } from '../lib/apiClient';
import { Booking } from '../types';

export const bookingService = {
  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async getCustomerBookings(): Promise<Booking[]> {
    return apiFetch('/bookings/customer');
  },

  async getOwnerBookings(): Promise<Booking[]> {
    return apiFetch('/bookings/owner');
  },

  async updateBookingStatus(id: number | string, status: string, paymentReference?: string): Promise<void> {
    await apiFetch(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, payment_reference: paymentReference }),
    });
  }
};
