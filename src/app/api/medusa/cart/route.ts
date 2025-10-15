import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY || "",
        },
      }
    );

    console.log("📡 Medusa status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Error al crear carrito en Medusa:", text);
      return NextResponse.json(
        { error: "Error al crear el carrito en Medusa", details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ Carrito creado correctamente:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error general en /cart:", error);
    return NextResponse.json(
      { error: "Fallo de conexión o error interno" },
      { status: 500 }
    );
  }
}
