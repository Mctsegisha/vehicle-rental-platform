import { apiFetch } from '../lib/apiClient';
import { Review } from '../types';

export const reviewService = {
  async getVehicleReviews(vehicleId: number): Promise<Review[]> {
    return apiFetch(`/vehicles/${vehicleId}/reviews`);
  },

  async submitReview(data: { vehicle_id: number; rating: number; comment: string; booking_id?: number }): Promise<Review> {
    return apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
