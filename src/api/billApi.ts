import client from './client';
import { Bill } from '../types';
import { syncService, CACHE_KEYS } from '../services/syncService';

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export const billApi = {
  getBills: async (params?: {
    search?: string;
    status?: string;
    vendor_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Bill>> => {
    try {
      const response = await client.get('/bills', {
        params: { per_page: 20, ...params },
      });

      const bills = response.data.data || [];
      if (!params?.search && (!params?.page || params.page === 1)) {
        await syncService.setCache(CACHE_KEYS.BILLS, bills);
      }

      return { data: bills, meta: response.data.meta };
    } catch (error) {
      const cached = await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS);
      let list = cached || [];
      if (params?.status && params.status !== 'all') {
        list = list.filter(b => b.status === params.status);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          b =>
            b.bill_number.toLowerCase().includes(q) ||
            b.vendor?.name.toLowerCase().includes(q),
        );
      }
      return { data: list, meta: undefined };
    }
  },

  getBillDetails: async (id: number): Promise<Bill> => {
    try {
      const response = await client.get<{ data: Bill }>(`/bills/${id}`);
      return response.data.data;
    } catch (error) {
      const cached = await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS);
      const found = (cached || []).find(b => b.id === id);
      if (found) return found;
      throw error;
    }
  },

  createBill: async (data: {
    vendor_id: number;
    bill_number: string;
    bill_date: string;
    status: 'paid' | 'unpaid' | 'pending';
    items: { item_id: number; quantity: number; unit_price?: number }[];
  }): Promise<Bill> => {
    try {
      const response = await client.post<{ data: Bill }>('/bills', data);
      const newBill = response.data.data;
      const cached =
        (await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS)) || [];
      await syncService.setCache(CACHE_KEYS.BILLS, [newBill, ...cached]);
      return newBill;
    } catch (error) {
      const grandTotal = data.items.reduce(
        (acc, curr) => acc + curr.quantity * (curr.unit_price || 0),
        0,
      );
      const tempBill: Bill = {
        id: Date.now(),
        user_id: 1,
        vendor_id: data.vendor_id,
        bill_number: data.bill_number,
        bill_date: data.bill_date,
        subtotal: grandTotal,
        grand_total: grandTotal,
        status: data.status,
      };

      await syncService.enqueue('CREATE_BILL', data);
      const cached =
        (await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS)) || [];
      await syncService.setCache(CACHE_KEYS.BILLS, [tempBill, ...cached]);

      return tempBill;
    }
  },

  updateBill: async (
    id: number,
    data: {
      vendor_id: number;
      bill_number: string;
      bill_date: string;
      status: 'paid' | 'unpaid' | 'pending';
    },
  ): Promise<Bill> => {
    try {
      const response = await client.put<{ data: Bill }>(`/bills/${id}`, data);
      const updated = response.data.data;
      const cached =
        (await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS)) || [];
      const list = cached.map(b => (b.id === id ? updated : b));
      await syncService.setCache(CACHE_KEYS.BILLS, list);
      return updated;
    } catch (error) {
      await syncService.enqueue('UPDATE_BILL_STATUS', { id, data });
      const cached =
        (await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS)) || [];
      const updatedList = cached.map(b =>
        b.id === id ? { ...b, status: data.status } : b,
      );
      await syncService.setCache(CACHE_KEYS.BILLS, updatedList);
      return { id, ...data } as Bill;
    }
  },

  deleteBill: async (id: number): Promise<void> => {
    try {
      await client.delete(`/bills/${id}`);
    } catch (error) {
      await syncService.enqueue('DELETE_BILL', { id });
      const cached =
        (await syncService.getCache<Bill[]>(CACHE_KEYS.BILLS)) || [];
      await syncService.setCache(
        CACHE_KEYS.BILLS,
        cached.filter(b => b.id !== id),
      );
    }
  },
};