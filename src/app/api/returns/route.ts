/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, reason } = await req.json();

    const medusaBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const apiKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    const res = await fetch(`${medusaBase}/admin/returns`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        items,
        note: reason || "Solicitud de devolución",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: "Error en devolución", details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error creando devolución:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
