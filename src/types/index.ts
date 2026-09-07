export interface User {
  id: number;
  name: string;
  email: string;
  account_title?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id: number;
  user_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: number;
  user_id: number;
  name: string;
  unit_price: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillItem {
  id?: number;
  bill_id?: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  item?: Item;
}

export interface Bill {
  id: number;
  user_id: number;
  vendor_id: number;
  bill_number: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  vendor?: Vendor;
  items?: BillItem[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
  message?: string;
}
