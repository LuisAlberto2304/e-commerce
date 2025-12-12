/* eslint-disable prefer-const */
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
  categoryId?: string;
  categoryIds?: string[];
  q?: string;
  color?: string;
  size?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  // 🔹 Solo parámetros básicos para la API - NO incluir color/size aquí
  if (filters.categoryIds?.length) {
    params.append("categoryIds", filters.categoryIds.join(","));
  } else if (filters.categoryId) {
    params.append("categoryId", filters.categoryId);
  }

  if (filters.q?.trim()) params.append("q", filters.q.trim());

  // 🔹 Aumentar el límite y expandir relaciones
  params.append("limit", String(filters.limit ?? 20));
  params.append("offset", String(filters.offset ?? 0));

  // 🔹 IMPORTANTE: Expandir todas las relaciones necesarias
  params.append("expand", "variants,variants.options,variants.prices,options,options.values,categories,tags");

  const url = `${baseUrl}/api/products?${params.toString()}`;

  // console.log("📡 fetchProducts - llamada a:", url);
  // console.log("🎯 fetchProducts - filtros (raw):", filters);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ fetchProducts - error response:", res.status, txt);
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    let products: any[] = data.products || [];

    // console.log("✅ fetchProducts - productos recibidos:", products.length);

    // 🔹 DEBUG: Ver estructura de productos
    /* if (products.length > 0) {
      console.log("🔍 Estructura del primer producto:", {
        id: products[0].id,
        title: products[0].title,
        options: products[0].options,
        variants: products[0].variants?.map((v: any) => ({
          id: v.id,
          options: v.options,
          prices: v.prices
        })),
        categories: products[0].categories
      });
    } */

    // 🔹 NOTA: El filtrado por color y tamaño se hará en el cliente
    // para poder manejar correctamente las variantes

    return { ...data, products };
  } catch (err) {
    console.error("🚨 fetchProducts - excepción:", err);
    throw err;
  }
}


export async function fetchProductById(id: string) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/products/${id}`;
  // console.log("📡 Llamando a API:", url);

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    // console.log("📊 Status de respuesta:", res.status);

    if (!res.ok) {
      if (res.status === 404) {
        console.log("❌ Producto no encontrado");
        return null;
      }

      const errorText = await res.text();
      console.error("❌ Error en respuesta:", res.status, errorText);
      throw new Error(`Failed to fetch product: ${res.status}`);
    }

    const data = await res.json();
    // console.log("✅ Respuesta completa de API:", data);

    const product = data.product || data;

    if (!product) {
      console.error("🚨 No se encontró producto en la respuesta");
      return null;
    }

    // console.log("✅ Producto extraído:", product.title || product.id);
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
  // console.log("📡 Llamando a categorías API:", url);

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


