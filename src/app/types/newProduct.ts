/* eslint-disable @typescript-eslint/no-explicit-any */
export type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  prices: Array<{
    amount: number;
    currency_code: string;
  }>;
  options: Array<{
    option: any;
    option_id: string;
    value: string;
  }>;
  inventory_quantity: number;
};

export type ProductOption = {
  name: any;
  id: string;
  title: string; // "Color", "Size", etc.
  values: Array<{
    id: string;
    value: string; // "Red", "Blue", "S", "M", etc.
  }>;
};

export type Product = {
  averageRating: number;
  tags(tags: any): unknown;
  metadata: any;
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  handle: string;
  variants: ProductVariant[];
  options: ProductOption[];
  categories?: Array<{ id: string; name: string }>;
  collection?: { id: string; title: string };
  images?: Array<{ url: string; id?: string }>;
};

export type Filters = {
  rating: any;
  maxPrice: undefined;
  minPrice: undefined;
  q?: string;
  color?: string[];
  size?: string[];
  categories?: string[];
  price_range?: { min?: number; max?: number };
};