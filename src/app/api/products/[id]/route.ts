/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log("🔍 ========== DEBUG PRODUCTO INDIVIDUAL ==========");
    console.log("🔍 ID recibido:", id);
    console.log("🔍 Medusa URL:", MEDUSA_BACKEND_URL);

    if (!MEDUSA_BACKEND_URL) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 }
      );
    }

    // Primero, vamos a listar TODOS los productos para debug
    console.log("🔍 Listando todos los productos para debug...");
    const listUrl = `${MEDUSA_BACKEND_URL}/products?limit=100`;
    const listRes = await fetch(listUrl, {
      headers: MEDUSA_API_KEY ? { "x-publishable-api-key": MEDUSA_API_KEY } : {},
    });

    if (listRes.ok) {
      const listData = await listRes.json();
      const allProducts = listData.products || [];
      console.log(`🔍 Total de productos en Medusa: ${allProducts.length}`);
      
      // Buscar el producto específico en la lista
      const foundProduct = allProducts.find((p: any) => p.id === id);
      console.log("🔍 Producto encontrado en lista:", foundProduct ? "SÍ" : "NO");
      
      if (foundProduct) {
        console.log("🔍 Producto en lista:", {
          id: foundProduct.id,
          title: foundProduct.title,
          status: foundProduct.status,
          variants: foundProduct.variants?.length
        });
      } else {
        console.log("🔍 IDs disponibles:", allProducts.map((p: any) => p.id));
      }
    }

    // Ahora intentamos obtener el producto individual
    console.log("🔍 Intentando obtener producto individual...");
    const url = `${MEDUSA_BACKEND_URL}/products/${id}`;
    console.log("🔍 URL individual:", url);

    const res = await fetch(url, {
      headers: MEDUSA_API_KEY ? { "x-publishable-api-key": MEDUSA_API_KEY } : {},
    });

    console.log("📊 Status individual:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error de Medusa individual:", res.status, errorText);
      
      return NextResponse.json(
        { error: `Product not found: ${id}` },
        { status: 404 }
      );
    }

    const data = await res.json();
    console.log("✅ Respuesta individual completa:", JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);

  } catch (error) {
    console.error("🚨 API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}