import { apiFetch } from '../lib/apiClient';
import { UserProfile } from '../types';

export const userService = {
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  async register(profile: any): Promise<{ user: UserProfile; token: string }> {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      return await apiFetch('/auth/profile');
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    return apiFetch('/admin/users');
  },
  
  async updateUser(id: number, updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiFetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateProfileVerification(updates: { age?: number; driverLicenseNumber?: string; idPhotoUrl?: string; licensePhotoUrl?: string; targetOwnerId?: number }): Promise<UserProfile> {
    return apiFetch('/auth/profile/verification', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getOwnerVerificationRequests(): Promise<any[]> {
    return apiFetch('/owner/verification-requests');
  },

  async getMyVerificationRequests(): Promise<any[]> {
    return apiFetch('/auth/profile/verification-requests');
  },

  async updateVerificationRequestStatus(id: number, status: 'approved' | 'rejected'): Promise<any> {
    return apiFetch(`/owner/verification-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};
