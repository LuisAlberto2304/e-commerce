import { NextResponse } from "next/server";

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log("🔍 Fetching product ID:", id);

    if (!MEDUSA_BACKEND_URL) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 }
      );
    }

    const url = `${MEDUSA_BACKEND_URL}/store/products/${id}`;
    console.log("🔍 Calling Medusa:", url);

    const res = await fetch(url, {
      headers: MEDUSA_API_KEY
        ? { "x-publishable-api-key": MEDUSA_API_KEY }
        : {},
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Medusa error:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // CORRECCIÓN: Devolver el producto directamente en lugar de data.product
    return NextResponse.json(data.product || data);

  } catch (error) {
    console.error("🚨 API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}