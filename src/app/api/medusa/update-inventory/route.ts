import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { items } = await req.json();

    // Recorrer items y ajustar stock uno por uno
    const results = [];
    for (const item of items) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/variants/${item.variant_id}/inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY}`,
          },
          body: JSON.stringify({
            type: "set",          // "set" para poner cantidad exacta o "adjust" para incrementar/decrementar
            quantity: item.quantity
          }),
        }
      );
      const data = await res.json();
      results.push(data);
    }

    console.log("✅ Inventario actualizado:", results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("❌ Error general en update-inventory:", error);
    return NextResponse.json(
      { error: "Fallo al conectar con Medusa" },
      { status: 500 }
    );
  }
}
