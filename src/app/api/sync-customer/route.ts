import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const medusaBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!medusaBase) {
      return NextResponse.json({ error: "No MEDUSA backend configured" }, { status: 500 });
    }

    const medusaUrl = `${medusaBase}/customer`;

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

// ⬇️ NUEVO: Manejar GET requests
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    const medusaBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    if (!medusaBase) {
      return NextResponse.json({ error: "No MEDUSA backend configured" }, { status: 500 });
    }

    const medusaUrl = `${medusaBase}/customer`;

    const res = await fetch(medusaUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || ""
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: "Medusa error", details: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error proxying to Medusa /customer GET:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}