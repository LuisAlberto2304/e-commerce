/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const color = url.searchParams.get("color") || undefined;
    const size = url.searchParams.get("size") || undefined;
    const limit = url.searchParams.get("limit") || "100"; // Aumentar límite para filtrar localmente
    const offset = url.searchParams.get("offset") || "0";

    // Primero, obtener TODOS los productos de Medusa (sin filtros complejos)
    const medusaParams = new URLSearchParams();
    
    if (categoryId) {
      medusaParams.append("category_id[]", categoryId);
    }
    
    if (q) {
      medusaParams.append("q", q);
    }
    
    medusaParams.append("limit", limit);
    medusaParams.append("offset", offset);

    console.log("🔍 Llamando a Medusa con:", medusaParams.toString());

    const res = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/products?${medusaParams.toString()}`,
    {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

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
    
    console.log("📦 Productos crudos de Medusa:", products.length);

    // Filtrar localmente por color si es necesario
    if (color && color.trim() !== '') {
      const colorTerm = color.toLowerCase().trim();
      products = products.filter((product: any) => {
        // Buscar en options
        if (product.options) {
          const hasColor = product.options.some((option: any) => {
            if (option.title?.toLowerCase().includes('color')) {
              return option.values?.some((value: any) => 
                value.value?.toLowerCase().includes(colorTerm)
              );
            }
            return false;
          });
          if (hasColor) return true;
        }
        
        // Buscar en variants
        if (product.variants) {
          const hasColor = product.variants.some((variant: any) => 
            variant.options?.some((option: any) => 
              option.value?.toLowerCase().includes(colorTerm)
            )
          );
          if (hasColor) return true;
        }
        
        // Buscar en metadata
        if (product.metadata?.color) {
          return product.metadata.color.toLowerCase().includes(colorTerm);
        }
        
        return false;
      });
      console.log("🎨 Productos después de filtrar por color:", products.length);
    }

    // Filtrar localmente por talla si es necesario
    if (size && size.trim() !== '') {
      const sizeTerm = size.toLowerCase().trim();
      products = products.filter((product: any) => {
        // Buscar en options
        if (product.options) {
          const hasSize = product.options.some((option: any) => {
            if (option.title?.toLowerCase().includes('size')) {
              return option.values?.some((value: any) => 
                value.value?.toLowerCase().includes(sizeTerm)
              );
            }
            return false;
          });
          if (hasSize) return true;
        }
        
        // Buscar en variants
        if (product.variants) {
          const hasSize = product.variants.some((variant: any) => 
            variant.options?.some((option: any) => 
              option.value?.toLowerCase().includes(sizeTerm)
            )
          );
          if (hasSize) return true;
        }
        
        // Buscar en metadata
        if (product.metadata?.size) {
          return product.metadata.size.toLowerCase().includes(sizeTerm);
        }
        
        return false;
      });
      console.log("📏 Productos después de filtrar por talla:", products.length);
    }

    console.log("✅ Productos finales:", products.length);

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