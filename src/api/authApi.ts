import client from './client';
import { User, AuthResponse } from '../types';

export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/register', userData);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await client.get<{ user: User }>('/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/logout');
  },

  updateProfile: async (
    data: Partial<User>,
  ): Promise<{ message: string; user: User }> => {
    const response = await client.put<{ message: string; user: User }>(
      '/profile',
      data,
    );
    return response.data;
  },

  updatePassword: async (passwords: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const response = await client.put<{ message: string }>(
      '/profile/password',
      passwords,
    );
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await client.get<{ data: User[] }>('/users');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.log('Error fetching users:', error);
      return [];
    }
  },
};
