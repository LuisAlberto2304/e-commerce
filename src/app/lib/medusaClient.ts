function getBaseUrl() {
  // Siempre usar URL absoluta para evitar problemas
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // En producción Vercel/Netlify
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Desarrollo local
  return "http://localhost:3000";
}

export async function fetchProducts(filters: {
  categoryId?: string;
  q?: string;
  color?: string;
  size?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.q) params.append('q', filters.q);
  if (filters.color && filters.color.trim() !== '') params.append('color', filters.color);
  if (filters.size && filters.size.trim() !== '') params.append('size', filters.size);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const url = `${baseUrl}/api/products?${params.toString()}`;
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

export async function fetchProductById(id: string) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/products/${id}`;
  console.log("📡 Llamando a API:", url);

  try {
    const res = await fetch(url, { 
      cache: "no-store",
    });

    console.log("📊 Status de respuesta:", res.status);
    
    if (!res.ok) {
      // Si es 404, intentamos buscar en la lista completa
      if (res.status === 404) {
        console.log("🔍 Producto no encontrado individualmente, buscando en lista...");
        
        // Buscar en lista completa
        const listUrl = `${baseUrl}/api/products?limit=200`;
        const listRes = await fetch(listUrl, { cache: "no-store" });
        
        if (listRes.ok) {
          const listData = await listRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const productFromList = listData.products?.find((p: any) => p.id === id);
          
          if (productFromList) {
            console.log("✅ Producto encontrado en lista completa");
            return productFromList;
          }
        }
        
        console.log("❌ Producto no encontrado en ningún lugar");
        return null;
      }
      
      const errorText = await res.text();
      console.error("❌ Error en respuesta:", res.status, errorText);
      throw new Error(`Failed to fetch product: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Respuesta completa de API:", data);

    const product = data.product || data;
    
    if (!product) {
      console.error("🚨 No se encontró producto en la respuesta");
      return null;
    }

    console.log("✅ Producto extraído:", product.title || product.id);
    return product;
  } catch (error) {
    console.error("🚨 Error en fetchProductById:", error);
    return null;
  }
}

export async function fetchCategoryById(id: string) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/categories/${id}`;
  console.log("📡 Llamando a categoría API:", url);

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error en respuesta de categoría:", res.status, errorText);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("🚨 Error en fetchCategoryById:", error);
    return null;
  }
}

export async function fetchCategories() {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/categories`;
  console.log("📡 Llamando a categorías API:", url);

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error en respuesta de categorías:", res.status, errorText);
      return [];
    }

    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error("🚨 Error en fetchCategories:", error);
    return [];
  }
}


