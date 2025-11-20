/* eslint-disable @typescript-eslint/no-explicit-any */
// types/order.ts
export interface Address {
  address_1: string;
  city: string;
  country_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  postal_code: string;
  province: string;
}

export interface OrderItem {
  addedAt: any; // Timestamp de Firebase
  id: string;
  image: string;
  ownerId: string;
  price: number;
  productId: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  status: string;
  title: string;
  variantDescription: string;
  variantId: string;
}

export interface Order {
  id?: string;
  address: Address;
  address_1: string;
  city: string;
  country_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  postal_code: string;
  province: string;
  createdAt: any; // Timestamp de Firebase
  email: string;
  firebaseCreated: string;
  items: OrderItem[];
  medusaCartId: string;
  payment_method: string;
  paypal_capture_id?: string;
  shippingCost: number;
  shippingMethod: string;
  status: 'paid' | 'pending' | 'cancelled' | string;
  total: number;
  updatedAt: any; // Timestamp de Firebase
  userId: string;
}

export interface User {
  uid: string;
  email: string | null;
  role?: 'admin' | 'user';
}