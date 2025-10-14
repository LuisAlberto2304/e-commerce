import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const medusaBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!medusaBase) {
      return NextResponse.json({ error: "No MEDUSA backend configured" }, { status: 500 });
    }

    const medusaUrl = `${medusaBase}/customer`;

    // Llamada server-side: evita CORS/preflight del navegador
    const res = await fetch(medusaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || ""
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: "Medusa error", details: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error proxying to Medusa /customer:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}