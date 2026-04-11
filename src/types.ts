export type ProductCategory = string;
export type ProductStatus = "active" | "inactive" | "out_of_stock";
export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "UPI";

export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  locality: string;
  flatNo: string;
  landmark?: string;
  type: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  screenName?: string;
  email: string;
  password?: string;
  age?: number;
  dob?: string;
  mobile?: string;
  gender?: string;
  addresses: Address[];
  role?: 'admin' | 'user';
  created_date: string;
  emailVerified?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  cost_price: number;
  stock: number;
  image_url: string;
  image_urls?: string[];
  sku: string;
  status: ProductStatus;
  shipping_info?: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}

export interface LineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  tracking_id?: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}
