import { apiFetch } from '../lib/apiClient';
import { AppNotification } from '../types';

export const notificationService = {
  async getMyNotifications(): Promise<AppNotification[]> {
    return apiFetch('/notifications');
  },

  async markAsRead(id: number | string): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllAsRead(): Promise<void> {
    await apiFetch('/notifications/mark-all-read', {
      method: 'POST'
    });
  },

  async deleteNotification(id: number | string): Promise<void> {
    await apiFetch(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }
};
