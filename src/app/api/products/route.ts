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
    const limit = url.searchParams.get("limit") || "200"; // Aumentar límite
    const offset = url.searchParams.get("offset") || "0";

    console.log("🎯 FILTROS RECIBIDOS EN BACKEND:", {
      categoryId,
      categoryIds,
      q,
      color,
      size,
      limit,
      offset,
    });

    // 🔹 Construir parámetros para Medusa - EXPANDIR MÁS RELACIONES
    const medusaParams = new URLSearchParams();
    if (categoryId) medusaParams.append("category_id", categoryId);
    if (q) medusaParams.append("q", q);
    medusaParams.append("limit", limit);
    medusaParams.append("offset", offset);

    // 🔹 EXPANSIÓN CORREGIDA - usar comas sin espacios
    medusaParams.append("expand", "categories,category,options,options.values,variants,variants.options,variants.prices,images,tags,collection,variants.options.option");

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

    console.log("🔍 DEBUG ESTRUCTURA MEDUSA - PRIMER PRODUCTO:", products[0] ? {
      id: products[0].id,
      title: products[0].title,
      options: products[0].options?.map((opt: any) => ({
        title: opt.title,
        values: opt.values?.map((v: any) => v.value)
      })),
      variants: products[0].variants?.map((v: any) => ({
        id: v.id,
        options: v.options?.map((o: any) => ({
          value: o.value,
          option_title: o.option?.title
        }))
      })),
      categories: products[0].categories
    } : "No products");

    // 🔹 Filtrado local por categorías múltiples (mantener este)
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
        return productCats.some((id: string) =>
          categoryIds.some(cid => id.toLowerCase() === cid.toLowerCase())
        );
      });

      console.log(`🎯 RESULTADO FILTRO MULTICATEGORÍA: ${before} → ${products.length}`);
    }
    // 🔹 Filtrado local si solo hay una categoría individual (mantener este)
    else if (categoryId) {
      const before = products.length;
      console.log(`🎯 APLICANDO FILTRO MANUAL POR CATEGORÍA: ${categoryId}`);

      products = products.filter((product: any) => {
        const categoryIds = [
          product.category_id,
          product.category?.id,
          ...(product.categories?.map((c: any) => c.id) || []),
        ].filter(Boolean);

        const matches = categoryIds.some((id: string) => id?.toLowerCase() === categoryId.toLowerCase());
        return matches;
      });

      console.log(`🎯 RESULTADO FILTRO CATEGORÍA: ${before} → ${products.length}`);
    }

    // 🔍 Filtro local por q (búsqueda) - mantener este
    if (q && q.trim() !== "") {
      const searchTerm = q.toLowerCase().trim();
      const beforeCount = products.length;

      console.log(`🔍 APLICANDO FILTRO LOCAL POR TÍTULO QUE EMPIEZA CON: "${searchTerm}"`);
      products = products.filter((product: any) => product.title?.toLowerCase().startsWith(searchTerm));
      console.log(`🔍 RESULTADO FILTRO Q: ${beforeCount} → ${products.length}`);
    }

    // 🔹 IMPORTANTE: NO filtrar por color y tamaño aquí
    // El filtrado por color y tamaño se hará en el cliente para manejar variantes
    console.log("ℹ️  Filtrado por color y tamaño se realizará en el cliente");

    console.log("✅ PRODUCTOS FINALES PARA CLIENTE:", products.length);
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