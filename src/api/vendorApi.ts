import client from './client';
import { Vendor } from '../types';
import { syncService, CACHE_KEYS } from '../services/syncService';

export const vendorApi = {
  getVendors: async (params?: {
    search?: string;
    active_only?: boolean;
  }): Promise<Vendor[]> => {
    try {
      const response = await client.get<{ data: Vendor[] }>('/vendors', {
        params,
      });
      const vendors = response.data.data;
      if (!params?.search) {
        await syncService.setCache(CACHE_KEYS.VENDORS, vendors);
      }
      return vendors;
    } catch (error) {
      // Offline Fallback to Local Cache
      const cached = await syncService.getCache<Vendor[]>(CACHE_KEYS.VENDORS);
      let list = cached || [];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(v => v.name.toLowerCase().includes(q));
      }
      return list;
    }
  },

  createVendor: async (data: Partial<Vendor>): Promise<Vendor> => {
    try {
      const response = await client.post<{ data: Vendor }>('/vendors', data);
      const newVendor = response.data.data;

      // Update Cache
      const cached =
        (await syncService.getCache<Vendor[]>(CACHE_KEYS.VENDORS)) || [];
      await syncService.setCache(CACHE_KEYS.VENDORS, [newVendor, ...cached]);

      return newVendor;
    } catch (error) {
      // Queue Offline Action & Fake Return for UI
      const tempVendor: Vendor = {
        id: Date.now(),
        name: data.name || 'New Vendor',
        phone: data.phone,
        email: data.email,
        address: data.address,
      };

      await syncService.enqueue('CREATE_VENDOR', data);
      const cached =
        (await syncService.getCache<Vendor[]>(CACHE_KEYS.VENDORS)) || [];
      await syncService.setCache(CACHE_KEYS.VENDORS, [tempVendor, ...cached]);

      return tempVendor;
    }
  },

  updateVendor: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
    try {
      const response = await client.put<{ data: Vendor }>(
        `/vendors/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      await syncService.enqueue('UPDATE_VENDOR', { id, data });
      const cached =
        (await syncService.getCache<Vendor[]>(CACHE_KEYS.VENDORS)) || [];
      const updated = cached.map(v => (v.id === id ? { ...v, ...data } : v));
      await syncService.setCache(CACHE_KEYS.VENDORS, updated);
      return { id, name: data.name || '', ...data } as Vendor;
    }
  },

  deleteVendor: async (id: number): Promise<void> => {
    try {
      await client.delete(`/vendors/${id}`);
    } catch (error) {
      await syncService.enqueue('DELETE_VENDOR', { id });
      const cached =
        (await syncService.getCache<Vendor[]>(CACHE_KEYS.VENDORS)) || [];
      await syncService.setCache(
        CACHE_KEYS.VENDORS,
        cached.filter(v => v.id !== id),
      );
    }
  },
};
