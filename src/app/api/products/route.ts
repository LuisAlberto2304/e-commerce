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
    const limit = url.searchParams.get("limit") || "20"; // Límite por defecto optimizado
    const offset = url.searchParams.get("offset") || "0";



    // 🔹 Construir parámetros para Medusa - EXPANDIR MÁS RELACIONES
    const medusaParams = new URLSearchParams();
    if (categoryId) medusaParams.append("category_id", categoryId);
    if (q) medusaParams.append("q", q);
    medusaParams.append("limit", limit);
    medusaParams.append("offset", offset);

    // 🔹 EXPANSIÓN CORREGIDA - usar comas sin espacios
    // Reducción de carga: eliminados options, options.values, variants.options.option
    medusaParams.append("expand", "categories,variants,images,tags,collection,variants.prices");

    const medusaUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/products?${medusaParams.toString()}`;


    const res = await fetch(medusaUrl, {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      // console.error("❌ Error de Medusa:", res.status, errorText);
      return NextResponse.json(
        { error: "No se pudieron obtener los productos de Medusa", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    let products = data.products || [];



    // 🔹 Filtrado local por categorías múltiples (mantener este)
    if (categoryIds.length > 0) {
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


    }
    // 🔹 Filtrado local si solo hay una categoría individual (mantener este)
    else if (categoryId) {
      products = products.filter((product: any) => {
        const categoryIds = [
          product.category_id,
          product.category?.id,
          ...(product.categories?.map((c: any) => c.id) || []),
        ].filter(Boolean);

        const matches = categoryIds.some((id: string) => id?.toLowerCase() === categoryId.toLowerCase());
        return matches;
      });


    }

    // 🔍 Filtro local por q (búsqueda) - mantener este
    if (q && q.trim() !== "") {
      const searchTerm = q.toLowerCase().trim();

      products = products.filter((product: any) => product.title?.toLowerCase().startsWith(searchTerm));

    }

    // 🔹 IMPORTANTE: NO filtrar por color y tamaño aquí
    // El filtrado por color y tamaño se hará en el cliente para manejar variantes
    // El filtrado por color y tamaño se hará en el cliente para manejar variantes


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