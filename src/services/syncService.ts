import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export interface PendingAction {
  id: string;
  type:
    | 'CREATE_VENDOR'
    | 'UPDATE_VENDOR'
    | 'DELETE_VENDOR'
    | 'CREATE_ITEM'
    | 'UPDATE_ITEM'
    | 'DELETE_ITEM'
    | 'CREATE_BILL'
    | 'UPDATE_BILL_STATUS'
    | 'DELETE_BILL';
  payload: any;
  createdAt: string;
}

const QUEUE_KEY = 'pending_sync_queue';
export const CACHE_KEYS = {
  VENDORS: 'cache_vendors',
  ITEMS: 'cache_items',
  BILLS: 'cache_bills',
};

export const syncService = {
  // Get Queue
  getQueue: async (): Promise<PendingAction[]> => {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Add Action to Queue
  enqueue: async (
    type: PendingAction['type'],
    payload: any,
  ): Promise<PendingAction[]> => {
    const queue = await syncService.getQueue();
    const newAction: PendingAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    const updatedQueue = [...queue, newAction];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue;
  },

  // Clear Queue
  clearQueue: async (): Promise<void> => {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  // Cache Operations
  getCache: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCache: async <T>(key: string, data: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Cache save error:', e);
    }
  },

  // Process Sync Queue against Laravel Backend
  processQueue: async (): Promise<{ success: number; failed: number }> => {
    const queue = await syncService.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: PendingAction[] = [];

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'CREATE_VENDOR':
            await client.post('/vendors', action.payload);
            break;
          case 'UPDATE_VENDOR':
            await client.put(
              `/vendors/${action.payload.id}`,
              action.payload.data,
            );
            break;
          case 'DELETE_VENDOR':
            await client.delete(`/vendors/${action.payload.id}`);
            break;

          case 'CREATE_ITEM':
            await client.post('/items', action.payload);
            break;
          case 'UPDATE_ITEM':
            await client.put(
              `/items/${action.payload.id}`,
              action.payload.data,
            );
            break;
          case 'DELETE_ITEM':
            await client.delete(`/items/${action.payload.id}`);
            break;

          case 'CREATE_BILL':
            await client.post('/bills', action.payload);
            break;
          case 'UPDATE_BILL_STATUS':
            await client.put(
              `/bills/${action.payload.id}`,
              action.payload.data,
            );
            break;
          case 'DELETE_BILL':
            await client.delete(`/bills/${action.payload.id}`);
            break;
        }
        successCount++;
      } catch (err) {
        console.log(`Failed to sync action ${action.type}:`, err);
        failedCount++;
        remainingQueue.push(action);
      }
    }

    // Save remaining failed actions back to queue
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    return { success: successCount, failed: failedCount };
  },
};
