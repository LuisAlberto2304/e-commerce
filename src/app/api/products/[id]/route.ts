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

    // console.log("🔍 ========== DEBUG PRODUCTO INDIVIDUAL ==========");
    // console.log("🔍 ID recibido:", id);
    // console.log("🔍 Medusa URL:", MEDUSA_BACKEND_URL);

    if (!MEDUSA_BACKEND_URL) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 }
      );
    }

    // Ahora intentamos obtener el producto individual
    // console.log("🔍 Intentando obtener producto individual...");
    const url = `${MEDUSA_BACKEND_URL}/products/${id}?expand=variants,variants.options,variants.prices,variants.images`;
    // console.log("🔍 URL individual:", url);

    const res = await fetch(url, {
      headers: MEDUSA_API_KEY ? { "x-publishable-api-key": MEDUSA_API_KEY } : {},
    });

    // console.log("📊 Status individual:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error de Medusa individual:", res.status, errorText);

      return NextResponse.json(
        { error: `Product not found: ${id}` },
        { status: 404 }
      );
    }

    const data = await res.json();
    // console.log("✅ Respuesta individual completa:", JSON.stringify(data, null, 2));

    return NextResponse.json(data);

  } catch (error) {
    console.error("🚨 API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}