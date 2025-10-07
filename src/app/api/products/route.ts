/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

// En tu app/api/products/route.ts - DEBUG COMPLETO DE FILTROS
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId") || url.searchParams.get("category_id") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const color = url.searchParams.get("color") || undefined;
    const size = url.searchParams.get("size") || undefined;
    const limit = url.searchParams.get("limit") || "100";
    const offset = url.searchParams.get("offset") || "0";

    console.log("🎯 FILTROS RECIBIDOS EN BACKEND:", {
      categoryId,
      q,
      color,
      size,
      limit,
      offset,
      tieneColor: !!color,
      tieneSize: !!size
    });

    // Construir parámetros para Medusa
    const medusaParams = new URLSearchParams();
    
    if (categoryId) {
      medusaParams.append("category_id", categoryId);
    }
    
    if (q) {
      medusaParams.append("q", q);
    }
    
    medusaParams.append("limit", limit);
    medusaParams.append("offset", offset);
    medusaParams.append("expand", "options,variants,variants.options,variants.prices");

    const medusaUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/products?${medusaParams.toString()}`;
    console.log("📡 Llamando a Medusa:", medusaUrl);

    const res = await fetch(medusaUrl, {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error de Medusa:", res.status, errorText);
      return NextResponse.json(
        { error: "No se pudieron obtener los productos de Medusa", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    let products = data.products || [];
    
    console.log("🔍 DEBUG ESTRUCTURA MEDUSA:", {
      totalProducts: products.length,
      firstProduct: products[0] ? {
        id: products[0].id,
        title: products[0].title,
        category: products[0].category, // Ver si existe
        categories: products[0].categories, // O esta
        category_id: products[0].category_id // O esta
      } : 'No products'
    });

    // Verifica si los productos tienen la categoría filtrada
    if (categoryId && products.length > 0) {
      console.log("🎯 VERIFICANDO CATEGORÍAS EN PRODUCTOS:");
      products.forEach((product: any, index: number) => {
        console.log(`   Producto ${index}: ${product.title}`);
        console.log(`   - category: ${product.category}`);
        console.log(`   - category_id: ${product.category_id}`);
        console.log(`   - categories: ${JSON.stringify(product.categories)}`);
      });
    }

    // 🔥 DEBUG COMPLETO DE FILTRADO LOCAL
    console.log("🎯 INICIANDO FILTRADO LOCAL:", {
      productosAntesFiltros: products.length,
      filtroColor: color,
      filtroSize: size,
      aplicarFiltroColor: !!color && color.trim() !== '',
      aplicarFiltroSize: !!size && size.trim() !== ''
    });

    if (categoryId) {
      const beforeCount = products.length;
      console.log(`🎯 APLICANDO FILTRO MANUAL POR CATEGORÍA: ${categoryId}`);
      
      products = products.filter((product: any) => {
        const matches = 
          product.category_id === categoryId ||
          product.category?.id === categoryId ||
          (product.categories && product.categories.some((cat: any) => cat.id === categoryId));
        
        return matches;
      });
      
      console.log(`🎯 RESULTADO FILTRO CATEGORÍA: ${beforeCount} → ${products.length} productos`);
    }

    // Filtrar localmente por búsqueda exacta si hay "q"
  if (q && q.trim() !== "") {
    const searchTerm = q.toLowerCase().trim();
    const beforeCount = products.length;

    console.log(`🔍 APLICANDO FILTRO LOCAL POR TÍTULO QUE EMPIEZA CON: "${searchTerm}"`);

    products = products.filter((product: any) =>
      product.title?.toLowerCase().startsWith(searchTerm)
    );

    console.log(`🔍 RESULTADO FILTRO Q: ${beforeCount} → ${products.length} productos`);
  }


    // Filtrar localmente por color - CON DEBUG DETALLADO
    if (color && color.trim() !== '') {
      const colorTerm = color.toLowerCase().trim();
      const beforeCount = products.length;
      
      console.log(`🎨 APLICANDO FILTRO COLOR: "${colorTerm}"`);
      
      products = products.filter((product: any) => {
        let match = false;
        
        // 1. Buscar en options
        if (product.options && product.options.length > 0) {
          console.log(`   🔍 Producto "${product.title}" - Options:`, product.options);
          
          match = product.options.some((option: any) => {
            const isColorOption = option.title?.toLowerCase().includes('color');
            console.log(`   🎯 Opción "${option.title}": esColor? ${isColorOption}`);
            
            if (isColorOption && option.values) {
              return option.values.some((value: any) => {
                const valueMatch = value.value?.toLowerCase().includes(colorTerm);
                console.log(`      📌 Valor "${value.value}": match? ${valueMatch}`);
                return valueMatch;
              });
            }
            return false;
          });
        }

        // 2. Buscar en variants si no hay match
        if (!match && product.variants && product.variants.length > 0) {
          console.log(`   🔍 Producto "${product.title}" - Buscando en variants`);
          
          match = product.variants.some((variant: any, index: number) => {
            if (variant.options && variant.options.length > 0) {
              return variant.options.some((option: any) => {
                const valueMatch = option.value?.toLowerCase().includes(colorTerm);
                if (valueMatch) {
                  console.log(`      ✅ Match en variant ${index}: "${option.value}"`);
                }
                return valueMatch;
              });
            }
            return false;
          });
        }

        // 3. Buscar en metadata
        if (!match && product.metadata) {
          const metadataColor = product.metadata.color;
          if (metadataColor) {
            match = metadataColor.toLowerCase().includes(colorTerm);
            console.log(`   🔍 Metadata color "${metadataColor}": match? ${match}`);
          }
        }

        console.log(`   🎯 Producto "${product.title}": ${match ? '✅ INCLUIDO' : '❌ EXCLUIDO'}`);
        return match;
      });
      
      console.log(`🎨 RESULTADO FILTRO COLOR: ${beforeCount} → ${products.length} productos`);
    }

    // Filtrar localmente por talla - CON DEBUG DETALLADO
    if (size && size.trim() !== '') {
      const sizeTerm = size.toLowerCase().trim();
      const beforeCount = products.length;
      
      console.log(`📏 APLICANDO FILTRO TALLA: "${sizeTerm}"`);
      
      products = products.filter((product: any) => {
        let match = false;
        
        // 1. Buscar en options
        if (product.options && product.options.length > 0) {
          match = product.options.some((option: any) => {
            const isSizeOption = option.title?.toLowerCase().includes('size');
            if (isSizeOption && option.values) {
              return option.values.some((value: any) => {
                const valueMatch = value.value?.toLowerCase().includes(sizeTerm);
                if (valueMatch) {
                  console.log(`      ✅ Match size en option: "${value.value}"`);
                }
                return valueMatch;
              });
            }
            return false;
          });
        }

        // 2. Buscar en variants si no hay match
        if (!match && product.variants && product.variants.length > 0) {
          match = product.variants.some((variant: any) => {
            if (variant.options && variant.options.length > 0) {
              return variant.options.some((option: any) => {
                const valueMatch = option.value?.toLowerCase().includes(sizeTerm);
                if (valueMatch) {
                  console.log(`      ✅ Match size en variant: "${option.value}"`);
                }
                return valueMatch;
              });
            }
            return false;
          });
        }

        // 3. Buscar en metadata
        if (!match && product.metadata) {
          const metadataSize = product.metadata.size;
          if (metadataSize) {
            match = metadataSize.toLowerCase().includes(sizeTerm);
            console.log(`   🔍 Metadata size "${metadataSize}": match? ${match}`);
          }
        }

        console.log(`   🎯 Producto "${product.title}": ${match ? '✅ INCLUIDO' : '❌ EXCLUIDO'}`);
        return match;
      });
      
      console.log(`📏 RESULTADO FILTRO TALLA: ${beforeCount} → ${products.length} productos`);
    }

    console.log("✅ PRODUCTOS FINALES:", products.length);

    return NextResponse.json({
      products,
      count: products.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error("🚨 Error en API route:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}