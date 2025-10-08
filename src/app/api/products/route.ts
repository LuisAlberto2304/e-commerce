/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // 🔹 Soportar tanto categoryId (único) como categoryIds (múltiples)
    const categoryId = url.searchParams.get("categoryId") || url.searchParams.get("category_id") || undefined;
    const categoryIdsParam = url.searchParams.get("categoryIds") || undefined;
    const categoryIds = categoryIdsParam ? categoryIdsParam.split(",") : [];

    const q = url.searchParams.get("q") || undefined;
    const color = url.searchParams.get("color") || undefined;
    const size = url.searchParams.get("size") || undefined;
    const limit = url.searchParams.get("limit") || "100";
    const offset = url.searchParams.get("offset") || "0";

    console.log("🎯 FILTROS RECIBIDOS EN BACKEND:", {
      categoryId,
      categoryIds,
      q,
      color,
      size,
      limit,
      offset,
      tieneColor: !!color,
      tieneSize: !!size
    });

    // 🔹 Construir parámetros para Medusa (solo 1 categoría, por compatibilidad)
    const medusaParams = new URLSearchParams();
    if (categoryId) medusaParams.append("category_id", categoryId);
    if (q) medusaParams.append("q", q);
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
      firstProduct: products[0]
        ? {
            id: products[0].id,
            title: products[0].title,
            category: products[0].category,
            categories: products[0].categories,
            category_id: products[0].category_id,
          }
        : "No products",
    });

    // 🔹 Filtrado local por categorías múltiples
    if (categoryIds.length > 0) {
      const before = products.length;
      console.log(`🎯 APLICANDO FILTRO POR MÚLTIPLES CATEGORÍAS: ${categoryIds.join(", ")}`);

      products = products.filter((product: any) => {
        const productCats = [
          product.category_id,
          product.category?.id,
          ...(product.categories?.map((c: any) => c.id) || []),
        ].filter(Boolean);

        // Verifica si alguna categoría del producto coincide con las seleccionadas
        return productCats.some((id: string) => categoryIds.includes(id));
      });

      console.log(`🎯 RESULTADO FILTRO MULTICATEGORÍA: ${before} → ${products.length}`);
    }
    // 🔹 Filtrado local si solo hay una categoría individual
    else if (categoryId) {
      const before = products.length;
      console.log(`🎯 APLICANDO FILTRO MANUAL POR CATEGORÍA: ${categoryId}`);

      products = products.filter((product: any) => {
        const matches =
          product.category_id === categoryId ||
          product.category?.id === categoryId ||
          (product.categories && product.categories.some((cat: any) => cat.id === categoryId));

        return matches;
      });

      console.log(`🎯 RESULTADO FILTRO CATEGORÍA: ${before} → ${products.length}`);
    }

    // 🔍 Filtro local por q (búsqueda)
    if (q && q.trim() !== "") {
      const searchTerm = q.toLowerCase().trim();
      const beforeCount = products.length;

      console.log(`🔍 APLICANDO FILTRO LOCAL POR TÍTULO QUE EMPIEZA CON: "${searchTerm}"`);
      products = products.filter((product: any) => product.title?.toLowerCase().startsWith(searchTerm));
      console.log(`🔍 RESULTADO FILTRO Q: ${beforeCount} → ${products.length}`);
    }

    // 🎨 Filtrado color y 📏 talla (sin cambios)
    if (color && color.trim() !== "") {
      const colorTerm = color.toLowerCase().trim();
      const beforeCount = products.length;

      products = products.filter((product: any) => {
        let match = false;
        if (product.options) {
          match = product.options.some((option: any) =>
            option.values?.some((v: any) => v.value?.toLowerCase().includes(colorTerm))
          );
        }
        if (!match && product.variants) {
          match = product.variants.some((variant: any) =>
            variant.options?.some((opt: any) => opt.value?.toLowerCase().includes(colorTerm))
          );
        }
        if (!match && product.metadata?.color) {
          match = product.metadata.color.toLowerCase().includes(colorTerm);
        }
        return match;
      });

      console.log(`🎨 RESULTADO FILTRO COLOR: ${beforeCount} → ${products.length}`);
    }

    if (size && size.trim() !== "") {
      const sizeTerm = size.toLowerCase().trim();
      const beforeCount = products.length;

      products = products.filter((product: any) => {
        let match = false;
        if (product.options) {
          match = product.options.some((option: any) =>
            option.values?.some((v: any) => v.value?.toLowerCase().includes(sizeTerm))
          );
        }
        if (!match && product.variants) {
          match = product.variants.some((variant: any) =>
            variant.options?.some((opt: any) => opt.value?.toLowerCase().includes(sizeTerm))
          );
        }
        if (!match && product.metadata?.size) {
          match = product.metadata.size.toLowerCase().includes(sizeTerm);
        }
        return match;
      });

      console.log(`📏 RESULTADO FILTRO SIZE: ${beforeCount} → ${products.length}`);
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
