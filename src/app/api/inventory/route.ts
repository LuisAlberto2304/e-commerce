/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { variantId, quantity } = await req.json();

    if (!variantId || !quantity) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const apiKey = process.env.MEDUSA_ADMIN_API_KEY;

    console.log(`📦 Actualizando inventario: ${variantId} - ${quantity} unidades`);
    console.log(`🔑 API Key presente: ${!!apiKey}`);

    // 🔹 Consultar la variante actual (endpoint público)
    console.log(`🔍 Consultando variante: ${variantId}`);
    const variantRes = await fetch(`${medusaUrl}/store/variants/${variantId}`);
    
    if (!variantRes.ok) {
      throw new Error(`Error al obtener variante: ${variantRes.status}`);
    }

    const variantData = await variantRes.json();
    const variant = variantData.variant;
    
    if (!variant) {
      throw new Error("Variante no encontrada");
    }

    const currentQty = variant.inventory_quantity ?? variant.total_quantity ?? 0;
    const newQty = Math.max(0, currentQty - quantity);

    console.log(`🔄 Stock actual: ${currentQty}, Nuevo stock: ${newQty}`);

    // 🔹 Actualizar inventario (endpoint de administración)
    console.log(`✏️ Actualizando inventario en Medusa...`);
    const updateRes = await fetch(`${medusaUrl}/admin/variants/${variantId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inventory_quantity: newQty,
      }),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error(`❌ Error de Medusa: ${errorText}`);
      throw new Error(`Error al actualizar inventario: ${updateRes.status}`);
    }

    const updateResult = await updateRes.json();
    console.log(`✅ Inventario actualizado correctamente`);

    return NextResponse.json({ 
      success: true, 
      message: "Inventario actualizado correctamente",
      variantId,
      quantityReduced: quantity,
      previousStock: currentQty,
      newStock: newQty,
      productTitle: variant.product?.title
    });

  } catch (error: any) {
    console.error("❌ Error en inventory route:", error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}