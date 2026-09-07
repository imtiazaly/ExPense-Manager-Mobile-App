import client from './client';
import { Bill } from '../types';

export const billApi = {
  getBills: async (params?: {
    search?: string;
    status?: string;
    vendor_id?: number;
  }) => {
    const response = await client.get<{ data: Bill[] }>('/bills', { params });
    return response.data.data;
  },

  getBillDetails: async (id: number): Promise<Bill> => {
    const response = await client.get<{ data: Bill }>(`/bills/${id}`);
    return response.data.data;
  },

  createBill: async (data: {
    vendor_id: number;
    bill_number: string;
    bill_date: string;
    status: 'paid' | 'unpaid' | 'pending';
    items: { item_id: number; quantity: number; unit_price?: number }[];
  }): Promise<Bill> => {
    const response = await client.post<{ data: Bill }>('/bills', data);
    return response.data.data;
  },

  deleteBill: async (id: number): Promise<void> => {
    await client.delete(`/bills/${id}`);
  },
};
