import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // console.log("Llamando a Medusa Categories...");

    const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/product-categories`, {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_API_KEY!,
        "Content-Type": "application/json",
      },
    });


    console.log("Status de la respuesta:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("Error de Medusa:", text);
      return NextResponse.json({ error: "No se pudieron obtener las categorías" }, { status: 500 });
    }

    const data = await res.json();
    // console.log("Datos recibidos:", data);
    return NextResponse.json(data.product_categories);
  } catch (err) {
    console.error("Excepción:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
