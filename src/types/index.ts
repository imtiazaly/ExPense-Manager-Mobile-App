export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  ifsc_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id: number;
  user_id?: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  iban?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: number;
  name: string;
  unit?: string | null;
  current_price: number;
  previous_price?: number | null;
  average_price?: number | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BillItem {
  id?: number;
  bill_id?: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
  item?: Item;
}

export interface Bill {
  id: number;
  user_id: number;
  vendor_id: number;
  bill_number: string;
  bill_date: string;
  subtotal: number;
  grand_total: number;
  status: 'paid' | 'unpaid' | 'pending';
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
