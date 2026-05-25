import { apiFetch } from '../lib/apiClient';
import { Vehicle } from '../types';

export const vehicleService = {
  async getAllVehicles(status?: string, category?: string, minPrice?: number, maxPrice?: number, limit?: number): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const queryString = params.toString();
    const url = queryString ? `/vehicles?${queryString}` : '/vehicles';
    return apiFetch(url);
  },

  async uploadImages(files: FileList | File[]): Promise<{ urls: string[] }> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      } else {
        const text = await response.text();
        console.error('Upload failed with status:', response.status, text);
        throw new Error(`Upload failed (${response.status}). Please try again later.`);
      }
    }

    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text();
      console.error('Upload succeeded but returned non-JSON:', text);
      throw new Error('Upload succeeded but received invalid response from server.');
    }
  },

  async addVehicle(vehicle: any): Promise<Vehicle> {
    return apiFetch('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  },

  async updateVehicle(id: number, vehicle: any): Promise<Vehicle> {
    return apiFetch(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  },

  async getOwnerVehicles(): Promise<Vehicle[]> {
    return apiFetch('/owner/vehicles');
  },

  async getCategories(): Promise<string[]> {
    return apiFetch('/vehicles/categories');
  },

  async deleteVehicle(id: number): Promise<void> {
    await apiFetch(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }
};
