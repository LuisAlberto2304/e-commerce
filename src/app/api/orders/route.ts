/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Falta el email" }, { status: 400 });
  }

  const medusaBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

  try {
    const res = await fetch(`${medusaBase}/admin/orders?expand=items,customer`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    // Filtramos solo las órdenes del usuario
    const userOrders = data.orders?.filter(
      (order: any) => order.customer?.email === email
    );

    return NextResponse.json({ orders: userOrders });
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
