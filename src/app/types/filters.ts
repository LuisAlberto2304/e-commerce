// app/types/filters.ts
export type Filters = { 
  q?: string; 
  color?: string[];
  size?: string[];
  categories?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  brand?: string[];
};