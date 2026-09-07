import client from './client';
import { Vendor } from '../types';

export const vendorApi = {
  getVendors: async (params?: { search?: string; active_only?: boolean }) => {
    const response = await client.get<{ data: Vendor[] }>('/vendors', {
      params,
    });
    return response.data.data;
  },

  createVendor: async (data: Partial<Vendor>): Promise<Vendor> => {
    const response = await client.post<{ data: Vendor }>('/vendors', data);
    return response.data.data;
  },

  updateVendor: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
    const response = await client.put<{ data: Vendor }>(`/vendors/${id}`, data);
    return response.data.data;
  },

  deleteVendor: async (id: number): Promise<void> => {
    await client.delete(`/vendors/${id}`);
  },
};
