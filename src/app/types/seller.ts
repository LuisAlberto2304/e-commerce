// types/seller.ts
export interface SellerProfile {
  uid: string;
  email: string;
  name: string;
  role: 'seller' | 'admin' | 'user';
  storeName: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  storeAddress?: string;
  storePhone?: string;
  storeSocialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
  // Campos que podrían añadirse después
  rating?: number;
  totalSales?: number;
  totalProducts?: number;
  isActive?: boolean;
  storeSlug?: string;
}

export interface SellerStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  monthlySales: number;
}

export interface SellerProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  inventory: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  ownerId: string; // El UID del seller
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  inventory: number;
  options: Record<string, string>;
}