// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { items, total, guest, ...rest } = data;

    if (!items?.length || !total) {
      return NextResponse.json(
        { error: "Faltan datos para crear la orden" },
        { status: 400 }
      );
    }

    // 🔹 Simulación de "orden creada"
    const mockOrder = {
      id: `order_${Math.random().toString(36).slice(2, 10)}`,
      date: new Date().toISOString(),
      status: "pending",
      total,
      guest,
      ...rest,
    };

    console.log("🧾 Orden simulada:", mockOrder);

    return NextResponse.json(mockOrder, { status: 201 });
  } catch (err) {
    console.error("Error al crear la orden:", err);
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}
