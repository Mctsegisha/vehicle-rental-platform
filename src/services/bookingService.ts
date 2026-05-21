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
    return apiFetch('/owner/bookings');
  },

  async updateBookingStatus(id: number | string, status: string, paymentReference?: string): Promise<void> {
    await apiFetch(`/bookings/u-b-s`, {
      method: 'POST',
      body: JSON.stringify({ 
        bookingId: id,
        status, 
        payment_reference: paymentReference 
      }),
    });
  }
};
