import client from './client';
import { Item } from '../types';

export const itemApi = {
  getItems: async (params?: { search?: string; active_only?: boolean }) => {
    const response = await client.get<{ data: Item[] }>('/items', { params });
    return response.data.data;
  },

  createItem: async (data: Partial<Item>): Promise<Item> => {
    const response = await client.post<{ data: Item }>('/items', data);
    return response.data.data;
  },

  updateItem: async (id: number, data: Partial<Item>): Promise<Item> => {
    const response = await client.put<{ data: Item }>(`/items/${id}`, data);
    return response.data.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await client.delete(`/items/${id}`);
  },
};
