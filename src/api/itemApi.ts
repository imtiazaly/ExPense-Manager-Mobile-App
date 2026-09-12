import client from './client';
import { Item } from '../types';
import { syncService, CACHE_KEYS } from '../services/syncService';

export const itemApi = {
  getItems: async (params?: {
    search?: string;
    active_only?: boolean;
  }): Promise<Item[]> => {
    try {
      const response = await client.get<{ data: Item[] }>('/items', { params });
      const items = response.data.data;
      if (!params?.search) {
        await syncService.setCache(CACHE_KEYS.ITEMS, items);
      }
      return items;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      const cached = await syncService.getCache<Item[]>(CACHE_KEYS.ITEMS);
      let list = cached || [];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(q));
      }
      return list;
    }
  },

  createItem: async (data: Partial<Item>): Promise<Item> => {
    try {
      const response = await client.post<{ data: Item }>('/items', data);
      const newItem = response.data.data;
      const cached =
        (await syncService.getCache<Item[]>(CACHE_KEYS.ITEMS)) || [];
      await syncService.setCache(CACHE_KEYS.ITEMS, [newItem, ...cached]);
      return newItem;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      const tempItem: Item = {
        id: Date.now(),
        name: data.name || 'New Item',
        current_price: data.current_price || 0,
        unit: data.unit,
        description: data.description,
      };

      await syncService.enqueue('CREATE_ITEM', data);
      const cached =
        (await syncService.getCache<Item[]>(CACHE_KEYS.ITEMS)) || [];
      await syncService.setCache(CACHE_KEYS.ITEMS, [tempItem, ...cached]);

      return tempItem;
    }
  },

  updateItem: async (id: number, data: Partial<Item>): Promise<Item> => {
    try {
      const response = await client.put<{ data: Item }>(`/items/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      await syncService.enqueue('UPDATE_ITEM', { id, data });
      const cached =
        (await syncService.getCache<Item[]>(CACHE_KEYS.ITEMS)) || [];
      const updated = cached.map(i => (i.id === id ? { ...i, ...data } : i));
      await syncService.setCache(CACHE_KEYS.ITEMS, updated);
      return {
        id,
        name: data.name || '',
        current_price: data.current_price || 0,
        ...data,
      } as Item;
    }
  },

  deleteItem: async (id: number): Promise<void> => {
    try {
      await client.delete(`/items/${id}`);
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      await syncService.enqueue('DELETE_ITEM', { id });
      const cached =
        (await syncService.getCache<Item[]>(CACHE_KEYS.ITEMS)) || [];
      await syncService.setCache(
        CACHE_KEYS.ITEMS,
        cached.filter(i => i.id !== id),
      );
    }
  },
};