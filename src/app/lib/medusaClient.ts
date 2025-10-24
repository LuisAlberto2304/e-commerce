/* eslint-disable @typescript-eslint/no-explicit-any */
// app/lib/medusaClient.ts


function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function includesLower(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.toLowerCase().includes(b.toLowerCase());
}

function matchesColor(product: any, colorTerm: string) {
  if (!colorTerm) return true;

  // 1) metadata
  if (product.metadata?.color && includesLower(product.metadata.color, colorTerm)) return true;

  // 2) tags
  if (Array.isArray(product.tags) && product.tags.some((t: string) => includesLower(t, colorTerm))) return true;

  // 3) product.options (Medusa product-level options: option.values)
  if (Array.isArray(product.options)) {
    for (const opt of product.options) {
      if (opt.title && opt.title.toLowerCase().includes("color") && Array.isArray(opt.values)) {
        if (opt.values.some((v: any) => includesLower(v.value, colorTerm))) return true;
      }
    }
  }

    // 4) variants -> variant.options
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (Array.isArray(v.options)) {
        for (const o of v.options) {
          if (includesLower(o.value, colorTerm)) return true;
        }
      }
    }
  }


  // 5) title / description
  if (includesLower(product.title, colorTerm) || includesLower(product.description, colorTerm)) return true;

  return false;
}

function matchesSize(product: any, sizeTerm: string) {
  if (!sizeTerm) return true;

  // 1) metadata
  if (product.metadata?.size && includesLower(product.metadata.size, sizeTerm)) return true;

  // 2) tags
  if (Array.isArray(product.tags) && product.tags.some((t: string) => includesLower(t, sizeTerm))) return true;

  // 3) product.options
  if (Array.isArray(product.options)) {
    for (const opt of product.options) {
      if (opt.title && opt.title.toLowerCase().includes("size") && Array.isArray(opt.values)) {
        if (opt.values.some((v: any) => includesLower(v.value, sizeTerm))) return true;
      }
    }
  }

  if (Array.isArray(product.variants)) {
  for (const v of product.variants) {
    if (Array.isArray(v.options)) {
      for (const o of v.options) {
        if (includesLower(o.value, sizeTerm)) return true;
      }
    }
  }
}


  return false;
}

export async function fetchProducts(filters: {
  categoryId?: string;      // ← sigue permitiendo una sola categoría
  categoryIds?: string[];   // ← permite varias categorías
  q?: string;
  color?: string;
  size?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  // 🔹 Si hay varias categorías, las unimos en una sola cadena separada por comas
  if (filters.categoryIds?.length) {
    params.append("categoryIds", filters.categoryIds.join(",")); // Ejemplo: cat_a,cat_b,cat_c
  } 
  // 🔹 Si solo hay una categoría individual
  else if (filters.categoryId) {
    params.append("categoryId", filters.categoryId);
  }

  if (filters.q?.trim()) params.append("q", filters.q.trim());
  if (filters.color?.trim()) params.append("color", filters.color.trim());  // ✅ NUEVO
  if (filters.size?.trim()) params.append("size", filters.size.trim());
  params.append("limit", String(filters.limit ?? 100));
  params.append("offset", String(filters.offset ?? 0));

  const url = `${baseUrl}/api/products?${params.toString()}`;

  console.log("📡 fetchProducts - llamada a:", url);
  console.log("🎯 fetchProducts - filtros (raw):", filters);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ fetchProducts - error response:", res.status, txt);
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    let products: any[] = data.products || [];

    // Normalizar términos para filtrado local
    const colorTerm = filters.color?.trim().toLowerCase() || undefined;
    const sizeTerm = filters.size?.trim().toLowerCase() || undefined;

    console.log("🔎 fetchProducts - productos recibidos:", products.length, { colorTerm, sizeTerm });

    // Filtrado local (color/size)
    if (colorTerm) {
      const before = products.length;
      products = products.filter((p) => matchesColor(p, colorTerm));
      console.log(`🎨 Filtrado color "${colorTerm}": ${before} → ${products.length}`);
    }

    if (sizeTerm) {
      const before = products.length;
      products = products.filter((p) => matchesSize(p, sizeTerm));
      console.log(`📏 Filtrado size "${sizeTerm}": ${before} → ${products.length}`);
    }

    console.log("✅ fetchProducts - productos finales devueltos:", products.length);
    return { ...data, products };
  } catch (err) {
    console.error("🚨 fetchProducts - excepción:", err);
    throw err;
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


