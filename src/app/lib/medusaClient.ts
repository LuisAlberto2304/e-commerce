// app/lib/medusaClient.ts
export async function fetchProducts(filters: {
  categoryId?: string;
  q?: string;
  color?: string;
  size?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.q) params.append('q', filters.q);
  // Solo enviar color y size si tienen valor
  if (filters.color && filters.color.trim() !== '') params.append('color', filters.color);
  if (filters.size && filters.size.trim() !== '') params.append('size', filters.size);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const url = `/api/products?${params.toString()}`;
  console.log('📡 Llamando a API con URL:', url);

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error en respuesta:', res.status, errorText);
      throw new Error(`Failed to fetch products: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log('✅ Productos recibidos:', data.products?.length || 0);
    return data;
  } catch (error) {
    console.error('🚨 Error en fetchProducts:', error);
    throw error;
  }
}